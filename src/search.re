/* Cache of files in directory tree */
let files: ref(option(array(Path.absolute))) = ref(None);

let loadFiles = (root: Path.base) => {
  switch (files^) {
    | None => files := Some(Path.directoryWalk(root, 5))
    | Some(_) => ()
  }
}


let search = (root: Path.base, query: string): array(Path.absolute) => {
  loadFiles(root);

  Js.log(query);
  let queryRe = Js.Re.fromString(query);

  switch (files^) {
    | None => {
      Js.log("No files loaded for search");
      [||]
    }
    | Some(filepaths) => Array.of_list(
      List.filter(
        (p: Path.absolute) => {
          Js.Option.isSome(Js.Re.exec(p.path, queryRe))
        },
        Array.to_list(filepaths)
      )
    )
  }
}

type state = {
  /* Active tracks if a search has been made, and the image grid is showing search results */
  active: bool,
}

type action =
  | SetActive(bool)

/* TODO: hide PWD on search
 * TODO: hide dirs on search
 */
let component = ReasonReact.reducerComponent("Search");
let make = (~root, ~pwd, ~setImages, _children) => {
  ...component,

  initialState: () => {
    active: false,
  },

  reducer: (action: action, _state) => switch(action) {
    | SetActive(b) => ReasonReact.Update({active: b})
  },

  render: self => {
    let back = (_event, self) => {
      /* Annotating send to appease the type checking */
      self.ReasonReact.send(SetActive(false));
      setImages(Path.images(pwd))
    };

    let onkeydown = (e, self) => {
      if (e##key == "Enter") {
        e##preventDefault();
        self.ReasonReact.send(SetActive(true));
        setImages(search(root, e##target##value))
      }
    }

    let input = ReasonReact.createDomElement(
      "input",
      ~props={
        "type": "text",
        "class": "search",
        "placeholder": "Search..",
        "onKeyDown": {self.handle(onkeydown)},
      },
      [||]
    );

    let controls = if (self.state.active) {
      <a href="#" onClick={self.handle(back)}>{ReasonReact.string("Back")}</a>
    } else {
      ReasonReact.null
    };

    <div>
      {input}
      {controls}
    </div>
  }
}
