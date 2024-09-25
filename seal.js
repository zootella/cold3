
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

import glob from 'fast-glob'

import { wrapper } from './wrapper.js'//load the previous one to repeat the name
import { log, look, newline, Data, Now } from './library/library0.js'

/*
     _          _       _                              
 ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __  
/ __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \ 
\__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) |
|___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/ 
                                                |_|    

$ npm run seal
$ git commit
$ npm run deploy




todo, rename
the whole thing is the shrinkwrap system
seal is the verb, $ node seal, same length as test
wrapper is what gets overwritten for each seal
sticker is the information on the sticker on the wrapper seal

./seal.js
./wrapper.txt
./wrapper.js
./library/sticker.js

so then seal is the verb
wrapper is the outside wrapper which gets generated each time
and sticker is the information on and about the wrapper

and then capitilize the function so you can do
let sticker = Sticker()












*/
async function seal() {

	let list = await listFiles()
	let properties = await hashFiles(list)
	let manifest = await composeManifest(properties)
	await affixSeal(properties, manifest)
}
seal()

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
			'wrapper.txt',
			'wrapper.js'
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

	//compose the contents of the manifest file, wrapper.txt, a listing of hashes, paths, and sizes
	const lines = properties.map(p => `${p.hash.base32()} ${p.path}:${p.size}`)//put size after : because it can't be part of a filename on windows or mac
	const manifest = lines.join(newline)+newline
	await fs.writeFile('wrapper.txt', manifest)//write the file to disk
	return manifest//also return the file contents as we'll hash them next
}

async function affixSeal(properties, manifest) {

	//total up the files, counting those that are something we wrote or created, versus everything
	let codeFiles = 0, codeSize = 0, totalFiles = 0, totalSize = 0
	for (let f of properties) {
		totalFiles++; totalSize += f.size
		if (!f.path.endsWith('package-lock.json') && !f.path.endsWith('.gif') && !f.path.endsWith('.png')) { codeFiles++; codeSize += f.size }
	}

	//compute the shrinkwrap hash of this version snapshot right now, which is the hash of wrapper.txt
	let hash = Data({array: crypto.createHash('sha256').update(manifest).digest()})

	//compose contents for the new wrapper.js
	const tab = '\t'
	let sheet = (
		`export const wrapper = {`      +newline
		+tab+`name: '${wrapper.name}',` +newline
		+tab+`tick: ${Now()},`                 +newline
		+tab+`hash: '${hash.base32()}',`       +newline
		+tab+`codeFiles: ${codeFiles},`        +newline
		+tab+`codeSize: ${codeSize},`          +newline
		+tab+`totalFiles: ${totalFiles},`      +newline
		+tab+`totalSize: ${totalSize}`         +newline
		+`}`                                   +newline
	)

	//overwrite wrapper.js, which the rest of the code imports to show the version information like name, date, and hash
	await fs.writeFile('wrapper.js', sheet)

	//output a summary to the shrinkwrapper
	log('',
		`${codeFiles} files and ${codeSize} bytes code; your 3.5" floppy disk is filled ${Math.round(codeSize*100/1474560)}%`,
		`${totalFiles} files and ${totalSize} bytes total`,
		'',
		`${hash.base32()} shrinkwrap hash`)
}



/*


yeah, right in here actually compose
	name: 'cold3',
	tick: 1727070618821,
	hash: 'VQFO2KNLUTPQ5TPAXUX4DPDB5H4XX2NQLPOSIUUEGBHCQH6XLPLA',
into sticker: like 'cold3.2024sep23.VQFO2KN'
also  have when: '2024sep23' in case you just want that

function formatDateUTC(t) {
	let date = new Date(t)
	let year = date.getUTCFullYear()
	let month = date.toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toLowerCase()
	let day = String(date.getUTCDate()).padStart(2, '0')
	return year+month+day
}




*/

/*
notes, ttd

$ npm run seal
seal.js, this file runs, generating
wrapper.txt, this file of hashes, paths, and sizes, which gets hashed to
wrapper.js, which contains the date and hash that seals the package
code in the app includes sticker.js to show version numbers



library0 includes sticker.js, which gets it in code everywhere else
and library0 has a function which formats the sticker into text like

library0 has function shrinkwrapVersion which turns name, tick, hash into text for the user like
"cold3.2024sep5.OJW3O2W"
put this on an /about page, for instance


this is also where you can show how much of this disk has filled:

   84,837 bytes is library0, just for context
  468,982 bytes total code (avoided package-lock.json, gif, png) so you're nearly a third full already!
1,474,560 bytes floppy disk


A 3.5" floppy disk is 31% full

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



