[@bs.val] external document: 'jsModule = "document";

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
    images: array(Path.absolute),
    modal: Modal.state,
  }

  type action =
    | SetImages(array(Path.absolute))
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
    didUpdate: ({oldSelf, newSelf}) => {
      readOnlyState := Some(newSelf.state);
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
        | SetImages(images) => ReasonReact.Update({...state, images: images})
        /* Let modal.re define the state transitions for now */
        | ModalAction(m) => switch (m) {
          | SetActive(active) =>
            ReasonReact.UpdateWithSideEffects(
              {...state, modal: {...state.modal, active: active}},
              _ => Modal.setBodyOverflow(active)
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
      let openModal = (path: Path.absolute) => (event) => {
        self.send(ModalAction(Modal.SetActive(true)));
        self.send(ModalAction(Modal.Set(path)))
      };

      <div>
      <Modal state={self.state.modal} sendAction={(a: Modal.action) => self.send(ModalAction(a))} />
      <ImageGrid images={self.state.images} openModal={openModal} />
      </div>
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
      images: [||],
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
