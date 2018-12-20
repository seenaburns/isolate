const { promisify } = require("util");
const imageSize = promisify(require("image-size"));

const sharp = require("sharp");

export const THUMBNAIL_SIZE = 250;

export interface Image {
  path: string;
  width: number;
  height: number;
}

export function imageInfo(
  path: string
): Promise<{
  image: Image;
  error: Error;
}> {
  return imageSize(path).then(
    (dim: { width: number; height: number }) => ({
      image: {
        path: path,
        width: dim.width,
        height: dim.height
      }
    }),
    (err: Error) => ({
      error: err
    })
  );
}

export function dimensions(
  path: string
): {
  width: number;
  height: number;
} {
  return imageSize(path);
}

export function writeThumbnail(
  path: string,
  destinationPath: string
): Promise<void> {
  return sharp(path)
    .resize(THUMBNAIL_SIZE)
    .toFile(destinationPath)
    .then(() => {
      console.log("Wrote thumbnail for path", path, "at", destinationPath);
    });
}
