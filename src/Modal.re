[@bs.val] external document : 'jsModule = "document";
[@bs.val] external window : 'jsModule = "window";
let electron: 'jsModule = [%bs.raw {| require("electron") |}];

let str = ReasonReact.string;

let svg_close = {| <svg fill="none" stroke="currentColor" width="24" height="24" viewBox="0 0 24 24"stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> |};
let svg_zoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};
let svg_unzoom = {| <svg fill="none" stroke="currentColor" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg> |};

let component = ReasonReact.statelessComponent("Modal");
let make =
    (
      ~state: State.Modal.state,
      ~sendAction: State.Modal.action => unit,
      _children,
    ) => {
  ...component,
  render: _ => {
    let containerClasses = {
      let default = "modal-container";
      let zoomClass = state.zoomed ? "modal-zoomed" : "modal-unzoomed";
      default ++ " " ++ zoomClass;
    };

    if (state.active) {
      <div id="modal" className="modal-back">
        <div id="modal-container" className=containerClasses>
          <header>
            <div id="modal-controls" className="modal-controls">
              <span
                id="close"
                dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_close } |}]
                onClick=(_ => sendAction(SetActive(false)))
              />
              (
                if (state.zoomed) {
                  <span
                    id="unzoom"
                    dangerouslySetInnerHTML=[%bs.raw
                      {| {__html: svg_unzoom } |}
                    ]
                    onClick=(_ => sendAction(SetZoom(false)))
                  />;
                } else {
                  <span
                    id="zoom"
                    dangerouslySetInnerHTML=[%bs.raw {| {__html: svg_zoom } |}]
                    onClick=(_ => sendAction(SetZoom(true)))
                  />;
                }
              )
            </div>
            <div className="viewer-metadata">
              <span id="viewer-description" />
              <span id="viewer-src">
                <a
                  href="#"
                  onClick=(
                    _ => {
                      let p = Path.crossPlatform(state.current.path);
                      electron##shell##showItemInFolder(p);
                    }
                  )>
                  (ReasonReact.string(state.current.path))
                </a>
              </span>
            </div>
          </header>
          <div
            id="modal-content"
            className="modal-content"
            onClick=(_ => sendAction(SetActive(false)))>
            <img src=Path.makeUrl(state.current).url />
          </div>
        </div>
      </div>;
    } else {
      ReasonReact.null;
    };
  },
};
