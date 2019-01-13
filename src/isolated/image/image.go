package image

import (
	"fmt"
	stdlib_image "image"
	"image/jpeg"
	_ "image/png"
	"os"
	"path"

	"github.com/nfnt/resize"
	"github.com/pkg/errors"

	"isolated/fs"
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
	_, exists, err := fs.Stat(destinationPath)
	if err != nil {
		return errors.Wrapf(err, "CheckPath")
	}
	if exists {
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
