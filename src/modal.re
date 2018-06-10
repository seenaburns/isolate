[@bs.val] external document: 'jsModule = "document";
[@bs.val] external window: 'jsModule = "window";

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
      switch (e##key) {
      | "Escape" => self.send(Close)
      | "z" => self.send(ZoomToggle)
      | "ArrowRight" => self.send(Advance(true))
      | "ArrowLeft" => self.send(Advance(false))
      | _ => ()
      }
    };

    /* Set modal-content to focused element so arrow keys immediately scroll the image, not the
     * background
     */
    let setFocus = () => {
        [%bs.raw {| document.getElementById("modal-content").tabIndex = 0 |}];
        [%bs.raw {| document.getElementById("modal-content").focus() |}];
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
    */
    reducer: (action: action, state) =>
      switch (action) {
      | Open          => ReasonReact.Update({...state, active:true})
      | Close         => ReasonReact.Update({...state, active:false})
      | ZoomIn        => ReasonReact.UpdateWithSideEffects({...state, zoomed:true}, _ => setFocus())
      | ZoomOut       => ReasonReact.Update({...state, zoomed:false})
      | ZoomToggle    => ReasonReact.UpdateWithSideEffects({...state, zoomed:!state.zoomed}, _ => setFocus())
      | Advance(forward) when !state.zoomed => {
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

            <div id="modal-content" className="modal-content" onClick={(e) => self.send(Close)}>
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
