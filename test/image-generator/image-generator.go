// Generate images with the filename in the image content
// Read from newline separated input file, write to output dir if specified
package main

import (
	"fmt"
	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
	"image"
	"image/color"
	"image/png"
	"io/ioutil"
	"os"
	"path"
	"strings"
)

var tests = []string{}

func check(e error) {
	if e != nil {
		panic(e)
	}
}

func main() {
	if len(os.Args) < 2 {
		panic(fmt.Errorf("Usage: %s <tests.txt> <outdir>", os.Args[0]))
	}

	outDir := "."
	if len(os.Args) >= 3 {
		outDir = os.Args[2]
		// Create in case doesn't exist
		_ = os.Mkdir(outDir, 0755)
	}

	inputFileData, err := ioutil.ReadFile(os.Args[1])
	check(err)

	tests = strings.Split(string(inputFileData), "\n")
	for i, name := range tests {
		if len(name) == 0 {
			continue
		}

		err := createImage(i, name, outDir)
		check(err)
	}
}

func createImage(index int, name string, dir string) error {
	basename := fmt.Sprintf("%02d_%s.png", index, name)
	relpath := path.Join(dir, basename)
	fmt.Printf("Creating %s\n", relpath)
	f, err := os.Create(relpath)
	if err != nil {
		return err
	}
	defer f.Close()

	w, h := 150, 150
	img := image.NewRGBA(image.Rect(0, 0, w, h))

	bg := color.RGBA{255, uint8(index * 255 / len(tests)), 0, 255}
	for x := 0; x < w; x++ {
		for y := 0; y < h; y++ {
			img.Set(x, y, bg)
		}
	}

	addLabel(img, 10, h/2, basename)

	return png.Encode(f, img)
}

func addLabel(img *image.RGBA, x, y int, label string) {
	col := color.RGBA{0, 0, 0, 255}
	point := fixed.Point26_6{fixed.Int26_6(x * 64), fixed.Int26_6(y * 64)}

	d := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(col),
		Face: basicfont.Face7x13,
		Dot:  point,
	}
	d.DrawString(label)
}
