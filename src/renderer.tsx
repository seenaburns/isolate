import React from "react";
import ReactDOM from "react-dom";

import ImageGrid from "./components/image-grid";
import Loading from "./components/loading";
import Errors from "./components/errors";
import {
  cdPath,
  list,
  DirectoryContents,
  directoryWalk,
  searchFiles
} from "./lib/fs";
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
import { Image } from "./lib/image";
import Daemon, { DaemonConfig } from "./lib/daemon";
import userData from "./lib/userData";
import Menu from "./components/menu";

const electron = require("electron");
let global = electron.remote.getGlobal("global");

export enum Mode {
  Modal,
  Selection,
  Move
}

interface AppProps {}

interface AppState {
  errors: string[];
  activeRequest?: Promise<void>;

  root: string;
  path: string;
  contents: DirectoryContents;
  selection: string[];
  mode: Mode;
  modalIndex?: number;
  search?: string;

  columnSizing: ColumnSizing;

  daemon?: DaemonConfig;
}

class App extends React.Component<AppProps, AppState> {
  state: AppState = {
    errors: [],

    path: global.root_dir,
    root: global.root_dir,
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

    document.ondragover = e => {
      e.preventDefault();
    };

    document.ondrop = document.body.ondrop = e => {
      e.preventDefault();
      const f = e.dataTransfer.files[0] as any;
      this.setRoot(f.path);
    };

    electron.ipcRenderer.on(
      "daemon-did-init",
      (event: any, daemon: DaemonConfig) => {
        console.log("Daemon initialized, setting app config");
        this.setState({
          daemon: daemon
        });
      }
    );
  }

  componentDidUpdate(prevProps: AppProps, prevState: AppState) {
    // Clear selection if exiting out of mode
    if (this.state.mode === Mode.Modal && prevState.mode !== this.state.mode) {
      this.setState({ selection: [] });
    }
  }

  cd(path: string) {
    const newPath = cdPath(this.state.path, path);
    console.log("cd", this.state.path, "->", newPath);

    const req = listDirWithDaemon(newPath, this.state.daemon).then(
      contents => {
        if (newPath !== this.state.root) {
          contents.dirs = [".."].concat(contents.dirs);
        }

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
    );

    this.setState({
      activeRequest: req
    });
  }

  setRoot(path: string) {
    console.log("Root", this.state.root, "to", path);
    userData.SetKey("root_dir", path, "settings.json");
    this.setState(
      {
        path: path,
        root: path
      },
      () => {
        this.cd("");
      }
    );
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
          modalIndex: state.contents.images.findIndex(i => i.path === path),
          selection: state.selection
        };
      }
      return {
        selection: toggleSelection(state.selection, path),
        modalIndex: state.modalIndex
      };
    });
  }

  modalPath() {
    const i = this.state.contents.images[this.state.modalIndex];
    if (i) {
      return i.path;
    }
    return undefined;
  }

  search(query?: string) {
    if (!query || query === "") {
      this.setState({
        search: undefined
      });
      this.cd("");
      return;
    }

    searchFiles(query, this.state.root).then(images => {
      this.setState({
        search: query,
        contents: {
          dirs: [],
          images: images
        }
      });
    });
  }

  render() {
    if (this.state.root === "") {
      return (
        <div className="dragndrop">
          <img src="../assets/icon_512x512.png" />
          <p>{"Drag & drop a folder to get started"}</p>
        </div>
      );
    }

    return (
      <div>
        {this.state.activeRequest && <Loading />}
        <Modal
          index={this.state.modalIndex}
          images={this.state.contents.images.map(i => i.path)}
          setIndex={(i: number) => this.setState({ modalIndex: i })}
          close={() => this.setState({ modalIndex: undefined })}
        />
        <Errors errors={this.state.errors} />
        <Toolbar
          dirs={this.state.contents.dirs}
          imageCount={this.state.contents.images.length}
          path={this.state.path}
          root={this.state.root}
          selection={this.state.selection}
          search={this.state.search}
          mode={this.state.mode}
          zoom={this.zoom.bind(this)}
          setMode={(mode: Mode) => this.setState({ mode: mode })}
          cd={this.cd.bind(this)}
          setSearch={this.search.bind(this)}
        />
        <ImageGrid
          images={this.state.contents.images}
          columnSizing={this.state.columnSizing}
          onResize={this.resize.bind(this)}
          imageOnClick={this.imageOnClick.bind(this)}
          selection={this.state.selection}
        />
        <Menu
          modalPath={this.modalPath()}
          nightmodeEnabled={false}
          zoom={this.zoom.bind(this)}
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

ReactDOM.render(<App />, document.getElementById("root"));

async function listDirWithDaemon(
  path: string,
  daemon?: DaemonConfig
): Promise<DirectoryContents> {
  const fsContents = await list(path);

  const images: Map<string, Image> = new Map();
  fsContents.images.forEach(i => images.set(i.path, i));

  if (daemon) {
    const daemonContents = await Daemon.listDir(daemon, path);
    daemonContents.forEach(i => {
      // Only override if file exists on disk
      if (images.get(i.path)) {
        images.set(i.path, i);
      }
    });
  }

  return {
    dirs: fsContents.dirs,
    images: Array.from(images.values())
  };
}
