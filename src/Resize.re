[@bs.val] external document : 'jsModule = "document";

/* Resize
 * Keep a mutable value (colw) of the minimum width of a column. Resizing increases the width of the
 * columns until an additional column can be added.
 *
 * ZoomIn/ZoomOut mutate colw and recalculate the columns.
 */
let colw = ref(200);
let imagesWidth = () : int => document##querySelector("#images")##clientWidth;
let cols = () : int => max(1, imagesWidth() / colw^);
let resize = () => Main.sendAction(State.Resize(cols()));

/* Register event listener for window resize
 * resizeThrottler limits resize to one call per 100ms
 */
let resizeTimeout = ref(None);
let resizeThrottler = () =>
  switch (resizeTimeout^) {
  | None =>
    resizeTimeout :=
      Some(
        Js.Global.setTimeout(
          () => {
            Js.log("resize");
            resizeTimeout := None;
            resize();
          },
          100,
        ),
      )
  | Some(_) => ()
  };

[@bs.send]
external addEventListener : ('a, string, 'b => 'c, bool) => unit =
  "addEventListener";
let window = [%bs.raw {| window |}];
addEventListener(window, "resize", resizeThrottler, false);

let resizeDoubleThreshold = 6;
/* Calculate a new colw such that there are now more or less columns displayed.
 * Increasing/decreasing columns by one works when there are few columns, but after a certain point
 * the change in size is small (a few pixels). At this point switch to doubling the number of
 * columns per zoom.
 */
let desiredSize = (zoomIn: bool) : int => {
  let c = cols();

  let desiredCols =
    if (zoomIn) {
      if (c <= resizeDoubleThreshold) {
        c - 1;
      } else {
        max(resizeDoubleThreshold, c / 2);
      };
    } else if (c < resizeDoubleThreshold) {
      c + 1;
    } else {
      c * 2;
    };

  max(100, imagesWidth() / desiredCols);
};

let zoomIn = () => {
  colw := desiredSize(true);
  resize();
};
let zoomOut = () => {
  colw := desiredSize(false);
  resize();
};
