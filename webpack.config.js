const path = require('path')

module.exports = {
  mode: 'development',
  entry: './src/app.young',
  module: {
    rules: [{
      test: /\.young$/,
      exclude: /node_modules/,
      use: [
        {
          loader: path.resolve(__dirname, 'src/loader.js'),
        }
      ]
    }]
  },
  watch: true
}