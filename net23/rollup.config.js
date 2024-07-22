
const inputFolder = 'src' // Meaning source, where we've been coding
const outputFolder = 'dist' // Meaning distribution, what gets uploaded to Amazon

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
		dir: outputFolder, // Output folder name
		format: 'esm', // Output format as ES modules, use import not require
		inlineDynamicImports: true, // Build each function into a single file
	},
	external: ['aws-sdk'], // Don't include the AWS SDK in the bundle, it's already up there
	plugins: [ // Run these plugins in this order
		pluginNodeResolve(), // First, resolve modules in node_modules so remaining plugins can correctly identify and transform them
		pluginCommonJs(), // Next, convert CommonJS modules to ES6 modules
		pluginJson(), // Then, handle JSON file imports which are used by many of the resolved modules
		pluginTerser() // Last, now that all transformations are applied, minify the final bundle output
	]
}))

export default defineConfig(configuration)
