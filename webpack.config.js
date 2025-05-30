const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    entry: "./src/index.js",
    output: {
      filename: "[name].[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    devtool: isProd ? "source-map" : "inline-source-map",
    devServer: {
      static: "./dist",
      open: true,
      hot: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        inject: "body",
      }),
      ...(isProd
        ? [
          new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css",
          }),
        ]
        : []),
    ],
    optimization: {
      splitChunks: {
        chunks: "all",
      },
      runtimeChunk: "single",
    },
  };
};