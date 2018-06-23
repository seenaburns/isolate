[@bs.val] external document: 'jsModule = "document";
let electron: 'jsModule = [%bs.raw {| require("electron") |}];
let menu: 'jsModule = [%bs.raw {| require("./menu") |}];

module Directories {
  let component = ReasonReact.statelessComponent("Directories");
  let make = (~paths: array(Path.base), ~pwd: Path.base, ~root: Path.base, ~setPwd, _children) => {
    ...component,
    render: _self => {
      let directories = Array.map((p: Path.base) => {
        <li>
          <a href="#" onClick={setPwd(p)}>{ReasonReact.string(Path.renderable(p, pwd, root))}</a>
        </li>
      }, paths);

      let dirList = ReasonReact.createDomElement("ul", ~props={"id": "dirs"}, directories);

      /* cannot set children directly, see
       * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      <nav>
        {dirList}
      </nav>
    }
  }
}

module Image {
  let component = ReasonReact.statelessComponent("Image");
  let make = (~image: Path.absolute, ~openModal, _children) => {
    ...component,
    render: _self => {
      let url = Path.makeUrl(image).url;
      Js.log(url);
      <div className="iw">
        <img src={url} onClick={openModal(image)} />
      </div>
    }
  }
}

module ImageGrid {
  let component = ReasonReact.statelessComponent("ImageGrid");
  let make = (~images: array(Path.absolute), ~openModal, _children) => {
    ...component,
    render: _self => {
      let imageComponents = Array.map((i) => { <Image image={i} openModal={openModal} /> }, images);
      /* cannot directly use <div>, see
       * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
      ReasonReact.createDomElement(
        "div",
        ~props={"id": "react-images", "className": "images-container"},
        imageComponents
      );
    }
  }
}

module Main {
  type state = {
    root: Path.base,
    pwd: Path.base,
    search: bool,
    images: array(Path.absolute),
    modal: Modal.state,
  }

  type action =
    | SetRoot(Path.base)
    | SetPwd(Path.base)
    | SetImages(array(Path.absolute))
    | SetSearchActive(bool)
    | ModalAction(Modal.action)

  let readOnlyState: ref(option(state)) = ref(None);

  let component = ReasonReact.reducerComponent("Main");
  let make = (setSendAction, _children) => {
    let keydown = (self: ReasonReact.self('a, 'b, 'c)) => (e) => {
      switch (e##key) {
      | "Escape" => self.send(ModalAction(Modal.SetActive(false)))
      | "z" => self.send(ModalAction(Modal.ZoomToggle))
      | "ArrowRight" => self.send(ModalAction(Modal.Advance(true)))
      | "ArrowLeft" => self.send(ModalAction(Modal.Advance(false)))
      | _ => ()
      }
    };

    {
    ...component,

    initialState: () => {
      root: Path.asBase(""),
      pwd: Path.asBase(""),
      search: false,
      images: [||],
      modal: Modal.{
        active: false,
        zoomed: false,
        current: Path.asAbsolute(""),
      }
    },

    /* Temporary while migrating to ReasonReact,
     * allows internal state to be visible (via Modal.readOnlyState) and set externally (via
     * setSendAction)
     */
    didMount: self => {
      document##addEventListener("keydown", keydown(self));
      setSendAction(self.send)
    },
    didUpdate: (s) => {
      readOnlyState := Some(s.newSelf.state);
    },

    /*
     * TODO: set menu on modal open/close
    */
    reducer: (action: action, state) => {
      let setZoom = (zoomed: bool) => {
        let newState = {...state, modal: {...state.modal, zoomed: zoomed}};
        if (zoomed) {
          ReasonReact.UpdateWithSideEffects(newState, _ => Modal.setFocus())
        } else {
          ReasonReact.Update(newState)
        }
      };

      switch (action) {
        | SetRoot(path) => ReasonReact.Update({...state, root: path})
        | SetPwd(path) => ReasonReact.UpdateWithSideEffects(
          {...state, pwd: path},
          /*
           * Chromium seems to hold a copy of every image in the webframe cache. This can cause the
           * memory used to balloon, looking alarming to users.  webFrame.clearCache() unloads these
           * images, dropping memory at the cost of directory load time.
           */
          _ => electron##webFrame##clearCache()
        )
        | SetImages(images) => ReasonReact.Update({...state, images: images})
        | SetSearchActive(enabled) => ReasonReact.Update({...state, search: enabled})
        | ModalAction(m) => switch (m) {
          | SetActive(active) =>
            ReasonReact.UpdateWithSideEffects(
              {...state, modal: {...state.modal, active: active}},
              _ => {
                Modal.setBodyOverflow(active);
                menu##setModalOpen(active)
              }
            )
          | SetZoom(zoomed) => setZoom(zoomed)
          | ZoomToggle => setZoom(!state.modal.zoomed)
          | Advance(forward) when !state.modal.zoomed => {
            let next = Modal.advance(state.modal.current, state.images, forward);
            switch (next) {
            | None => ReasonReact.NoUpdate
            | Some(i) => ReasonReact.Update({...state, modal: {...state.modal, current:i}})
            }
          }
          | Set(image)    => ReasonReact.Update({...state, modal: {...state.modal, current:image}})
          | _ => ReasonReact.NoUpdate
        }
      }
    },

    render: self => {
      let openModal = (path: Path.absolute) => (_event) => {
        self.send(ModalAction(Modal.SetActive(true)));
        self.send(ModalAction(Modal.Set(path)))
      };

      let setPwd = (path: Path.base) => (_event) => {
        self.send(SetPwd(path));
        self.send(SetImages(Path.images(path)));
      };

      Js.log(self.state.root.path);

      if (self.state.root.path == "") {
        /* Show drag and drop */
        <div className="dragndrop">
          <img src="assets/icon_512x512.png" />
          <p>{ReasonReact.string("Drag & drop a folder to get started")}</p>
        </div>
      } else {
        let dirs = {
          let subdirs = Array.to_list(Path.subdirs(self.state.pwd));
          if (self.state.pwd != self.state.root) {
            [Path.up(self.state.pwd), ...subdirs]
          } else {
            subdirs
          }
        };
        let pwdPath = Path.renderable(self.state.pwd, self.state.pwd, self.state.root);
        let imageCount = Array.length(self.state.images)
        let pwd = {j|$(pwdPath) ($(imageCount))|j};

        let header = {
          <header className="main-header">
            <Search
              active={self.state.search}
              root={self.state.root}
              pwd={self.state.pwd}
              setSearchActive={(enabled) => self.send(SetSearchActive(enabled))}
              setImages={(images) => self.send(SetImages(images))}
            />
            {if (!self.state.search) {
              <div>
                <h3>{ReasonReact.string(pwd)}</h3>
                <Directories
                  paths={Array.of_list(dirs)}
                  root={self.state.root}
                  pwd={self.state.pwd}
                  setPwd={setPwd}
                />
              </div>
            } else {
              ReasonReact.null
            }}
          </header>
        };

        <div>
          <Modal
            state={self.state.modal}
            sendAction={(a: Modal.action) => self.send(ModalAction(a))}
          />
          {header}
          <ImageGrid
            images={self.state.images}
            openModal={openModal}
          />
        </div>
      }
    }
  }
  }
}

let sendMainAction = ref(None);
let setSendMainAction = (a) => {
  sendMainAction := Some(a)
};
let setMain = (images: array(string)): unit => {
  switch (sendMainAction^) {
  | None => Js.log("sendMainAction is None")
  | Some(f) => f(Main.SetImages(Array.map((i) => Path.asAbsolute(i), images)))
  }
};
let b = Main.make(setSendMainAction, [||]);
ReactDOMRe.renderToElementWithId(ReasonReact.element(b), "browser-root");

/* Extract send function and send action or log error */
let sendAction = (a: Main.action): unit => {
  switch (sendMainAction^) {
  | None => Js.log("sendMainAction is None")
  | Some(f) => f(a)
  }
};

/* Extract current state or log error and return zero values */
let getState = () => {
  switch (Main.readOnlyState^) {
  | None => {
    Js.log("Main.readOnlyState is None");
    Main.{
      root: Path.asBase(""),
      pwd: Path.asBase(""),
      images: [||],
      search: false,
      modal: Modal.{
        active: false,
        zoomed: false,
        current: Path.asAbsolute(""),
      }
    }
  }
  | Some(s) => s
  }
};

let setModal = (image: string) => {
  sendAction(ModalAction(Modal.Set(Path.asAbsolute(image))));
}
let isModalOpen = (): bool => getState().modal.active;
let currentImage = (): string => getState().modal.current.path;
let openModal = () => sendAction(ModalAction(Modal.SetActive(true)));
let closeModal = () => sendAction(ModalAction(Modal.SetActive(false)));
let setImageList = (images: array(string)) => {
  sendAction(SetImages(
    Array.map(x => Path.asAbsolute(x), images)
  ))
};
let setRoot = (s: string) => {
  let p = Path.asBase(s);
  sendAction(SetPwd(p));
  sendAction(SetRoot(p));
  sendAction(SetImages(Path.images(p)));
}
let crossPlatform = Path.crossPlatform;
