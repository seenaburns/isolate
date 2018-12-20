import React from "react";
import ReactDOM from "react-dom";

const nodePath = require("path");

import Images from "./components/image-grid";
import Directories from "./components/directories";
import Loading from "./components/loading";
import Errors from "./components/errors";
import { cdPath, listDir } from "./lib/fs";
import {
  resize,
  zoom,
  ColumnSizing,
  GUTTER_SIZE,
  DEFAULT_COLUMN_WIDTH
} from "./lib/resize";
import Modal from "./components/modal";
import Toolbar from "./components/toolbar";
import scrollbar from "./lib/scrollbar";
import nightmode from "./lib/nightmode";
import { Database, openDatabase, getDir } from "./lib/db";
import { updateDirMetadata } from "./lib/background-update";
import { Image, dimensions } from "./lib/image";

const electron = require("electron");
let global = electron.remote.getGlobal("global");

export enum Mode {
  Modal,
  Selection
}

interface AppProps {
  database: Database;
}

interface AppState {
  errors: string[];
  activeRequest?: Promise<void>;

  path: string;
  contents: DirectoryContents;
  selection: string[];
  mode: Mode;
  modal?: string;

  columnSizing: ColumnSizing;
}

class App extends React.Component<AppProps, AppState> {
  state: AppState = {
    errors: [],

    path: global.root_dir,
    contents: {
      dirs: [],
      images: []
    },

    columnSizing: {
      count: 1,
      width: DEFAULT_COLUMN_WIDTH,
      minimumColumnWidth: DEFAULT_COLUMN_WIDTH,
      containerWidth: 0
    },

    selection: [],
    mode: Mode.Modal
  };

  componentDidMount() {
    this.cd("");
  }

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    // Clear selection if exiting out of mode
    if (
      prevState.mode == Mode.Selection &&
      prevState.mode !== this.state.mode
    ) {
      this.setState({ selection: [] });
    }
  }

  cd(path: string) {
    const newPath = cdPath(this.state.path, path);
    console.log("cd", this.state.path, "->", newPath);

    const req = list(this.props.database, newPath)
      .then(
        contents => {
          this.setState(state => ({
            path: newPath,
            contents: contents,
            activeRequest: undefined,
            selection: []
          }));

          // Chromium seems to hold a copy of every image in the webframe cache. This can
          // cause the memory used to balloon, looking alarming to users.
          // webFrame.clearCache() unloads these images, dropping memory at the cost of
          // directory load time.
          electron.webFrame.clearCache();
        },
        err => {
          this.setState(state => ({
            errors: state.errors.concat([
              `List '${newPath}' failed: ${err.message}`
            ])
          }));
        }
      )
      .then(() => {
        electron.remote.app.sendToBackground("list", newPath);
      })
      .then(
        () => {},
        error => {
          console.log("ERROR updateDirMetadata", newPath, error);
        }
      );

    this.setState({
      activeRequest: req
    });
  }

  resize(dim: { height: number; width: number }) {
    console.log("Resize", dim.height, dim.width);

    this.setState(state => ({
      columnSizing: resize(
        dim.width,
        state.columnSizing.minimumColumnWidth,
        GUTTER_SIZE
      )
    }));
  }

  zoom(zoomIn: boolean) {
    this.setState(state => ({
      columnSizing: zoom(
        zoomIn,
        state.columnSizing.containerWidth,
        state.columnSizing.minimumColumnWidth,
        GUTTER_SIZE
      )
    }));
  }

  imageOnClick(path: string) {
    this.setState(state => {
      if (state.mode === Mode.Modal) {
        return {
          modal: path,
          selection: state.selection
        };
      }
      return {
        selection: toggleSelection(state.selection, path),
        modal: state.modal
      };
    });
  }

  render() {
    return (
      <div>
        {this.state.activeRequest && <Loading />}
        {this.state.modal && (
          <Modal
            image={this.state.modal}
            close={() => this.setState({ modal: undefined })}
          />
        )}
        <Errors errors={this.state.errors} />
        <Toolbar
          mode={this.state.mode}
          zoom={this.zoom.bind(this)}
          setMode={(mode: Mode) => this.setState({ mode: mode })}
        />
        <Directories dirs={this.state.contents.dirs} cd={this.cd.bind(this)} />
        <Images
          images={this.state.contents.images}
          columnSizing={this.state.columnSizing}
          onResize={this.resize.bind(this)}
          imageOnClick={this.imageOnClick.bind(this)}
          selection={this.state.selection}
        />
      </div>
    );
  }
}

function toggleSelection(selection: string[], path: string) {
  if (selection.includes(path)) {
    return selection.filter(p => p !== path);
  }
  selection.push(path);
  return selection;
}

console.log(global.night_mode, global.root_dir);

nightmode.set(global.night_mode);
scrollbar.init(global.night_mode);

openDatabase().then(
  db => {
    ReactDOM.render(<App database={db} />, document.getElementById("root"));
  },
  error => {
    console.log(error);
  }
);

setTimeout(() => {
  console.log("sending message");
  electron.remote.app.sendToBackground("channel", "test message");
}, 2000);

export interface DirectoryContents {
  dirs: string[];
  images: Image[];
}

async function list(
  db: Database,
  path: string
): Promise<{
  dirs: string[];
  images: Image[];
}> {
  const contents = await listDir(path);

  const dbRecords = await getDir(db, path);
  const dbFilepaths = dbRecords.map(f => f.path);

  const files = contents.files.map(f => nodePath.join(path, f));
  const filesFromDb: Image[] = dbRecords
    .filter(f => files.includes(f.path))
    .map(f => ({
      path: f.path,
      thumbnail: f.thumbnailPath, // "/Users/seena/Desktop/thumbnail.png", // f.thumbnailPath,
      width: f.width,
      height: f.height
    }));

  const filesNotInDb = files.filter(f => !dbFilepaths.includes(f));
  const withDimensions: Image[] = (await Promise.all(
    filesNotInDb.map(f =>
      dimensions(f).then(
        dim => ({
          path: f,
          width: dim.width,
          height: dim.height
        }),
        err => {
          console.log("Error getting image dimensions", f, err);
          return null;
        }
      )
    )
  )).filter(x => x);

  console.log("FILES IN DB VS NOT", filesFromDb.length, withDimensions.length);

  return {
    dirs: [".."].concat(contents.dirs),
    images: filesFromDb.concat(withDimensions)
  };
}
