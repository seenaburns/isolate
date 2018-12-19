import React from "react";
import ReactDOM from "react-dom";

import Images from "./components/image-grid";
import Directories from "./components/directories";
import Loading from "./components/loading";
import Errors from "./components/errors";
import { DirectoryContents, cdPath, list } from "./lib/fs";
import {
  resize,
  zoom,
  ColumnSizing,
  GUTTER_SIZE,
  DEFAULT_COLUMN_WIDTH
} from "./lib/resize";
import { ENGINE_METHOD_ALL } from "constants";
import Modal from "./components/modal";

const electron = require("electron");
let global = electron.remote.getGlobal("global");

enum Mode {
  Modal,
  Selection
}

interface AppProps {}

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

  cd(path: string) {
    const newPath = cdPath(this.state.path, path);
    console.log("cd", this.state.path, "->", newPath);

    const req = list(newPath).then(
      contents => {
        this.setState(state => ({
          path: newPath,
          contents: contents,
          activeRequest: undefined,
          selection: []
        }));
      },
      err => {
        this.setState(state => ({
          errors: state.errors.concat([
            `List '${newPath}' failed: ${err.message}`
          ])
        }));
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
        <Directories dirs={this.state.contents.dirs} cd={this.cd.bind(this)} />
        <a href="#" onClick={() => this.zoom(true)}>
          zin
        </a>
        <a href="#" onClick={() => this.zoom(false)}>
          zout
        </a>
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

ReactDOM.render(<App />, document.getElementById("root"));
