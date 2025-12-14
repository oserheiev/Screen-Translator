const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.tsx',
    capture: './src/capture/capture.ts'
  },
  target: 'electron-renderer',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: 'src/tsconfig.json',
            transpileOnly: true
          }
        }],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      path: false,
      fs: false
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunks: ['main']
    }),
    new HtmlWebpackPlugin({
      filename: 'capture.html',
      template: './src/capture.html',
      chunks: ['capture']
    }),
    // Define process.env for the renderer process
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    // Provide a global process object
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
};