let preload = 40;

let limitIf = (xs: array('x), b: bool, n: int) =>
  if (b) {
    Array.sub(xs, 0, Pervasives.min(n, Array.length(xs)));
  } else {
    xs;
  };

let component = ReasonReact.statelessComponent("ImageGrid");
let make =
    (
      ~images: array(Path.absolute),
      ~showFull,
      ~ncols,
      ~imageOnClick,
      ~selectedList: Js.Array.t(Path.absolute),
      _children,
    ) => {
  ...component,
  render: self => {
    let makeImage = (image: Path.absolute) => {
      let selected = Js.Array.includes(image, selectedList);
      <Image image imageOnClick selected />;
    };
    let makeColumn = c =>
      ReasonReact.createDomElement(
        "div",
        ~props={"className": "image-column"},
        Array.of_list(c^),
      );

    /* Limit images to preload if showFull is false */
    let shownImages = limitIf(images, ! showFull, preload);

    let imageComponents = Array.map(makeImage, shownImages);

    /* Split images across n cols, in row order */
    let columns = [||];
    for (_ in 0 to ncols - 1) {
      Js.Array.push(ref([]), columns);
    };
    Array.iteri(
      (i, img) => columns[i mod ncols] := [img, ...columns[i mod ncols]^],
      imageComponents,
    );
    Array.iter(c => c := List.rev(c^), columns);
    let columnDivs = Array.map(makeColumn, columns);

    /* cannot directly use <div>, see
     * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
    ReasonReact.createDomElement(
      "div",
      ~props={"id": "images", "className": "images-container"},
      columnDivs,
    );
  },
};
