package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"

	"isolated/database"
	"isolated/fs"
	"isolated/image"
	"isolated/log"
)

type Server struct {
	Database         *sql.DB
	ThumbnailDir     string
	ToUpdateDirQueue chan string
}

type imageResponse struct {
	AbsolutePath  string `json:"path"`
	ThumbnailPath string `json:"thumbnail"`
	Width         int    `json:"width"`
	Height        int    `json:"height"`
}

type listResponse struct {
	Images []imageResponse `json:"images"`
}

// List directory request
//
// Immediately respond with known images (dimensions, paths, thumbnails) in
// given absolute path, and kick off update in background
//
// Image list may be partial: only what is known in database at the time
func (s *Server) ListDirHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	pathEscaped := strings.TrimPrefix(r.URL.Path, "/list/")
	requestPath, err := url.PathUnescape(pathEscaped)
	if err != nil {
		err = errors.Wrapf(err, "dirPathFromUrl(%q)", r.URL.Path)
		log.Errorf("%v", err)
		http.Error(w, err.Error(), 400)
	}

	// Path url cannot start with even escaped path
	// Add back if unix path
	dirPath := requestPath
	if !fs.IsWindowsPath(dirPath) {
		dirPath = filepath.Join("/", requestPath)
	}

	log.Infof("List %q %q", r.URL.Path, dirPath)

	s.ToUpdateDirQueue <- dirPath

	knownFiles, err := database.GetDir(ctx, s.Database, dirPath)
	if err != nil {
		err = errors.Wrapf(err, "GetDir(%q)", dirPath)
		log.Errorf("%v", err)
		http.Error(w, err.Error(), 500)
	}

	response := listResponse{[]imageResponse{}}
	for _, dbRecord := range knownFiles {
		response.Images = append(response.Images, imageResponse{
			AbsolutePath:  dbRecord.AbsolutePath,
			ThumbnailPath: dbRecord.ThumbnailPath,
			Width:         dbRecord.Width,
			Height:        dbRecord.Height,
		})
	}

	json, err := json.MarshalIndent(response, "", "  ")
	if err != nil {
		err = errors.Wrapf(err, "json.Marshal(%+v)", response)
		log.Errorf("%v", err)
		http.Error(w, err.Error(), 500)
	}

	fmt.Fprintf(w, string(json))
}

func (s *Server) Updater(ctx context.Context, thumbnailDir string) {
	for dir := range s.ToUpdateDirQueue {
		log.Infof("Updating directory: %s", dir)

		files, err := ioutil.ReadDir(dir)
		if err != nil {
			err = errors.Wrapf(err, "ReadDir(%q)", dir)
			log.Errorf("%v", err)
			continue
		}

		knownFiles, err := database.GetDir(ctx, s.Database, dir)
		if err != nil {
			err = errors.Wrapf(err, "database.GetDir(%q)", dir)
			log.Errorf("%v", err)
			continue
		}

		// TODO: this should map to an array of files
		byPath := make(map[string]*database.File)
		for _, f := range knownFiles {
			byPath[f.AbsolutePath] = f
		}

		for _, f := range files {
			if !f.IsDir() && image.Supported(f.Name()) {
				absPath := filepath.Join(dir, f.Name())

				// Update file if
				// 1. not in database
				// 2. file mod time > recorded last mod time
				shouldUpdate := false
				dbRecord, ok := byPath[absPath]
				if !ok {
					shouldUpdate = true
				} else {
					modTime, err := fs.ModifiedTime(absPath)
					if err != nil {
						err = errors.Wrapf(err, "fs.ModifiedTime(%q)", absPath)
						log.Errorf("%v", err)
						continue
					}

					if modTime.After(dbRecord.LastModified) {
						shouldUpdate = true
					}
				}

				if shouldUpdate {
					err := s.updateImageMetadata(ctx, absPath)
					if err != nil {
						err = errors.Wrapf(err, "updateImageMetadata(%q)", absPath)
						log.Errorf("%v", err)
						continue
					}
				}
			}
		}
	}
}

func (s *Server) updateImageMetadata(ctx context.Context, imagePath string) error {
	modTime, err := fs.ModifiedTime(imagePath)
	if err != nil {
		return errors.Wrapf(err, "ModifiedTime(%q)", imagePath)
	}

	hash, err := fs.Hash(imagePath)
	if err != nil {
		return errors.Wrapf(err, "Hash(%q)", imagePath)
	}

	thumbDest := filepath.Join(s.ThumbnailDir, fmt.Sprintf("%s.jpg", hash))
	_, exists, err := fs.Stat(thumbDest)
	// Todo: handle if exists
	if !exists && err == nil {
		log.Infof("Writing thumbnail for %q to %q", imagePath, thumbDest)
		err := image.WriteThumbnail(imagePath, thumbDest)
		if err != nil {
			return errors.Wrapf(err, "WriteThumbanil(%q, %q)", imagePath, thumbDest)
		}
	}

	w, h, err := image.Dimensions(imagePath)
	if err != nil {
		return errors.Wrapf(err, "ImageDimensions(%q)", imagePath)
	}

	err = database.UpsertFile(ctx, s.Database, &database.File{
		Hash:          hash,
		LastModified:  modTime,
		AbsolutePath:  imagePath,
		Height:        h,
		Width:         w,
		ThumbnailPath: thumbDest,
	})
	if err != nil {
		return errors.Wrapf(err, "UpsertFile(%q)", imagePath)
	}

	return nil
}
