
const inputFolder = 'src'
const outputFolder = 'dist'

import fs from 'fs'
import path from 'path'

import { defineConfig } from 'rollup' // Use Rollup, with the following plugins:
import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import nodeResolve from '@rollup/plugin-node-resolve' // Resolve Node.js modules
import terser from '@rollup/plugin-terser' // Minify the output using Terser

// List all .js files in the input directory
const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.js'))

// Make Rollup configuration settings that are the same for each file
const configuration = files.map(file => ({
	input: path.join(inputFolder, file), // Input file path
	output: {
		file: path.join(outputFolder, file), // Output file path
		format: 'esm', // Output format as ES modules, use import not require
	},
	external: ['aws-sdk'], // Don't include the AWS SDK in the bundle, it's already up there
	plugins: [
		nodeResolve(), // Resolve Node.js modules
		commonjs(), // Convert CommonJS modules to ES6
		terser() // Minify the output
	]
}))

export default defineConfig(configuration)


/*
notes

serverless
1 million
8 days ago

serverless-offline
536k
2 months ago

rollup
22 million
10 days ago

@rollup/plugin-commonjs
3 million
1 month ago

@rollup/plugin-node-resolve
6 million
9 months ago

@rollup/plugin-terser
1 million
9 months ago

rollup-plugin-node-polyfills
776k
5 years ago, so in use, but not current; but seemingly no intended replacement yet




*/








