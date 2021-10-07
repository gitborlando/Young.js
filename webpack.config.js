const path = require('path')

module.exports = {
  entry: './src/young.js',
  mode: 'production',
  output: {
    library: 'Young',
    libraryTarget: 'umd',
    libraryExport: 'default',
    path: path.join(__dirname, '/dist/'),
    filename: 'index.js'
  },
  watch: true
}