const common = require("./webpack.common.js");

module.exports = common.map(config =>
  Object.assign(config, {
    mode: "development"
  })
);
