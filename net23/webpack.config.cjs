
const path = require('path') // Yes, this is Node-style with .cjs extension, require, module.exports, and __dirname, because serverless-webpack seems to require it that way

module.exports = {
	entry: {
		hello1: './src/handlers/hello1.js',
		hello2: './src/handlers/hello2.js'
	},
	target: 'node20',
	mode: 'production',
	output: {
		libraryTarget: 'commonjs2', // Output to CommonJS format (not ES6) is correct for target Node environment
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.js$/, // Apply this rule to all .js files
				exclude: /node_modules/, // Don't transpile files in the node_modules directory, they're already ready
				use: {
					loader: 'babel-loader', // Use Babel to transpile the files
					options: {
						presets: [ // Specify these Babel presets to use
							['@babel/preset-env', {
								targets: {
									node: '20'
								},
								modules: false, // Don't transform to modules, Node 20 already supports them; this lets Webpack do tree shaking
							}]
						],
					},
				},
			},
		],
	},
	externals: {
		'aws-sdk': 'commonjs2 aws-sdk', // The AWS SDK is available in the Lambda runtime, so exclude it from the bundle, and treat it as an external dependency in CommonJS2 (not ES6) format
	},
	optimization: {
		minimize: true, // Have Terser remove whitespace, comments, and newline characters, and shorten variable names; off by default
	}
}
