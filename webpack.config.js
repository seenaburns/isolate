const path = require("path");

module.exports = {
  mode: "none",
  entry: "./src/renderer.tsx",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "renderer.js"
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
  },
  target: "electron-renderer"
};
