const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const package = require('./package.json');
const webpack = require('webpack');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

var now = new Date();
function to2Digits(n) {
  return ("0" + n).slice(-2);
}
var buildDate = now.getUTCDate() + "/" +
          (now.getUTCMonth() + 1).toString() +
          "/" + now.getUTCFullYear().toString();
var buildTimestamp =  to2Digits(now.getUTCHours()) +
          ":" + to2Digits(now.getUTCMinutes()) + ":" + to2Digits(now.getUTCSeconds());

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var ENV = process.env.npm_lifecycle_event;
var isProd = (ENV === 'build' || ENV === 'deploy');

module.exports = function makeWebpackConfig() {
  var config = {};

  config.resolve = {
    modules: [path.resolve(__dirname, "src/js"), "node_modules"]
  };

  config.entry = ['@babel/polyfill', "./src/js/index.js"];

  config.output = {
    path: path.resolve(__dirname, "www"),
    publicPath: "",
    filename: "[name].js"
  };

  if (!isProd) {
  //   config.devtool = 'source-map';
  // } else {
    config.devtool = 'inline-source-map'
  }

  config.devServer = {
    contentBase: "./www",
    historyApiFallback: true
  };

  config.module = {
    rules: [
      {
        test: /\.css$/,
        use: [
          // inject CSS to page
          { loader: 'style-loader' },

          // translates CSS into CommonJS modules
          { loader: 'css-loader' },

          // Run post css actions
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () { // post css plugins, can be exported to postcss.config.js
                return [
                  require('precss'),
                  require('autoprefixer')
                ];
              }
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          // inject CSS to page
          { loader: 'style-loader' },

          // translates CSS into CommonJS modules
          { loader: 'css-loader' },

          // Run post css actions
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () { // post css plugins, can be exported to postcss.config.js
                return [
                  require('precss'),
                  require('autoprefixer')
                ];
              }
            }
          },
          // compiles Sass to CSS
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      }
    ]
  };

  config.plugins = [];
  if (isProd) {
    config.plugins = [
      new DuplicatePackageCheckerPlugin(),
      // new webpack.optimize.UglifyJsPlugin()
    ];
  }

  config.plugins.push(
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
  }));

  config.plugins.push(
    new CopyWebpackPlugin([{
      from: './static', to: './'
  }]));

  config.plugins.push(
    new webpack.DefinePlugin({
      'APP_VERSION_NUMBER': JSON.stringify(package.version),
      'BUILD_DATE': JSON.stringify(buildDate),
      'BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
    }));

  return config;
}();
