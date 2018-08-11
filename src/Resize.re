[@bs.val] external document : 'jsModule = "document";

/* Resize
 * Functions for computing new column count of image grid
 */

let resize_double_threshold = 6;
let getImagesClientWidth = () : int => document##querySelector("#images")##clientWidth;

let columnsThatFit = (imageGridWidth: int, colw: int) : int =>
  max(1, imageGridWidth / colw);

/* Calculate a new colw such that there are now more or less columns displayed.
 * Increasing/decreasing columns by one works when there are few columns, but after a certain point
 * the change in size is small (a few pixels). At this point switch to doubling the number of
 * columns per zoom.
 */
let calcNewDesiredColumnWidth =
    (imageGridWidth: int, ncols: int, larger: bool)
    : (int, int) => {
  let desiredCols =
    if (larger) {
      if (ncols <= resize_double_threshold) {
        ncols - 1;
      } else {
        max(resize_double_threshold, ncols / 2);
      };
    } else if (ncols < resize_double_threshold) {
      ncols + 1;
    } else {
      ncols * 2;
    };

  let newDesiredWidth = max(100, imageGridWidth / desiredCols);

  (desiredCols, newDesiredWidth);
};
