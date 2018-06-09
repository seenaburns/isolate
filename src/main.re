[@bs.val] external require: string => 'jsModule = "require";
[@bs.val] external process: 'jsModule = "process";
let electron = require("electron");
external unsafeCast: 'A => 'B = "%identity";

module Modal = {
  type state = {
    active: bool,
    zoomed: bool,
    current: string,
  }

  type action =
    | Open
    | Close
    | ZoomIn
    | ZoomOut
    | Next
    | Prev
    | Set(string)

  let readOnlyState: ref(option(state)) = ref(None)

  let str = ReasonReact.string;

  let component = ReasonReact.reducerComponent("Modal");
  let make = (setSendAction, _children) => {
      ...component,
      initialState: () =>
      {
        active: true,
        zoomed: false,
        current: "",
      },

      /* Temporary while migrating to ReasonReact,
       * allows internal state to be visible (via Modal.readOnlyState) and set externally (via
       * setSendAction)
       */
      didMount: self => {
        setSendAction(self.send);
      },
      didUpdate: ({oldSelf, newSelf}) => {
        readOnlyState := Some(newSelf.state);
      },

      /*
       * TODO: set menu on open/close
       * TODO: set body.style.overflow on open/close
       * TODO: set context.tabIndex and content.focus on zoom
       * TODO: Prev/Next
      */
      reducer: (action: action, state) =>
        switch (action) {
        | Open       => ReasonReact.Update({...state, active:true})
        | Close      => ReasonReact.Update({...state, active:false})
        | ZoomIn     => ReasonReact.Update({...state, zoomed:true})
        | ZoomOut    => ReasonReact.Update({...state, zoomed:false})
        | Set(image) => ReasonReact.Update({...state, current:image})
        | _ => ReasonReact.NoUpdate
        },

      render: self => {
        let containerClasses = {
          let default = "modal-container";
          let zoomClass =
            switch (self.state.zoomed) {
            | true => "modal-zoomed"
            | false => "modal-unzoomed"
            };
          default ++ " " ++ zoomClass
        };

        if (self.state.active) {
          <div id="modal" className="modal-back">
            <div id="modal-container" className={containerClasses}>
              <header>
                <div id="modal-controls" className="modal-controls">
                  <span id="close" onClick={(e) => self.send(Close)}>
                    (str("close"))
                  </span>
                  {if (self.state.zoomed) {
                    <span id="unzoom" onClick={(e) => self.send(ZoomOut)}>
                      (str("unzoom"))
                    </span>
                  } else {
                    <span id="zoom" onClick={(e) => self.send(ZoomIn)}>
                      (str("zoom"))
                    </span>
                  }}
                </div>

                <div className="viewer-metadata">
                  <span id="viewer-description"></span>
                  <span id="viewer-src">
                    <a href=""></a>
                  </span>
                </div>
              </header>

              <div id="modal-content" className="modal-content">
                <img src={self.state.current} />
              </div>
            </div>
          </div>
        } else {
          ReasonReact.null
        }
      },
  };
};

let sendModalAction = ref(None);
let setSendAction = (a) => {
  sendModalAction := Some(a)
};

let m = Modal.make(setSendAction, [||]);
ReactDOMRe.renderToElementWithId(ReasonReact.element(m), "index1");

/* Extract send function and send action or log error */
let sendAction = (a: Modal.action): unit => {
  switch (sendModalAction^) {
  | None => Js.log("sendModalAction is None")
  | Some(f) => f(a)
  }
};

/* Extract current state or log error and return zero values */
let getState = () => {
  switch (Modal.readOnlyState^) {
  | None => {
    Js.log("Modal.readOnlyState is None");
    Modal.{
      active: false,
      zoomed: false,
      current: "",
    }
  }
  | Some(s) => s
  }
};

let setModal = (image: string) => sendAction(Modal.Set(image));
let isModalOpen = (): bool => getState().active;
let currentImage = (): string => getState().current;
let openModal = () => sendAction(Modal.Open);
let closeModal = () => sendAction(Modal.Close);
let setModalZoom = (zoom: bool): unit => {
  if (zoom) {
    sendAction(Modal.ZoomIn)
  } else {
    sendAction(Modal.ZoomOut)
  }
};
let toggleModalZoom = (): unit => {
  setModalZoom(getState().zoomed)
};

let rec findIndex = (a: list('a), x: 'a, index: int): int => {
  switch (a) {
  | [] => -1
  | [h, ...t] => {
      if (h == x) {
        index
      } else {
        findIndex(t, x, index + 1)
      }
    }
  }
};

let advance = (images: array(string), forward: bool): unit => {
  let currentIndex = findIndex(Array.to_list(images), getState().current, 0);
  if (forward && currentIndex < Array.length(images) -1) {
    sendAction(Modal.Set(images[currentIndex + 1]));
  } else if (!forward && currentIndex > 0) {
    sendAction(Modal.Set(images[currentIndex - 1]));
  }
};
