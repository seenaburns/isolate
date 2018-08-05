let component = ReasonReact.statelessComponent("Toolbar");
let make =
    (
      ~dirs,
      ~mode,
      ~pwd,
      ~root,
      ~move,
      ~searchActive,
      ~setImages,
      ~setMode,
      ~setPwd,
      ~setSearchActive,
      _children,
    ) => {
  ...component,
  render: self => {
    let search = (query: string) => {
      setSearchActive(true);
      setImages(Search.search(root, query));
    };

    let cancel = () => {
      setSearchActive(false);
      setImages(Path.images(pwd));
    };

    <header className="main-header">
      (
        if (! searchActive) {
          <Directories paths=(Array.of_list(dirs)) root pwd setPwd />;
        } else {
          ReasonReact.null;
        }
      )
      <div className="toolbar">
        (
          if (! searchActive) {
            <h3> (ReasonReact.string(pwd.path)) </h3>;
          } else {
            ReasonReact.null;
          }
        )
        <Search active=searchActive search cancel />
        <Edit mode pwd root move onClick=((m, _) => setMode(m)) />
      </div>
    </header>;
  },
};
