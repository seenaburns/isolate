import React from "react";
import { AutoSizer, Collection, WindowScroller } from "react-virtualized";
import "react-virtualized/styles.css"; // only needs to be imported once

import { Image } from "../lib/image";
import { resize, zoom, ColumnSizing } from "../lib/resize";

const GUTTER_SIZE = 4;
const COLUMN_WIDTH = 200;
const THUMBNAIL_WIDTH = 250;
const VERTICAL_OVERSCAN_SIZE = COLUMN_WIDTH * 10;

export default class Images extends React.Component<{ images: Image[] }> {
  render() {
    if (this.props.images.length == 0) {
      return null;
    }
    return (
      <div>
        <h2>Files</h2>
        <ImageGrid images={this.props.images} />
      </div>
    );
  }
}

interface ImageGridProps {
  images: Image[];
}

interface ImageGridState {
  containerWidth: number;
  column: ColumnSizing;
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
class ImageGrid extends React.Component<ImageGridProps, ImageGridState> {
  columnHeights: number[] = [];
  collectionRef: any;

  constructor(props: ImageGridProps) {
    super(props);

    this.collectionRef = React.createRef();

    this.state = {
      containerWidth: 0,
      column: {
        count: 1,
        width: COLUMN_WIDTH,
        minimumColumnWidth: COLUMN_WIDTH
      }
    };

    this.zeroColumnHeights(1);
  }

  componentDidUpdate(prevProps: ImageGridProps, prevState: ImageGridState) {
    const imagesChanged = prevProps.images !== this.props.images;
    const resized = prevState.column !== this.state.column;

    if (imagesChanged || resized) {
      this.zeroColumnHeights(this.state.column.count);
      this.collectionRef.current.recomputeCellSizesAndPositions();
    }
  }

  zeroColumnHeights(columnCount: number) {
    this.columnHeights = Array(columnCount).fill(0);
  }

  resize(dim: { height: number; width: number }) {
    console.log("Resize", dim.height, dim.width);

    // Update dimensions and force collection to reposition
    // Reset _columnYMap before recomputing columns
    this.setState(state => {
      const newSizing = resize(
        dim.width,
        state.column.minimumColumnWidth,
        GUTTER_SIZE
      );
      return {
        containerWidth: dim.width,
        column: newSizing
      };
    });
  }

  zoom(zoomIn: boolean) {
    this.setState(state => {
      const newSizing = zoom(
        zoomIn,
        state.containerWidth,
        state.column.minimumColumnWidth,
        GUTTER_SIZE
      );
      return {
        column: newSizing
      };
    });
  }

  render() {
    return (
      <div>
        <a href="#" onClick={() => this.zoom(true)}>
          zin
        </a>
        <a href="#" onClick={() => this.zoom(false)}>
          zout
        </a>
        <AutoSizer disableHeight onResize={this.resize.bind(this)}>
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
    const { width, height } = dimensionsForImage(i, this.state.column.width);

    return (
      <img
        src={encodeURI(path)}
        style={style}
        key={key}
        width={width}
        height={height}
      />
    );
  }

  // Masonry grid:
  // Maintain the current column heights in _columnYMap
  _cellSizeAndPositionGetter({ index }: any) {
    const colWidth = this.state.column.width;

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
