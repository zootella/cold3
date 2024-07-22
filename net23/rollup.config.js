
const inputFolder = 'src'
const outputFolder = 'dist'

import fs from 'fs'
import path from 'path'

import { defineConfig } from 'rollup' // Use Rollup, with the following plugins:
import pluginNodeResolve from '@rollup/plugin-node-resolve' // Resolve Node.js modules
import pluginCommonJs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import pluginJson from '@rollup/plugin-json' // Convert .json files to ES6 modules
import pluginTerser from '@rollup/plugin-terser' // Minify the output using Terser

// List all .js files in the input directory
const files = fs.readdirSync(inputFolder).filter(file => file.endsWith('.js'))

// Make Rollup configuration settings that are the same for each file
const configuration = files.map(file => ({
	input: path.join(inputFolder, file), // Input file path
	output: {
		dir: outputFolder, // Output directory path
		format: 'esm', // Output format as ES modules, use import not require
		inlineDynamicImports: true, // Build each function into a single file
	},
	external: ['aws-sdk'], // Don't include the AWS SDK in the bundle, it's already up there
	plugins: [
		pluginNodeResolve(), // Resolve Node.js modules
		pluginCommonJs(), // Convert CommonJS modules to ES6
		pluginJson(), // Deal with package.json files in imports and their imports
		pluginTerser() // Minify the output
	]
}))

export default defineConfig(configuration)
