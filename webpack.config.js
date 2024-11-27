const webpack = require("@nativescript/webpack");
const dotenv = require("dotenv-webpack");

module.exports = (env) => {
  webpack.init(env);

  webpack.chainWebpack((config) => {
    config.plugin("dotenv").use(dotenv, [{ path: "./.env" }]);
  });

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  return webpack.resolveConfig();
};
