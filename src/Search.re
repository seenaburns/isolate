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

let component = ReasonReact.statelessComponent("Search");
let make = (~active, ~root, ~pwd, ~setImages, ~setSearchActive, _children) => {
  ...component,

  render: self => {
    let back = (_event, self) => {
      setSearchActive(false);
      setImages(Path.images(pwd))
    };

    let onkeydown = (e, self) => {
      if (e##key == "Enter") {
        e##preventDefault();
        setSearchActive(true);
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

    let controls = if (active) {
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
