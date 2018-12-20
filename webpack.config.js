const path = require("path");

function target(entry, output, overrides) {
  const opts = {
    mode: "none",
    entry: entry,
    output: {
      path: path.resolve(__dirname, "build"),
      filename: output
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader"
        },
        {
          test: /\.css$/,
          use: [{ loader: "style-loader" }, { loader: "css-loader" }]
        }
      ]
    },
    resolve: {
      extensions: [".tsx", ".tx", ".js"]
    }
  };

  return Object.assign(opts, overrides);
}

module.exports = [
  target("./src/renderer.tsx", "renderer.js", {
    externals: {
      sharp: "commonjs sharp",
      sqlite3: "commonjs sqlite3"
    },
    target: "electron-renderer"
  }),
  target("./src/main.tsx", "main.js", {
    node: {
      __dirname: false
    },
    target: "electron-main"
  }),
  target("./src/worker.tsx", "worker.js", {
    externals: {
      sharp: "commonjs sharp",
      sqlite3: "commonjs sqlite3"
    },
    target: "electron-renderer"
  })
];
