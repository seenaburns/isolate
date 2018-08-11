let throttle = (rate_ms: int, f: unit => unit) => {
  let timeout = ref(None);
  let throttler = () =>
    switch (timeout^) {
    | None =>
      timeout :=
        Some(
          Js.Global.setTimeout(
            () => {
              timeout := None;
              f();
            },
            rate_ms,
          ),
        )
    | Some(_) => ()
    };
  ();
  throttler;
};

/* 
 * Nightmode functions
 * 
 * TODO: this is a really hacky copy from js into reason, so both reason and js
 * can depend on the code. This should be moved into some state owned by the
 * main component, and changed by a reducer.
 */
let setNightMode: bool => unit = [%bs.raw
  {|
  function (enabled) {
    if (enabled) {
      document.querySelector("body").classList.add('nightmode')
    } else {
      document.querySelector("body").classList.remove('nightmode')
    };

    if (process.platform == "win32") {
      require('./scrollbar').SetNightmode(enabled);
    }

    require('./menu').Options.NightMode = enabled;
    require('./menu').UpdateMenu()

    require('./userData').SetKey("night_mode", enabled, "settings.json")
  }
|}
];

let nightModeEnabled: unit => bool = [%bs.raw
  {|
    function () {
      return document.querySelector("body").classList.contains('nightmode')
    }
  |}
];

let toggleNightMode = () => {
  let curr = nightModeEnabled();
  setNightMode(!curr);
}
