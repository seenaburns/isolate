[@bs.val] external document: 'jsModule = "document";
[@bs.val] external window: 'jsModule = "window";
/* let coerce = (a: 'a): 'b => Obj.magic(a); */

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

let svg_close = {| <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 24 24"stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> |};
let svg_zoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};
let svg_unzoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};

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


    let setBodyOverflow = (hidden: bool): unit =>
      switch (hidden) {
        | false => [%bs.raw {| document.querySelector("body").style.overflow = "visible" |}];
        | true => [%bs.raw {| document.querySelector("body").style.overflow = "hidden" |}];
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
    */
    reducer: (action: action, state) =>
      switch (action) {
      | Open          => ReasonReact.UpdateWithSideEffects({...state, active:true}, _ => setBodyOverflow(true))
      | Close         => ReasonReact.UpdateWithSideEffects({...state, active:false}, _ => setBodyOverflow(false))
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
                <span
                  id="close"
                  dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_close } |}]
                  onClick={(e) => self.send(Close)}>
                </span>
                {if (self.state.zoomed) {
                  <span
                    id="unzoom"
                    dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_unzoom } |}]
                    onClick={(e) => self.send(ZoomOut)}>
                  </span>
                } else {
                  <span
                    id="zoom"
                    dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_zoom } |}]
                    onClick={(e) => self.send(ZoomIn)}>
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
