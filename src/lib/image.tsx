const { promisify } = require("util");
const imageSize = promisify(require("image-size"));

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
