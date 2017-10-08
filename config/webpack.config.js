const path = require('path');
const webpack = require('webpack');
const pkg = require('../package.json');

const LIBRARY_NAME = 'flamelink';

module.exports = {
  devtool: 'source-map',

  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: `${LIBRARY_NAME}.js`,
    library: LIBRARY_NAME,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  externals: {
    firebase: {
      commonjs: 'firebase',
      commonjs2: 'firebase',
      amd: 'firebase',
      root: 'firebase'
    }
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      __PACKAGE_VERSION__: JSON.stringify(pkg.version)
    })
  ]
};
