
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

import glob from 'fast-glob'

import { shrinkwrapSeal } from './seal.js'//load the previous one to repeat the name
import { log, look, newline, Data, Now } from './library/library0.js'

/*
     _          _       _                              
 ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __  
/ __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \ 
\__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) |
|___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/ 
                                                |_|    

$ node shrinkwrap
$ git commit
$ npm run deploy


*/
async function shrinkwrap() {

	let list = await listFiles()
	let properties = await hashFiles(list)
	let manifest = await composeManifest(properties)
	await affixSeal(properties, manifest)
}
shrinkwrap()

async function listFiles() {

	//list all the files that are a part of this project in its current form; configuration, code, and notes
	const paths = await glob('**/*', {
		dot: true,//include unix-style hidden files like .hidden
		ignore: [//ignore these paths, notice we're including some things, like .env, that git ignores
			'**/.DS_Store',//apple nonsense from the 1990s
			'**/.git',
			'**/.nuxt',
			'**/.wrangler',
			'**/.serverless',
			'**/*.log',
			'**/*.diff',
			'**/dist',
			'**/node_modules',

			//also leave out the two that this script generates; less blockchain-ey, but possible to return to the hash before a change. these absolutely get checked into git, though!
			'shrinkwrap.txt',
			'seal.js'
		]
	})
	return paths.sort()//alphebetize, unfortunately does not keep folders grouped together like they look in File Manager
}

async function hashFiles(paths) {

	//given the array of paths, make an array of properties with each file sized and hashed
	const properties = []
	for (const path of paths) {
		const contents = await fs.readFile(path)
		const size = contents.length
		let hash = Data({array: crypto.createHash('sha256').update(contents).digest()})
		properties.push({path, size, hash})
	}
	return properties
}

async function composeManifest(properties) {

	//compose the contents of the manifest file, shrinkwrap.txt, a listing of hashes, paths, and sizes
	const lines = properties.map(p => `${p.hash.base32()} ${p.path}:${p.size}`)//put size after : because it can't be part of a filename on windows or mac
	const manifest = lines.join(newline)+newline
	await fs.writeFile('shrinkwrap.txt', manifest)//write the file to disk
	return manifest//also return the file contents as we'll hash them next
}

async function affixSeal(properties, manifest) {

	//total up the files, counting those that are something we wrote or created, versus everything
	let codeFiles = 0, codeSize = 0, totalFiles = 0, totalSize = 0
	for (let f of properties) {
		totalFiles++; totalSize += f.size
		if (!f.path.endsWith('package-lock.json') && !f.path.endsWith('.gif') && !f.path.endsWith('.png')) { codeFiles++; codeSize += f.size }
	}

	//compute the shrinkwrap hash of this version snapshot right now, which is the hash of shrinkwrap.txt
	let hash = Data({array: crypto.createHash('sha256').update(manifest).digest()})

	//compose contents for the new seal.js
	const tab = '\t'
	let seal = (
		`export const shrinkwrapSeal = {`      +newline
		+tab+`name: '${shrinkwrapSeal.name}',` +newline
		+tab+`tick: ${Now()},`                 +newline
		+tab+`hash: '${hash.base32()}',`       +newline
		+tab+`codeFiles: ${codeFiles},`        +newline
		+tab+`codeSize: ${codeSize},`          +newline
		+tab+`totalFiles: ${totalFiles},`      +newline
		+tab+`totalSize: ${totalSize}`         +newline
		+`}`                                   +newline
	)

	//overwrite seal.js, which the rest of the code imports to show the version information like name, date, and hash
	await fs.writeFile('seal.js', seal)

	//output a summary to the shrinkwrapper
	log('',
		`${codeFiles} files and ${codeSize} bytes code`,
		`${totalFiles} files and ${totalSize} bytes total`,
		'',
		`${hash.base32()} shrinkwrap hash`)
}



/*
notes, ttd

$ node shrinkwrap
shrinkwrap.js, this file runs, generating
shrinkwrap.txt, this file of hashes, paths, and sizes, which gets hashed to
seal.js, which contains the date and hash that seals the package
code in the app includes seal.js to show version numbers



library0 includes seal.js, which gets it in code everywhere else
and library0 has a function which formats the seal into text like

library0 has function shrinkwrapVersion which turns name, tick, hash into text for the user like
"cold3.2024sep5.OJW3O2W"
put this on an /about page, for instance


this is also where you can show how much of this disk has filled:

   84,837 bytes is library0, just for context
  468,982 bytes total code (avoided package-lock.json, gif, png) so you're nearly a third full already!
1,474,560 bytes floppy disk

 ____________________
| |cold3           | |
|.|________________|H|
| |________________| |
| |________________| |
| |________________| |
| |________________| |
| |________________| |
|                    |
|    ____________    |
|   |   |  _     |   |
|   |   | | |    |   |
|   |   | |_|    | V |
|___|___|________|___|


 ____________________
| |cold3           | |
|.|XXXXXXXXXXXXXXXX|H|
| |XXXXXXXXXXXXXXXX| |
| |XXXXXXXXXXXX____| |
| |________________| |
| |________________| |
| |________________| |
|                    |
|    ____________    |
|   |   |  _     |   |
|   |   | | |    |   |
|   |   | |_|    | V |
|___|___|________|___|



something like that maybe


*/



