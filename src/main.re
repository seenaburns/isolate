[@bs.val] external require: string => 'jsModule = "require";
[@bs.val] external process: 'jsModule = "process";
let electron = require("electron");
external unsafeCast: 'A => 'B = "%identity";
[@bs.val] external document: 'jsModule = "document";

module Modal = {
  type state = {
    active: bool,
    zoomed: bool,
    current: string,
    imageList: array(string),
  }

  type action =
    | Open
    | Close
    | ZoomIn
    | ZoomOut
    | ZoomToggle
    | Advance(bool) /* true if advance forward */
    | Set(string)
    | SetImages(array(string))

  let readOnlyState: ref(option(state)) = ref(None)

  let str = ReasonReact.string;

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

  let advance = (current: string, images: array(string), forward: bool): option(string) => {
    let currentIndex = findIndex(Array.to_list(images), current, 0);
    if (forward && currentIndex < Array.length(images) -1) {
      Some(images[currentIndex + 1]);
    } else if (!forward && currentIndex > 0) {
      Some(images[currentIndex - 1]);
    } else {
      None
    }
  };

  let component = ReasonReact.reducerComponent("Modal");
  let make = (setSendAction, _children) => {
      let keydown = (self: ReasonReact.self('a, 'b, 'c)) => (e) => {
        Js.log(e##key);
        switch (e##key) {
        | "Escape" => self.send(Close)
        | "z" => self.send(ZoomToggle)
        | "ArrowRight" => self.send(Advance(true))
        | "ArrowLeft" => self.send(Advance(false))
        | _ => ()
        }
      };

      {
      ...component,
      initialState: () =>
      {
        active: true,
        zoomed: false,
        current: "",
        imageList: [||],
      },

      /* Temporary while migrating to ReasonReact,
       * allows internal state to be visible (via Modal.readOnlyState) and set externally (via
       * setSendAction)
       */
      didMount: self => {
        document##addEventListener("keydown", keydown(self));
        setSendAction(self.send);
      },
      didUpdate: ({oldSelf, newSelf}) => {
        readOnlyState := Some(newSelf.state);
      },

      /*
       * TODO: set menu on open/close
       * TODO: set body.style.overflow on open/close
       * TODO: set context.tabIndex and content.focus on zoom
      */
      reducer: (action: action, state) =>
        switch (action) {
        | Open          => ReasonReact.Update({...state, active:true})
        | Close         => ReasonReact.Update({...state, active:false})
        | ZoomIn        => ReasonReact.Update({...state, zoomed:true})
        | ZoomOut       => ReasonReact.Update({...state, zoomed:false})
        | ZoomToggle    => ReasonReact.Update({...state, zoomed:!state.zoomed})
        | Advance(forward) => {
          let next = advance(state.current, state.imageList, forward);
          switch (next) {
          | None => ReasonReact.NoUpdate
          | Some(i) => ReasonReact.Update({...state, current:i})
          }
        }
        | Set(image)    => ReasonReact.Update({...state, current:image})
        | SetImages(is) => ReasonReact.Update({...state, imageList:is})
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
      }
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
      imageList: [||],
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
let setImageList = (images: array(string)) => sendAction(Modal.SetImages(images));
