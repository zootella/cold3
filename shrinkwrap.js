






import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

import glob from 'fast-glob'

import { log, look, newline } from './library/library0.js'


async function listFiles() {
	// Use fast-glob to generate the list of files, ignoring what .gitignore says
	const list = await glob('**/*', {
		dot: true,//include hidden files
		ignore: [//ignore these paths, notice we're including some things like .env that git ignores
			'.git',
			'.nuxt',
			'.wrangler',
			'net23/.serverless',
			'*.log',
			'*.diff',
			'**/dist',
			'**/node_modules',
			'**/.DS_Store'
		]
	})
	
	return list.sort()
}

async function hashFiles(list) {
	const list2 = []

	for (const path of list) {
		try {
			// Read the file contents
			const fileData = await fs.readFile(path)

			// Get file size
			const fileSize = fileData.length

			// Calculate SHA-256 hash as a Uint8Array
			const hash = new Uint8Array(
				crypto.createHash('sha256').update(fileData).digest()
			)

			// Push the result as an object into the array
			list2.push({
				path: path,
				size: fileSize,
				hash: hash
			})
		} catch (error) {
			console.error(`Error processing file ${path}:`, error)
		}
	}

	return list2
}










async function writeFileListing(fileList) {
	// Format each file with the placeholder hash and a placeholder file size (e.g., 0)
	const fileLines = fileList.map(filePath => `${filePath}`);
	
	// Join the lines with a newline to write them into the file
	const fileContent = fileLines.join(newline)+newline

	// Write to shrinkwrap.txt in the project root
	const outputPath = path.join(process.cwd(), 'shrinkwrap.txt');
	try {
		await fs.writeFile(outputPath, fileContent, 'utf8');
		console.log('File listing written to shrinkwrap.txt');
	} catch (err) {
		console.error('Error writing file listing:', err);
	}
}



async function shrinkwrap() {

	log('hi in shrinkwrap')
	let list = await listFiles()

	await writeFileListing(list)

	let list2 = await hashFiles(list)
	log(look(list2))
}
shrinkwrap()

















/*

here's some serious bike shed. one hour, max. be careful

$ node shrinkwrap.js
run this file separately, it generates
shrinkwrap.txt, and from this and that
seal.js

library0 includes seal.js, which gets it in code everywhere else
and library0 has a function which formats the seal into text like



library0 has function shrinkwrapVersion which turns name, tick, hash into text for the user like
"cold3.2024sep5.OJW3O2W"
put this on an /about page, for instance








can you get this to use .gitignore
or just your own ignore here






*/


const name = 'cold3'//can you get this from package.json, actually?





/*
$ node shrinkwrap
shrinkwrap.js, root, not part of project or hashing
shrinkwrap.txt, generated manifest, not hashed
library/seal.js, generated, not 
*/




/*
shrinkwrap.txt gets overwritten every time
and looks like this:

OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA folder/file.ext:52
OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA folder/file2.ext:5
OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA folder/subfolder/file.ext:45789
OJW3O2W4BCQTNLXSZPFMOTMVRSAXI354UD4HIHNQC6U35ZW3QZBA folder/subfolder/file2.ext:0

designed to work on windows and mac
newlines are \r\n
no excaping, colon is not allowed for windows or mac paths, so :size works fine

check that it works with size 0, that you get the sha256 hash value of nothing


oh also here's where you total up the size and confirm it's still within a floppy disk


*/




