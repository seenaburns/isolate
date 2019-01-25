package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"isolated/database"
	"isolated/fs"
	"isolated/log"
	"isolated/server"
)

const DATABASE_FILENAME = "isolate.db"
const THUMNAIL_DIRECTORY = "thumbs"

var (
	appDir = flag.String("appdir", "", "Directory to use for local storage")
	port   = flag.Int("port", 8001, "Port to locally listen on (default = 8001)")
)

func main() {
	ctx := context.Background()

	flag.Parse()

	if *appDir == "" {
		log.Fatalf("%s", "Must provide -appdir")
	}
	{
		fileInfo, exists, err := fs.Stat(*appDir)
		if err != nil {
			log.Fatalf("%v", err)
		} else if !exists || !fileInfo.Mode().IsDir() {
			log.Fatalf("%q does not exist or is not directory", *appDir)
		}
	}

	databasePath := filepath.Join(*appDir, DATABASE_FILENAME)
	thumbnailDir := filepath.Join(*appDir, THUMNAIL_DIRECTORY)

	err := os.MkdirAll(thumbnailDir, 0755)
	if err != nil {
		log.Fatalf("%v", err)
	}

	// Open database
	db, err := database.Open(ctx, databasePath)
	if err != nil {
		log.Fatalf("%v", err)
	}
	err = database.Initialize(ctx, db)
	if err != nil {
		log.Fatalf("database.Initialize: %+v", err)
	}

	s := &server.Server{
		Database:         db,
		ThumbnailDir:     thumbnailDir,
		ToUpdateDirQueue: make(chan string, 100),
	}
	go s.Updater(ctx, thumbnailDir)

	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/list/", s.ListDirHandler)

	addr := fmt.Sprintf("localhost:%d", *port)

	// Finish initialization by sending something via stdout
	fmt.Fprintf(os.Stdout, "Initialized, listening on %s", addr)

	log.Fatalf("%v", http.ListenAndServe(addr, nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "isolated\n")
}
