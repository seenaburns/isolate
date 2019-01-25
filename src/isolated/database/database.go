package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/pkg/errors"
)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS files (
	hash TEXT NOT NULL,
	path TEXT NOT NULL,
	modified INTEGER,
	height INTEGER,
	width INTEGER,
	thumbnailPath TEXT,
	PRIMARY KEY (hash, path)
);
`

func Open(ctx context.Context, path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, errors.Wrapf(err, "db.Open(%q)", path)
	}

	err = db.PingContext(ctx)
	if err != nil {
		return nil, errors.Wrapf(err, "db.Ping(%q)", path)
	}

	return db, err
}

func Initialize(ctx context.Context, client *sql.DB) error {
	_, err := client.ExecContext(ctx, SCHEMA)
	return errors.Wrapf(err, "db.Exec(%q)", SCHEMA)
}

func UpsertFile(ctx context.Context, client *sql.DB, file *File) error {
	query := `
INSERT INTO files (hash, path, modified, height, width, thumbnailPath)
VALUES(?, ?, ?, ?, ?, ?)
ON CONFLICT (hash, path) DO UPDATE SET
	modified=excluded.modified,
	height=excluded.height,
	width=excluded.width,
	thumbnailPath=excluded.thumbnailPath
`

	_, err := client.ExecContext(
		ctx,
		query,
		file.Hash,
		file.AbsolutePath,
		file.LastModified.Unix(),
		file.Height,
		file.Width,
		file.ThumbnailPath,
	)
	return errors.Wrapf(err, "db.Exec (query=%q) (args=%+v)", query, file)
}

type File struct {
	Hash          string
	LastModified  time.Time
	AbsolutePath  string
	Height        int
	Width         int
	ThumbnailPath string
}

func getFiles(ctx context.Context, client *sql.DB, where string, args ...interface{}) ([]*File, error) {
	query := fmt.Sprintf("SELECT hash, modified, path, height, width, thumbnailPath FROM files WHERE %s", where)

	rows, err := client.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, errors.Wrapf(err, "Select (query=%q) (args=%v)", query, args)
	}
	defer rows.Close()

	files := []*File{}
	for rows.Next() {
		var f File
		var modified int64
		var nullableThumbnailPath sql.NullString

		err = rows.Scan(&f.Hash, &modified, &f.AbsolutePath, &f.Height, &f.Width, &nullableThumbnailPath)
		if err != nil {
			return nil, errors.Wrapf(err, "Scan File")
		}

		f.LastModified = time.Unix(modified, 0)

		thumbnailPath := ""
		if nullableThumbnailPath.Valid {
			thumbnailPath = nullableThumbnailPath.String
		}
		f.ThumbnailPath = thumbnailPath

		files = append(files, &f)
	}

	return files, nil
}

func GetDir(ctx context.Context, client *sql.DB, dir string) ([]*File, error) {
	return getFiles(ctx, client, "path LIKE ? || '%'", dir)
}
