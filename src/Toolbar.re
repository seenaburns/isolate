let component = ReasonReact.statelessComponent("Toolbar");
let make =
    (
      ~dirs,
      ~mode,
      ~pwd,
      ~root,
      ~move,
      ~search,
      ~setImages,
      ~setMode,
      ~setPwd,
      ~setSearchActive,
      _children,
    ) => {
  ...component,
  render: self =>
    <header className="main-header">
      (
        if (! search) {
          <Directories paths=(Array.of_list(dirs)) root pwd setPwd />;
        } else {
          ReasonReact.null;
        }
      )
      <div className="toolbar">
        (
          if (! search) {
            <h3> (ReasonReact.string(pwd.path)) </h3>;
          } else {
            ReasonReact.null;
          }
        )
        <Search active=search root pwd setSearchActive setImages />
        <Edit mode pwd root move onClick=((m, _) => setMode(m)) />
      </div>
    </header>,
};
