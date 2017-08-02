const path = require('path');

module.exports = {
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'flamelink.js',
    library: 'flamelink',
    libraryTarget: 'umd'
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
  }
};
