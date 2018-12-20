package image

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	stdlib_image "image"
	"image/jpeg"
	_ "image/png"
	"io"
	"os"
	"path"
	"time"

	"github.com/nfnt/resize"
	"github.com/pkg/errors"
)

const THUMBNAIL_WIDTH = 300

func Supported(imagePath string) bool {
	ext := path.Ext(imagePath)
	return ext == ".jpg" || ext == ".jpeg" || ext == ".png"
}

func Dimensions(imageAbsolutePath string) (w int, h int, err error) {
	file, err := os.Open(imageAbsolutePath)
	if err != nil {
		return 0, 0, err
	}
	defer file.Close()

	image, _, err := stdlib_image.DecodeConfig(file)
	if err != nil {
		return 0, 0, err
	}
	return image.Width, image.Height, nil
}

func Hash(imageAbsolutePath string) (string, error) {
	file, err := os.Open(imageAbsolutePath)
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

func ModifiedTime(imageAbsolutePath string) (time.Time, error) {
	info, err := os.Stat(imageAbsolutePath)
	if err != nil {
		return time.Time{}, err
	}

	return info.ModTime(), nil
}

func WriteThumbnail(imageAbsolutePath string, destinationPath string) error {
	file, err := os.Open(imageAbsolutePath)
	if err != nil {
		return errors.Wrapf(err, "os.Open(%s)", imageAbsolutePath)
	}
	defer file.Close()

	img, _, err := stdlib_image.Decode(file)
	if err != nil {
		return errors.Wrapf(err, "image.Decode(%s)", imageAbsolutePath)
	}

	thumb := resize.Resize(THUMBNAIL_WIDTH, 0, img, resize.NearestNeighbor)

	// Check if thumb already exists
	if FileExists(destinationPath) {
		return fmt.Errorf("Thumbnail destination already exists (%q)", destinationPath)
	}

	out, err := os.Create(destinationPath)
	if err != nil {
		return errors.Wrapf(err, "os.Create(%s)", destinationPath)
	}
	defer out.Close()

	err = jpeg.Encode(out, thumb, nil)
	return errors.Wrapf(err, "jpeg.Encode")
}

func FileExists(path string) bool {
	if _, err := os.Stat(path); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}
	return true
}
