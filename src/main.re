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

let setModal = (image: string, imageList: array(string)) => {
  sendAction(Modal.Set(image));
  sendAction(Modal.SetImages(imageList));
}
let isModalOpen = (): bool => getState().active;
let currentImage = (): string => getState().current;
let openModal = () => sendAction(Modal.Open);
let closeModal = () => sendAction(Modal.Close);
let setImageList = (images: array(string)) => sendAction(Modal.SetImages(images));
