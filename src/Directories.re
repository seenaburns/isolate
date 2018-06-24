let component = ReasonReact.statelessComponent("Directories");
let make = (~paths: array(Path.base), ~pwd: Path.base, ~root: Path.base, ~setPwd, _children) => {
  ...component,
  render: _self => {
    let directories = Array.map((p: Path.base) => {
      <li>
        <a href="#" onClick={setPwd(p)}>{ReasonReact.string(Path.renderable(p, pwd, root))}</a>
      </li>
    }, paths);

    let dirList = ReasonReact.createDomElement("ul", ~props={"id": "dirs"}, directories);

    /* cannot set children directly, see
     * https://reasonml.github.io/reason-react/docs/en/children.html#pitfall */
    <nav>
      {dirList}
    </nav>
  }
}
