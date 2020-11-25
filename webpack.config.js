var path = require('path');
var webpack = require('webpack');
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
var UglifyJsPlugin = require("uglifyjs-webpack-plugin");
var VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = function(env){
	let is_production,
		dirname = __dirname,
		root = path.resolve(dirname+'/src'),
		root_public = path.resolve(dirname+'/build');



	return {
		mode: is_production ? 'production' : 'development',
		entry: [
			root+'/main.js'
		],
		output: {
			path: root_public,
			publicPath: './',
			filename: 'bundle' + (is_production ? '.min' : '') + '.js',
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
					if(is_production)
						e.push('postcss-loader');
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
				filename: 'bundle' + (is_production ? '.min' : '') + '.css'
			})
		],
		resolve: {
			alias: {
				'@': root
			},
			extensions: ['*', '.js', '.json','.vue']
		},
		watch: !is_production,
		performance: {
			hints: false
		},
		optimization: {
			minimizer: ((m=[])=>{
				if(is_production)
				{
					m.push(new OptimizeCSSAssetsPlugin({}));
					m.push(new UglifyJsPlugin({
						cache: true,
						parallel: true,
						sourceMap: false
					}));
				}
				return m;
			})()
		},
		devtool: 'cheap-source-map',
		target: 'electron-preload'
	};
};