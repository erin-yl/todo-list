const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"), // Output directory
    clean: true, // Clean the dist folder before each build
  },
  devtool: "inline-source-map",
  devServer: {
    static: "./dist", // Serve content from the dist directory
    open: true, // Automatically open the browser
    hot: true, // Enable Hot Module Replacement
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Apply this rule to .js files
        exclude: /node_modules/, // Don't transpile node_modules
        use: {
          loader: "babel-loader", // Use Babel to transpile JavaScript
          options: {
            presets: ["@babel/preset-env"], // Use modern JavaScript features
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html", // Use your existing HTML file as a template
      filename: "index.html", // Output filename in dist
      inject: "body", // Inject the script tag at the end of the body
    }),
  ],
};
