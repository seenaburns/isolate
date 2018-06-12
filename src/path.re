type absolute = {path: string};
type relative = {path: string};
type base = {path: string};
type url = {url: string};

let asAbsolute = (s: string): absolute => {path: s};
let asRelative = (s: string): relative => {path: s};
let asBase = (s: string): base => {path: s};
let asUrl = (s: string): url => {url: s};

let removeDuplicateSlash: (string) => string = [%bs.raw
  {|
    function (s) {
      return s.replace("//", "/");
    }
  |}
];

let makeUrl = (path: absolute): url => {
  {url: "file://" ++ path.path}
};

let makeAbsolute = (root: base, path: relative): absolute => {
  {path: root.path ++ path.path}
};

let join = (a: relative, b: relative): relative => {
  {path: removeDuplicateSlash(a.path ++ "/" ++ b.path)}
};

