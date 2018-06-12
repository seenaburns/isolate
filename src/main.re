/*
 * TODO: onclick
 */
module Image {
  let component = ReasonReact.statelessComponent("Image");
  let make = (~image: Path.absolute, _children) => {
    ...component,
    render: _self => {
      let url = Path.makeUrl(image).url;
      Js.log(url);
      <div className="iw">
        <img src={url} />
      </div>
    }
  }
}

module ImageGrid {
  let component = ReasonReact.statelessComponent("ImageGrid");
  let make = (~images: array(Path.absolute), _children) => {
    ...component,
    render: _self => {
      let imageComponents = Array.map((i) => { <Image image={i} /> }, images);
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
  }

  type action =
    | SetImages(array(Path.absolute))

  let component = ReasonReact.reducerComponent("Main");
  let make = (setSendAction, _children) => {
    ...component,
    initialState: () => {images: [||]},
    didMount: self => setSendAction(self.send),
    reducer: (action: action, _state) =>
      switch (action) {
        | SetImages(images) => ReasonReact.Update({images: images})
      },
    render: self => {
      <ImageGrid images={self.state.images} />
    }
  }
}

let sendModalAction = ref(None);
let setSendAction = (a) => {
  sendModalAction := Some(a)
};

let m = Modal.make(setSendAction, [||]);
ReactDOMRe.renderToElementWithId(ReasonReact.element(m), "index1");

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

let setModal = (image: string, imageList: array(string)) => {
  sendAction(Modal.Set(image));
  sendAction(Modal.SetImages(imageList));
}
let isModalOpen = (): bool => getState().active;
let currentImage = (): string => getState().current;
let openModal = () => sendAction(Modal.Open);
let closeModal = () => sendAction(Modal.Close);
let setImageList = (images: array(string)) => sendAction(Modal.SetImages(images));
