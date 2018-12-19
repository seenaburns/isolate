import React from "react";
import ReactDOM from "react-dom";

import Images from "./components/image-grid";
import Directories from "./components/directories";
import Loading from "./components/loading";
import Errors from "./components/errors";
import { DirectoryContents, cdPath, list } from "./lib/fs";

const electron = require("electron");
let global = electron.remote.getGlobal("global");

interface AppProps {}

interface AppState {
  errors: string[];
  activeRequest?: Promise<void>;

  path: string;
  contents: DirectoryContents;
}

class App extends React.Component<AppProps, AppState> {
  state: AppState = {
    errors: [],

    path: global.root_dir,
    contents: {
      dirs: [],
      images: []
    }
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
          activeRequest: undefined
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

  render() {
    return (
      <div>
        {this.state.activeRequest && <Loading />}
        <Errors errors={this.state.errors} />
        <Directories dirs={this.state.contents.dirs} cd={this.cd.bind(this)} />
        <Images images={this.state.contents.images} />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
