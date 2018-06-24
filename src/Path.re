type absolute = {path: string};
type relative = {path: string};
/* Base is an absolute path for a directory, e.g. /Users/me/pictures/ */
type base = {path: string};
type url = {url: string};

let asAbsolute = (s: string) : absolute => {path: s};
let asRelative = (s: string) : relative => {path: s};
let asBase = (s: string) : base => {path: s};
let asUrl = (s: string) : url => {url: s};

type nodefs;
type lstat;
[@bs.send] external readdirSync : (nodefs, string) => array(string) = "";
[@bs.send] external lstatSync : (nodefs, string) => lstat = "";
[@bs.send] external lstatIsFile : lstat => bool = "isFile";
[@bs.send] external lstatIsDirectory : lstat => bool = "isDirectory";
let fs: nodefs = [%bs.raw {| require("fs") |}];

let removeDuplicateSlash: string => string = [%bs.raw
  {|
    function (s) {
      return s.replace("//", "/");
    }
  |}
];

let ext: string => string = [%bs.raw
  {|
    function (s) {
      return s.split('.').pop();
    }
  |}
];

let makeUrl = (path: absolute) : url => {url: "file://" ++ path.path};

/* Join paths by adding a slash between
 * _join defines an untyped version that can be used by the typed functions join, makeAbsolute
 */
let _join = (a: string, b: string) : string =>
  removeDuplicateSlash(a ++ "/" ++ b);
let join = (a: relative, b: relative) : relative =>
  asRelative(_join(a.path, b.path));
let makeAbsolute = (root: base, path: relative) : absolute =>
  asAbsolute(_join(root.path, path.path));

let isFile = (path: absolute) : bool =>
  lstatIsFile(lstatSync(fs, path.path));
let isDir = (path: absolute) : bool =>
  lstatIsDirectory(lstatSync(fs, path.path));
let isImage = (path: absolute) : bool => {
  let imageExts = ["jpeg", "jpg", "png", "gif", "svg"];
  List.exists(p => p == ext(path.path), imageExts);
};

/* List directory contents of path
 * Wrap node's fs.readdirSync(s) in types
 */
let contents = (path: base) : array(absolute) => {
  let paths = Array.map(asRelative, readdirSync(fs, path.path));
  Array.map(p => makeAbsolute(path, p), paths);
};

/* List directory contents, limited to only directories */
let subdirs = (path: base) : array(base) => {
  let paths = Array.to_list(contents(path));
  let dirs = List.filter(isDir, paths);
  let coerced = List.map((p: absolute) => asBase(p.path), dirs);
  Array.of_list(coerced);
};

/* List directory contents, filtered to only images */
let images = (path: base) : array(absolute) => {
  let paths = Array.to_list(contents(path));
  let images = List.filter(p => isFile(p) && isImage(p), paths);
  Array.of_list(images);
};

/* Return directory one up from given */
let up = (path: base) : base => {
  let upJs: string => string = [%bs.raw
    {|
      function (s) {
        let parts = s.split('/')
        return parts.slice(0,parts.length-1).join('/');
      }
    |}
  ];
  asBase(upJs(path.path));
};

/* Renders an absolute path to a directory as what is diplayed to the user
 * TODO: not very robust, with a better Path module, this could look at path parts/segments
 * instead, but this will do for now
 *
 * Examples:
 *   path: /a/b, pwd: /a/b/c, root: / = ../
 *   path: /a/b/c, pwd: /a, root: / = a/b
 */
let renderable = (path: base, pwd: base, root: base) : string =>
  if (String.length(path.path) < String.length(pwd.path)) {
    "../";
  } else if (path.path == root.path) {
    "/";
  } else {
    let rootLen = String.length(root.path);
    let pathLen = String.length(path.path);

    if (rootLen < pathLen) {
      /* Return path - root prefix */
      String.sub(
        path.path,
        rootLen,
        pathLen - rootLen,
      );
    } else {
      path.path;
    };
  };

/* Load all the images up to N levels deep starting from given path */
let rec directoryWalk = (basepath: base, remainingDepth) : array(absolute) =>
  if (remainingDepth <= 0) {
    [||];
  } else {
    let paths = Array.map(asRelative, readdirSync(fs, basepath.path));
    Array.fold_left(
      (files: array(absolute), p: relative) => (
        {
          let abs = makeAbsolute(basepath, p);
          if (isDir(abs)) {
            Array.append(
              files,
              directoryWalk(asBase(abs.path), remainingDepth - 1),
            );
          } else if (isImage(abs)) {
            Array.append(files, [|abs|]);
          } else {
            files;
          };
        }:
          array(absolute)
      ),
      [||],
      paths,
    );
  };
let isFile = (path: absolute) : bool =>
  lstatIsFile(lstatSync(fs, path.path));
let isDir = (path: absolute) : bool =>
  lstatIsDirectory(lstatSync(fs, path.path));

/*
 * Hacky function to convert unix paths to windows paths
 * img elements in the ui still work with unix paths on windows, but
 * - showItemInFolder and copy both need the leading slash removed
 * - showItemInFolder will not highlight the item in the folder if there are forward slashes
 *   in the path
 *
 * Translates /C:/path/like/this.png -> C:\path\like\this.png
 */
let toWindowsPath: string => string = [%bs.raw
  {|
    function toWindowsPath(path) {
        if (path.length > 0 && path[0] == '/') {
          path = path.substr(1)
        }
        return path.replace(/\//g, '\\')
    }
  |}
];

let crossPlatform = (p: string) : string => {
  let windows: bool = [%bs.raw {| process.platform == 'win32' |}];
  if (windows) {
    toWindowsPath(p);
  } else {
    p;
  };
};
