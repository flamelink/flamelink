const path = require('path');
const webpack = require('webpack');
const pkg = require('../package.json');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const LIBRARY_NAME = 'flamelink';

module.exports = {
  devtool: 'cheap-module-source-map',

  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: `${LIBRARY_NAME}.js`,
    library: LIBRARY_NAME,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  mode: process.env.NODE_ENV || 'production',

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        uglifyOptions: {
          compress: {
            sequences: true, // join consecutive statements with the “comma operator”
            properties: true, // optimize property access: a["foo"] → a.foo
            dead_code: true, // discard unreachable code
            drop_debugger: true, // discard “debugger” statements
            unsafe: false, // some unsafe optimizations (see below)
            conditionals: true, // optimize if-s and conditional expressions
            comparisons: true, // optimize comparisons
            evaluate: true, // evaluate constant expressions
            booleans: true, // optimize boolean expressions
            loops: true, // optimize loops
            unused: true, // drop unused variables/functions
            hoist_funs: true, // hoist function declarations
            hoist_vars: false, // hoist variable declarations
            if_return: true, // optimize if-s followed by return/continue
            join_vars: true, // join var declarations
            side_effects: true, // drop side-effect-free statements
            warnings: false // warn about potentially dangerous optimizations/code
          },
          output: {
            comments: false,
            beautify: false
          },
          keep_fnames: false,
          ie8: false
        }
      })
    ]
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
    }),
    new CopyWebpackPlugin(
      [
        {
          from: path.resolve(__dirname, '..', 'src', 'index.d.ts'),
          to: path.resolve(__dirname, '..', 'dist')
        }
      ],
      {
        debug: 'warning'
      }
    ),
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.js$/
    })
  ]
};
