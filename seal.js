
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import glob from 'fast-glob'

import { wrapper as prevousWrapper } from './wrapper.js'//load the previous one to repeat the name--but then, where did the name come from?!
import {
log, look, newline, Data, Now
} from './library/grand.js'

//      _          _       _                                               _ 
//  ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __    ___  ___  __ _| |
// / __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \  / __|/ _ \/ _` | |
// \__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) | \__ \  __/ (_| | |
// |___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/  |___/\___|\__,_|_|
//                                                 |_|                       

/*
	./seal.js             $ npm run seal to generate the next two files:
	./wrapper.txt         first, a file manifest
	./wrapper.js          from that, hash and date of the manifest, versioning the code
	./library/sticker.js  sticker.js imports wrapper.js, adding environment detection, a tick and tag, and friendly text
*/
async function seal() {
	let list = await listFiles()
	let properties = await hashFiles(list)
	let manifest = await composeWrapper(properties)
	await affixSeal(properties, manifest)
}
seal()

async function listFiles() {

	//list all the files that are a part of this project in its current form; configuration, code, and notes
	const paths = await glob('**/*', {
		dot: true,//include unix-style hidden files like .hidden
		ignore: [//ignore these paths, notice we're intentionally including some things, like .env, that git ignores
			'**/.DS_Store',//ignore this bothersome apple computer nonsense from the 1990s
			'**/.git',
			'**/.nuxt',
			'**/.wrangler',
			'**/.serverless',
			'**/*.log',
			'**/*.diff',
			'**/diff*.txt',
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

async function composeWrapper(properties) {

	//compose the contents of wrapper.txt, a listing of hashes, paths, and sizes
	const lines = properties.map(p => `${p.hash.base32()} ${p.path}:${p.size}`)//put size after : because it can't be part of a filename on windows or mac
	const wrapper = lines.join(newline)+newline
	await fs.writeFile('wrapper.txt', wrapper)//write the file to disk
	return wrapper//also return the file contents as we'll hash them next
}

export const floppyDiskCapacity = 1474560//1.44 MB capacity of a 3.5" floppy disk
async function affixSeal(properties, wrapper) {

	//total up the files, counting those that are something we wrote or created, versus everything
	let codeFiles = 0, codeSize = 0, totalFiles = 0, totalSize = 0
	for (let f of properties) {
		totalFiles++; totalSize += f.size
		if (!f.path.endsWith('package-lock.json') && !f.path.endsWith('.gif') && !f.path.endsWith('.png')) { codeFiles++; codeSize += f.size }
	}

	//compute the shrinkwrap hash of this version snapshot right now, which is the hash of wrapper.txt
	let hash = Data({array: crypto.createHash('sha256').update(wrapper).digest()})

	//compose contents for the new wrapper.js
	const tab = '\t'
	let s = (
		`export const wrapper = {`             +newline
		+tab+`name: '${prevousWrapper.name}',` +newline//but then, where did the name come from originally??!!1?!
		+tab+`tick: ${Now()},`                 +newline
		+tab+`hash: '${hash.base32()}',`       +newline
		+tab+`codeFiles: ${codeFiles},`        +newline
		+tab+`codeSize: ${codeSize},`          +newline
		+tab+`totalFiles: ${totalFiles},`      +newline
		+tab+`totalSize: ${totalSize}`         +newline
		+`}`                                   +newline
	)

	//overwrite wrapper.js, which the rest of the code imports to show the version information like name, date, and hash
	await fs.writeFile('wrapper.js', s)

	//output a summary to the shrinkwrapper
	let codeSizeDiskPercent = Math.round(codeSize*100/floppyDiskCapacity)
	log('',
		`${codeFiles} files and ${codeSize} bytes code; your 3.5" floppy disk is filled ${codeSizeDiskPercent}%`,
		`${totalFiles} files and ${totalSize} bytes total`,
		'',
		`${hash.base32()} shrinkwrap hash`)
}
