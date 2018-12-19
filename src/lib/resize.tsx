import { number } from "prop-types";

export interface ColumnSizing {
  count: number;
  width: number;
  minimumColumnWidth: number;
}

// Given a changing container width, compute the number of columns that will fit
export function resize(
  containerWidth: number,
  minimumColumnWidth: number,
  gutterSize: number
): ColumnSizing {
  if (containerWidth <= minimumColumnWidth) {
    return {
      count: 1,
      width: minimumColumnWidth,
      minimumColumnWidth: minimumColumnWidth
    };
  }

  const columnCount = Math.floor(containerWidth / minimumColumnWidth);
  const containerMinusGutters = containerWidth - (columnCount - 1) * gutterSize;

  return {
    count: columnCount,
    width: Math.floor(containerMinusGutters / columnCount),
    minimumColumnWidth: minimumColumnWidth
  };
}

// Change the minimum column width and recompute dimenions
export function zoom(
  zoomIn: boolean,
  containerWidth: number,
  minimumColumnWidth: number,
  gutterSize: number
): ColumnSizing {
  let newMin = minimumColumnWidth;
  if (zoomIn) {
    newMin += 50;
  } else {
    newMin -= 50;
  }
  newMin = Math.max(50, newMin);

  return resize(containerWidth, newMin, gutterSize);
}
