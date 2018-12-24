import React from "react";
import { AutoSizer, Collection, WindowScroller } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once

import { Image, THUMBNAIL_SIZE } from "../lib/image";
import { ColumnSizing, DEFAULT_COLUMN_WIDTH, GUTTER_SIZE } from "../lib/resize";
import encodePath from "../lib/encode-path";

const VERTICAL_OVERSCAN_SIZE = DEFAULT_COLUMN_WIDTH * 10;

interface ImageGridProps {
  images: Image[];
  columnSizing: ColumnSizing;
  onResize: (dim: { height: number; width: number }) => void;
  imageOnClick: (path: string) => void;
  selection: string[];
}

// ImageGrid works by using react-virtualized's collection (inside AutoSizer for
// full-width, window scroller).
//
// React-virtualized loads/unloads elements as they go offscreen, which can save
// work when components are expensive. The components Isolate uses are
// relatively cheap but for large folders, a lazy loader is useful anyway.
//
// React-virtualized provides:
// - convenient api for a masonry grid with predefined sizings (server generated)
// - lazy loading for large folders
export default class ImageGrid extends React.Component<ImageGridProps> {
  columnHeights: number[] = [];
  collectionRef: any;

  constructor(props: ImageGridProps) {
    super(props);

    this.collectionRef = React.createRef();

    this.zeroColumnHeights(1);
  }

  // Update dimensions and force collection to reposition
  // Reset _columnYMap before recomputing columns
  componentDidUpdate(prevProps: ImageGridProps) {
    const imagesChanged = prevProps.images !== this.props.images;
    const resized = prevProps.columnSizing !== this.props.columnSizing;

    if (imagesChanged || resized) {
      this.zeroColumnHeights(this.props.columnSizing.count);
      this.collectionRef.current.recomputeCellSizesAndPositions();
    }
  }

  zeroColumnHeights(columnCount: number) {
    this.columnHeights = Array(columnCount).fill(0);
  }

  render() {
    return (
      <div>
        <AutoSizer disableHeight onResize={this.props.onResize}>
          {({ width }: any) => (
            <WindowScroller>
              {({ height, scrollTop }: any) => {
                return (
                  <Collection
                    ref={this.collectionRef}
                    autoHeight
                    cellCount={this.props.images.length}
                    cellRenderer={this._cellRenderer.bind(this)}
                    cellSizeAndPositionGetter={this._cellSizeAndPositionGetter.bind(
                      this
                    )}
                    scrollTop={scrollTop}
                    height={height}
                    width={width}
                    verticalOverscanSize={VERTICAL_OVERSCAN_SIZE}
                  />
                );
              }}
            </WindowScroller>
          )}
        </AutoSizer>
      </div>
    );
  }

  // collection api to render an image
  // If the image has a thumbnail, include that as a srcset, letting chrome
  // choose to use it if the column is small enough
  _cellRenderer({ index, key, style }: any) {
    const i = this.props.images[index];
    const path = i.path;
    const { width, height } = dimensionsForImage(
      i,
      this.props.columnSizing.width
    );

    // Srcset is the image with the actual image width, and optionally the thumbnail if it is defined
    const srcset = [];
    if (i.thumbnail && i.thumbnail != "") {
      srcset.push(`${encodePath(i.thumbnail)} ${THUMBNAIL_SIZE}w`);
    }
    srcset.push(`${encodePath(path)} ${i.width}w`);

    return (
      <div className={"iw"} style={style} key={key}>
        {this.props.selection.includes(path) && (
          <div
            className="selected"
            style={{
              width: width,
              height: height
            }}
          />
        )}
        <img
          src={encodePath(path)}
          srcSet={srcset.join(", ")}
          sizes={`${this.props.columnSizing.width}px`}
          width={width}
          height={height}
          onClick={() => this.props.imageOnClick(path)}
        />
      </div>
    );
  }

  // Masonry grid:
  // Maintain the current column heights in _columnYMap
  _cellSizeAndPositionGetter({ index }: any) {
    const colWidth = this.props.columnSizing.width;

    const i = this.props.images[index];
    const { height } = dimensionsForImage(i, colWidth);

    const column = this.shortestColumn();
    const x = column * (GUTTER_SIZE + colWidth);
    const y = this.columnHeights[column] || 0;

    this.columnHeights[column] = y + height + GUTTER_SIZE;

    return {
      height,
      width: colWidth,
      x,
      y
    };
  }

  // Return shortest, leftmost column
  shortestColumn(): number {
    let shortestColumn = 0;
    for (let i = 1; i < this.columnHeights.length; i++) {
      if (this.columnHeights[i] < this.columnHeights[shortestColumn]) {
        shortestColumn = i;
      }
    }
    return shortestColumn;
  }
}

const dimensionsForImage = (
  i: Image,
  desiredWidth: number
): {
  width: number;
  height: number;
} => {
  const aspectRatio = i.height / i.width;
  return {
    width: desiredWidth,
    height: aspectRatio * desiredWidth
  };
};
