const webpack = require('webpack');
const path = require('path');
const srcDir = '../src/';
const CreateFileWebpack = require('create-file-webpack');

// vue.config.js
const ArbitraryCodeAfterReload = function (cb) {
	this.apply = function (compiler) {
		if (compiler.hooks && compiler.hooks.done) {
			console.log('23423342');
			compiler.hooks.done.tap('webpack-arbitrary-code', cb);
		}
	};
};

const myCallback = function () {
	console.log('Implementing alien intelligence');
};

module.exports = {
	entry: {
		background: path.join(__dirname, srcDir + 'background.ts'),
		content: path.join(__dirname, srcDir + 'content.ts'),
	},
	output: {
		path: path.join(__dirname, '../dist'),
		filename: '[name].js',
		sourceMapFilename: '[name].js.map',
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				default: false,
			},
		},
		runtimeChunk: false,
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	plugins: [
		new CreateFileWebpack({
			// path to folder in which the file will be created
			path: './',
			// file name
			fileName: 'reload',
			// content of the file
			content: '',
		}),
	],
};
