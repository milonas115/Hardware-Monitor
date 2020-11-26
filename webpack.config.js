var path = require('path');
var webpack = require('webpack');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = function(watcher){
	let dirname = __dirname,
		root = path.resolve(dirname+'/src'),
		root_public = path.resolve(dirname+'/build');
	watcher = watcher || {};
	return {
		mode: 'development',
		entry: [
			root+'/main.js'
		],
		output: {
			path: root_public,
			publicPath: './',
			filename: 'bundle.js',
			pathinfo: false
		},
		stats: {
			colors: true,
			modules: true,
			reasons: true,
			errorDetails: true
		},
		module: {
			rules: [{
				test: /\.scss$|\.css$|\.styl$/,
				use: ((e=[])=>{
					e.push(MiniCssExtractPlugin.loader,'css-loader');
					e.push('sass-loader');
					return e;
				})()
			},{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					loaders: {},
					hot: false,
					optimizeSSR: false
				}
			},{
				test: /\.js$/,
				loader: 'babel-loader'
			},{
				test: /\.(png|jpg|gif|svg|ttf|woff2|woff|eot)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]?[hash]'
				}
			}]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env': {
					
				}
			}),
			new VueLoaderPlugin(),
			new MiniCssExtractPlugin({
				filename: 'bundle.css'
			})
		],
		resolve: {
			alias: {
				'@': root
			},
			extensions: ['*', '.js', '.json','.vue']
		},
		watch: !!watcher.watch,
		performance: {
			hints: false
		},
		optimization: {

		},
		devtool: 'cheap-source-map',
		target: 'electron-preload'
	};
};