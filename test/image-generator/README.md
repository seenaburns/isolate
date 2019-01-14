# Image Generator

Utility to generate test images with the filename rendered in the image.

![image generator](https://user-images.githubusercontent.com/2801344/51094264-47c67b00-1760-11e9-90dc-f83ac470d31d.png)

This is useful to validate the escaping/url used for local images, or just generate some distinct
test images

### Usage

Takes a file of newline separated list of filenames, and an optional output directory:

```bash
$ cat test.txt
image
ima?ge
im+ge
#!--content

$ ./image-generator.go test.txt out
Creating out//00_image.png
Creating out//01_ima?ge.png
Creating out//02_im+ge.png
Creating out//03_#!--content.png
```
