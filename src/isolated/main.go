package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"

	"github.com/pkg/errors"

	"isolated/database"
	"isolated/image"
)

const DATABASE_FILENAME = "isolate.db"
const THUMNAIL_DIRECTORY = "thumbs"

var (
	appDir = flag.String("appdir", "", "Directory to use for local storage")
	port   = flag.Int("port", 8001, "Port to locally listen on (default = 8001)")
)

func main() {
	ctx := context.Background()
	log.SetFlags(0)

	flag.Parse()

	if *appDir == "" {
		log.Fatal("Must provide -appdir")
	}
	{
		isDir, exists, err := checkPath(*appDir)
		if err != nil {
			log.Fatal(err)
		} else if !exists || !isDir {
			log.Fatalf("%q does not exist or is not directory", *appDir)
		}
	}

	databasePath := path.Join(*appDir, DATABASE_FILENAME)
	thumbnailDir := path.Join(*appDir, THUMNAIL_DIRECTORY)

	err := os.MkdirAll(thumbnailDir, 0755)
	if err != nil {
		log.Fatal(err)
	}

	// Open database
	db, err := database.Open(ctx, databasePath)
	if err != nil {
		log.Fatal(err)
	}
	err = database.Initialize(ctx, db)
	if err != nil {
		log.Fatalf("database.Initialize: %+v", err)
	}

	server := &Server{
		database:         db,
		thumbnailDir:     thumbnailDir,
		toUpdateDirQueue: make(chan string, 100),
	}
	go server.updater(ctx, thumbnailDir)

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/list/", server.listDirHandler)

	addr := fmt.Sprintf("localhost:%d", *port)

	// Finish initialization by sending something via stdout
	fmt.Fprintf(os.Stdout, "Initialized, listening on %s", addr)

	log.Fatal(http.ListenAndServe(addr, nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "isolated\n")
}

type Server struct {
	database         *sql.DB
	thumbnailDir     string
	toUpdateDirQueue chan string
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
func (s *Server) listDirHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	pathEscaped := strings.TrimPrefix(r.URL.Path, "/list/")
	requestPath, err := url.PathUnescape(pathEscaped)
	log.Printf("Path: %q %q", pathEscaped, requestPath)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: make windows compatible
	dir := path.Join("/", requestPath)
	s.toUpdateDirQueue <- dir

	knownFiles, err := database.GetDir(ctx, s.database, dir)
	if err != nil {
		log.Printf("[ERROR] GetDir(%q): %v", dir, err)
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
		log.Fatal(err)
	}

	fmt.Fprintf(w, string(json))
}

func (s *Server) updater(ctx context.Context, thumbnailDir string) {
	for dir := range s.toUpdateDirQueue {
		log.Printf("Updating directory: %s", dir)

		files, err := ioutil.ReadDir(dir)
		if err != nil {
			err = fmt.Errorf("ReadDir(%q): %+v", dir, err)
			log.Fatal(err)
		}

		knownFiles, err := database.GetDir(ctx, s.database, dir)
		if err != nil {
			log.Fatalf("[ERROR] GetDir(%q): %v", dir, err)
		}

		// TODO: this should map to an array of files
		byPath := make(map[string]*database.File)
		for _, f := range knownFiles {
			byPath[f.AbsolutePath] = f
		}

		for _, f := range files {
			if !f.IsDir() && image.Supported(f.Name()) {
				absPath := path.Join("/", dir, f.Name())

				// Update file if
				// 1. not in database
				// 2. file mod time > recorded last mod time
				shouldUpdate := false
				dbRecord, ok := byPath[absPath]
				if !ok {
					shouldUpdate = true
				} else {
					modTime, err := image.ModifiedTime(absPath)
					if err != nil {
						log.Printf("[ERROR] %s: %v", f.Name(), err)
						continue
					}

					if modTime.After(dbRecord.LastModified) {
						shouldUpdate = true
					}
				}

				if shouldUpdate {
					err := s.updateImageMetadata(ctx, absPath)
					if err != nil {
						log.Printf("ERROR: %v", err)
					}

				}
			}
		}
	}
}

func (s *Server) updateImageMetadata(ctx context.Context, imagePath string) error {
	modTime, err := image.ModifiedTime(imagePath)
	if err != nil {
		return errors.Wrapf(err, "ModifiedTime(%q, %q)", imagePath)
	}

	hash, err := image.Hash(imagePath)
	if err != nil {
		return errors.Wrapf(err, "Hash(%q, %q)", imagePath)
	}

	thumbDest := path.Join(s.thumbnailDir, fmt.Sprintf("%s.jpg", hash))
	if !image.FileExists(thumbDest) {
		log.Printf("Writing thumbnail for %q to %q", imagePath, thumbDest)
		err := image.WriteThumbnail(imagePath, thumbDest)
		if err != nil {
			return errors.Wrapf(err, "WriteThumbanil(%q, %q)", imagePath, thumbDest)
		}
	}

	w, h, err := image.Dimensions(imagePath)
	if err != nil {
		return errors.Wrapf(err, "ImageDimensions(%q)", imagePath)
	}

	err = database.UpsertFile(ctx, s.database, &database.File{
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

func checkPath(path string) (isDir bool, exists bool, err error) {
	f, err := os.Stat(path)

	if os.IsNotExist(err) {
		return false, false, nil
	} else if err != nil {
		return false, false, errors.Wrapf(err, "os.Stat(%q)", path)
	}

	return f.Mode().IsDir(), true, nil
}
