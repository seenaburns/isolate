[@bs.val] external document: 'jsModule = "document";
[@bs.val] external window: 'jsModule = "window";

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

let advance = (current: 'a, images: array('a), forward: bool): option('a) => {
  let currentIndex = findIndex(Array.to_list(images), current, 0);
  if (forward && currentIndex < Array.length(images) -1) {
    Some(images[currentIndex + 1]);
  } else if (!forward && currentIndex > 0) {
    Some(images[currentIndex - 1]);
  } else {
    None
  }
};

type state = {
  active: bool,
  zoomed: bool,
  current: Path.absolute,
}

type action =
  | SetActive(bool)
  | SetZoom(bool)
  | ZoomToggle
  | Advance(bool) /* true if advance forward */
  | Set(Path.absolute)

let str = ReasonReact.string;

let svg_close = {| <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 24 24"stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> |};
let svg_zoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};
let svg_unzoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};


let component = ReasonReact.statelessComponent("Modal");
let make = (~state: state, ~sendAction: (action) => unit, _children) => {
  ...component,
  render: self => {
    let containerClasses = {
      let default = "modal-container";
      let zoomClass =
        switch (state.zoomed) {
        | true => "modal-zoomed"
        | false => "modal-unzoomed"
        };
      default ++ " " ++ zoomClass
    };

    if (state.active) {
      <div id="modal" className="modal-back">
        <div id="modal-container" className={containerClasses}>
          <header>
            <div id="modal-controls" className="modal-controls">
              <span
                id="close"
                dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_close } |}]
                onClick={(e) => sendAction(SetActive(false))}>
              </span>
              {if (state.zoomed) {
                <span
                  id="unzoom"
                  dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_unzoom } |}]
                  onClick={(e) => sendAction(SetZoom(false))}>
                </span>
              } else {
                <span
                  id="zoom"
                  dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_zoom } |}]
                  onClick={(e) => sendAction(SetZoom(true))}>
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

          <div id="modal-content" className="modal-content" onClick={(e) => sendAction(SetActive(false))}>
            <img src={Path.makeUrl(state.current).url} />
          </div>
        </div>
      </div>
    } else {
      ReasonReact.null
    }
  }
};
