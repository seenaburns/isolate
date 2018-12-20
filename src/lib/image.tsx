const { promisify } = require("util");
const imageSize = promisify(require("image-size"));

const sharp = require("sharp");

export const THUMBNAIL_SIZE = 300;

export interface Image {
  path: string;
  thumbnail?: string;
  width: number;
  height: number;
}

export function dimensions(
  path: string
): Promise<{
  width: number;
  height: number;
}> {
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
