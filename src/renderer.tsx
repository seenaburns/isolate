import React from "react";
import ReactDOM from "react-dom";

import ImageGrid from "./components/image-grid";
import Loading from "./components/loading";
import Errors from "./components/errors";
import {
  cdPath,
  list,
  searchFiles,
  DirectoryContents,
  fetchDimensionsWhenUnknown
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
import shuffle from "./lib/shuffle";

const electron = require("electron");
const nodePath = require("path");
let global = electron.remote.getGlobal("global");

export enum Mode {
  Modal,
  Selection,
  Move
}

interface Contents {
  dirs: string[];
  images: Image[];
}

interface AppProps {}

interface AppState {
  errors: string[];
  activeRequest?: Promise<void>;

  root: string;
  path: string;
  contents: Contents;

  selection: string[];
  mode: Mode;
  modalIndex?: number;
  // Search
  // Enabled if search is defined and not empty
  search?: string;
  searchResults: Image[];
  shuffledResults?: Image[]; // enabled if non-empty

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

    selection: [],
    mode: Mode.Modal,
    searchResults: [],

    columnSizing: {
      count: 1,
      width: DEFAULT_COLUMN_WIDTH,
      minimumColumnWidth: DEFAULT_COLUMN_WIDTH,
      containerWidth: 0
    }
  };

  componentDidMount() {
    if (this.state.root !== "") {
      this.cd("");
    }

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

        this.clearSearch();
        this.clearShuffle();
        this.setState({
          path: newPath,
          contents: contents,
          activeRequest: undefined,
          selection: []
        });

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
        dim.width - GUTTER_SIZE * 2, // assumes gutter on side borders of image grid
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
    const i = this.images(this.state)[this.state.modalIndex];
    if (i) {
      return i.path;
    }
    return undefined;
  }

  images(state: AppState): Image[] {
    if (state.shuffledResults) {
      return state.shuffledResults;
    }

    if (state.search && state.search !== "") {
      return state.searchResults;
    }

    return state.contents.images;
  }

  search(query?: string) {
    if (!query || query === "") {
      this.clearSearch();
      this.cd("");
      return;
    }

    searchFiles(query, this.state.root).then(images => {
      this.setState({
        search: query,
        searchResults: images
      });
    });
  }

  clearSearch() {
    this.setState({
      search: undefined,
      searchResults: []
    });
  }

  toggleShuffle() {
    this.setState(state => {
      if (state.shuffledResults) {
        this.clearShuffle();
      }

      return {
        shuffledResults: shuffle(this.images(this.state))
      };
    });
  }

  clearShuffle() {
    this.setState({
      shuffledResults: undefined
    });
  }

  render() {
    const menu = (
      <Menu
        modalPath={this.modalPath()}
        nightmodeEnabled={false}
        zoom={this.zoom.bind(this)}
      />
    );

    if (this.state.root === "") {
      return (
        <div>
          <div className="dragndrop">
            <img src="../assets/icon_512x512.png" />
            <p>{"Drag & drop a folder to get started"}</p>
          </div>
          {menu}
        </div>
      );
    }

    return (
      <div>
        {this.state.activeRequest && <Loading />}
        <Modal
          index={this.state.modalIndex}
          images={this.images(this.state).map(i => i.path)}
          setIndex={(i: number) => this.setState({ modalIndex: i })}
          close={() => this.setState({ modalIndex: undefined })}
        />
        <Errors errors={this.state.errors} />
        <Toolbar
          dirs={this.state.contents.dirs}
          imageCount={this.images(this.state).length}
          path={this.state.path}
          root={this.state.root}
          selection={this.state.selection}
          search={this.state.search}
          mode={this.state.mode}
          zoom={this.zoom.bind(this)}
          setMode={(mode: Mode) => this.setState({ mode: mode })}
          cd={this.cd.bind(this)}
          setSearch={this.search.bind(this)}
          toggleShuffle={this.toggleShuffle.bind(this)}
        />
        <ImageGrid
          images={this.images(this.state)}
          columnSizing={this.state.columnSizing}
          onResize={this.resize.bind(this)}
          imageOnClick={this.imageOnClick.bind(this)}
          selection={this.state.selection}
        />
        {menu}
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

document.querySelector("body").classList.add(process.platform);

ReactDOM.render(<App />, document.getElementById("root"));

async function listDirWithDaemon(
  path: string,
  daemon?: DaemonConfig
): Promise<Contents> {
  const imagesByPath: Map<string, Partial<Image>> = new Map();

  // List directory contents from disk
  const fsContents: DirectoryContents = await list(path);
  const fsImages: string[] = fsContents.files.map(f => nodePath.join(path, f));
  fsImages.forEach(i =>
    imagesByPath.set(i, {
      path: i
    })
  );

  // Query daemon for precomputed values
  if (daemon) {
    const daemonImages: Image[] = await Daemon.listDir(daemon, path);
    daemonImages.forEach(i => {
      // Only override if file exists on disk
      if (imagesByPath.get(i.path)) {
        imagesByPath.set(i.path, i);
      }
    });
  }

  // Fill dimensions for any files that daemon does not know about
  const partialImages: Partial<Image>[] = Array.from(imagesByPath.values());
  const images: Image[] = await fetchDimensionsWhenUnknown(partialImages);
  return {
    dirs: fsContents.dirs,
    images: images
  };
}
