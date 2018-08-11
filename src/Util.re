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
