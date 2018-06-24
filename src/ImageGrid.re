let preload = 40;

let component = ReasonReact.statelessComponent("ImageGrid");
let make = (~images: array(Path.absolute), ~showFull, ~ncols, ~openModal, _children) => {
  ...component,

  render: (self) => {
    let shownImages =
      if (showFull) {
        images
      } else {
        Array.sub(images, 0, Pervasives.min(preload, Array.length(images)))
      };
    let imageComponents =
      Array.map(
        (i) => { <Image image={i} openModal={openModal} /> },
        shownImages
      );

    let columns = [||];
    for (_ in 0 to ncols-1) {
      Js.Array.push(ref([]), columns);
    };
    Array.iteri(
      (i, img) => {
        columns[i mod ncols] := [img, ...columns[i mod ncols]^];
      },
      imageComponents
    );
    Array.iter((c) => c := List.rev(c^), columns);
    let columnDivs = Array.map(
      (c) => {
        ReasonReact.createDomElement(
          "div",
          ~props={"className": "image-column"},
          Array.of_list(c^)
        )
      },
      columns
    );


    /* cannot directly use <div>, see
     * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
    ReasonReact.createDomElement(
      "div",
      ~props={"id": "images", "className": "images-container"},
      columnDivs
    );
  }
}
