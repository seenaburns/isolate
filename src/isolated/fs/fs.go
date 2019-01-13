// Filesystem utilities
package fs

import (
	"crypto/sha1"
	"encoding/hex"
	_ "image/png"
	"io"
	"os"
	"time"

	"github.com/pkg/errors"
)

func Stat(path string) (fileInfo os.FileInfo, exists bool, err error) {
	fileInfo, err = os.Stat(path)

	if os.IsNotExist(err) {
		return fileInfo, false, nil
	} else if err != nil {
		return fileInfo, false, errors.Wrapf(err, "os.Stat(%q)", path)
	}

	return fileInfo, true, nil
}

func Hash(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha1.New()
	_, err = io.Copy(hash, file)
	if err != nil {
		return "", err
	}

	hashBytes := hash.Sum(nil)
	return hex.EncodeToString(hashBytes), nil
}

func ModifiedTime(path string) (time.Time, error) {
	info, err := os.Stat(path)
	if err != nil {
		return time.Time{}, err
	}

	return info.ModTime(), nil
}
