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
      didUpdate: ({_oldSelf, newSelf}) => {
        readOnlyState := Some(newSelf.state);
      },

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
        let message: string = "Active: " ++ self.state.current;
        <div>
          (ReasonReact.string(message))
        </div>
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

let setModal_Reason = (image: string) => sendAction(Modal.Set(image));
let isModalOpen_Reason = (): bool => getState().active;
let currentImage_Reason = (): string => getState().current;
let openModal_Reason = () => sendAction(Modal.Open);
let closeModal_Reason = () => sendAction(Modal.Close);
let setModalZoom_Reason = (zoom: bool): unit => {
  if (zoom) {
    sendAction(Modal.ZoomIn)
  } else {
    sendAction(Modal.ZoomOut)
  }
};
let toggleModalZoom_Reason = (): unit => {
  setModalZoom_Reason(getState().zoomed)
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

let advance_Reason = (images: array(string), forward: bool): unit => {
  let currentIndex = findIndex(Array.to_list(images), getState().current, 0);
  if (forward && currentIndex < Array.length(images) -1) {
    sendAction(Modal.Set(images[currentIndex + 1]));
  } else if (!forward && currentIndex > 0) {
    sendAction(Modal.Set(images[currentIndex - 1]));
  }
};
