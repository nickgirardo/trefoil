const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: './src/app.js',
  mode: 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: path.resolve(__dirname, './build'),
  },
  module: {
    rules: [
      {
        test: /\.frag$/,
        loader: 'raw-loader',
      },
      {
        test: /\.vert$/,
        loader: 'raw-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader"
        ]
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
}
