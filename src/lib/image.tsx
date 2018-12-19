const { promisify } = require("util");
const imageSize = promisify(require("image-size"));

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
