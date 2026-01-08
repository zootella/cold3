
import {
wrapper, sayFloppyDisk, runTests, Time,
log, look, newline, Data, Now, Tag,
parseKeyFile, randomBetween, encryptData, cutAfterLast,
} from 'icarus'

import {promises as fs} from 'fs'
import path from 'path'
import crypto from 'crypto'
import glob from 'fast-glob'
import dotenv from 'dotenv'; dotenv.config()//put .env properties on process.env

//      _          _       _                                               _ 
//  ___| |__  _ __(_)_ __ | | ____      ___ __ __ _ _ __    ___  ___  __ _| |
// / __| '_ \| '__| | '_ \| |/ /\ \ /\ / / '__/ _` | '_ \  / __|/ _ \/ _` | |
// \__ \ | | | |  | | | | |   <  \ V  V /| | | (_| | |_) | \__ \  __/ (_| | |
// |___/_| |_|_|  |_|_| |_|_|\_\  \_/\_/ |_|  \__,_| .__/  |___/\___|\__,_|_|
//                                                 |_|                       

/*
	a summary of how this script encrypts secrets and generates the shrinkwrap seal wrapper

	./.env.keys           add and edit application defined public keys and sensitive server secrets in one place

	./.env                store secret symmetric encryption key here for node
	./.dev.vars           and also here for cloudflare wrangler to make available to nitro in nuxt
	./net23/.env          and also here for serverless framework to use locally and deploy to lambda
												and also set it in the cloudflare dashboard
												icarus using vite is front-end and correctly can't reach it

	./seal.js             $ npm run seal to generate the next two files:
	./wrapper.txt         first, a file manifest
	./icarus/wrapper.js   from that, hash and date of the manifest, versioning the code
												and including the contents of .env.keys with secrets encrypted with the server symmetric key
	./icarus/level0.js    level0.js imports wrapper.js, adding environment detection, a tick and tag
*/
const pathWrapperTxt = 'wrapper.txt'
const pathWrapperJs  = 'icarus/wrapper.js'
async function seal() {
	let list = await listFiles()
	let properties = await hashFiles(list)
	let manifest = await composeWrapper(properties)
	await affixSeal(properties, manifest)
}

async function listFiles() {

	//list all the files that are a part of this project in its current form; configuration, code, and notes
	let paths = await glob('**/*', {
		dot: true,//include unix-style hidden files like .hidden
		ignore: [//ignore these paths, notice we're intentionally including some things, like .env, that git ignores
			'**/.DS_Store',//ignore this bothersome apple computer nonsense from the 1990s
			'**/.git',
			'**/.nuxt',
			'**/.output',
			'**/.serverless',
			'**/.svelte-kit',
			'**/.wrangler',
			'**/*.log',
			'**/*.diff',
			'**/*.zip',//net23/build may exist with net23.zip and net23previous.zip
			'**/diff*.txt',
			'**/dist',
			'**/.vite-inspect',//git ignores site/size, but wrapper lists site/size/client.html and the other two in there
			'**/node_modules',
			'**/worker-configuration.d.ts',

			//also leave out the two that this script generates; less blockchain-ey, but possible to return to the hash before a change. these absolutely get checked into git, though!
			pathWrapperTxt,
			pathWrapperJs
		]
	})
	return paths.sort()//alphebetize, unfortunately does not keep folders grouped together like they look in File Manager
}

async function hashFiles(paths) {

	//given the array of paths, make an array of properties with each file sized and hashed
	let properties = []
	for (let path of paths) {
		let contents = await fs.readFile(path)
		let size = contents.length
		let hash = Data({array: crypto.createHash('sha256').update(contents).digest()})
		properties.push({path, size, hash})
	}
	return properties
}

async function composeWrapper(properties) {

	//compose the contents of wrapper.txt, a listing of hashes, paths, and sizes
	let lines = properties.map(p => `${p.hash.base32()} ${p.path}:${p.size}`)//put size after : because it can't be part of a filename on windows or mac
	let manifest = lines.join(newline)+newline
	await fs.writeFile(pathWrapperTxt, manifest)//write the file to disk
	return manifest//also return the file contents as we'll hash them next
}

async function writeWrapper(o) {

	//write the given object to the file wrapper.js in icarus, ready for running JavaScript code to import
	let s = `export const wrapper = Object.freeze(${JSON.stringify(o, null, 2)})`
	s = s.replace(/\n/g, newline)+newline//switch newlines to \r\n to work well on both mac and windows
	await fs.writeFile(pathWrapperJs, s)
}

const envKeysFileName = '.env.keys'
async function affixSeal(properties, manifest) {

	//total up the files, counting those that are something we wrote or created, versus everything
	let codeFiles = 0, codeSize = 0, totalFiles = 0, totalSize = 0
	for (let f of properties) {
		totalFiles++; totalSize += f.size
		if (
			!f.path.endsWith('package-lock.json') &&//lockfiles
			!f.path.endsWith('yarn.lock') &&
			!f.path.endsWith('.gif') &&//images
			!f.path.endsWith('.jpg') &&
			!f.path.endsWith('.png') &&
			!f.path.endsWith('.woff2') &&//fonts
			!f.path.includes('site/size/')) {//rollup visualizer reports
			codeFiles++; codeSize += f.size
		}
	}

	//compute the shrinkwrap hash of this version snapshot right now, which is the hash of wrapper.txt
	let hash = Data({array: crypto.createHash('sha256').update(manifest).digest()})

	//encrypt the secrets in .env.keys
	let envKeysContents = await fs.readFile(envKeysFileName, 'utf8')
	let blocks = parseKeyFile(envKeysContents)
	let cipherData = await encryptData(
		Data({base62: cutAfterLast(process.env.ACCESS_K10_SECRET, '_')}),//key data is beyond tracer prefix
		Data({text: blocks.secretBlock})
	)//encrypt the secret keys; server code will be able to decryypt them
	let publicData = Data({text: blocks.publicBlock})//encode the public keys; client and server code will use them

	//compose contents for the new wrapper.js
	let o = {...wrapper}//copy all the properties into a new object
	o.tick = Now()//update individual properties in the new object
	o.local = ((new Date()).getTimezoneOffset()) * Time.minute
	o.cloud = wrapper.cloud
	o.hash = hash.base32()
	o.codeFiles = codeFiles
	o.codeSize = codeSize
	o.totalFiles = totalFiles
	o.totalSize = totalSize
	o.secretKeys = 'FujiTracer'+'S10_'+cipherData.base62()//put new system in place, haven't moved any actual secrets over yet
	o.publicKeys = 'FujiTracer'+'P10_'+publicData.base62()//new system for intentionally, acceptably, and necessarily public factory presets and client side bundle keys

	//overwrite wrapper.js, which the rest of the code imports to show the version information like name, date, and hash
	await writeWrapper(o)
}

//                       _    
//  _ __ ___   __ _ _ __| | __
// | '_ ` _ \ / _` | '__| |/ /
// | | | | | | (_| | |  |   < 
// |_| |_| |_|\__,_|_|  |_|\_\
//                            

async function mark(setCloud) {
	let o = {...wrapper}
	o.cloud = setCloud
	await writeWrapper(o)
}

//                  _       
//  _ __ ___   __ _(_)_ __  
// | '_ ` _ \ / _` | | '_ \ 
// | | | | | | (_| | | | | |
// |_| |_| |_|\__,_|_|_| |_|
//                          

async function main() {
	let argument = process.argv.slice(2)[0]//argument two in, like $ yarn seal set-cloud

	if      (argument == 'set-cloud') await mark(true)
	else if (argument == 'set-local') await mark(false)
	else                              await seal()
}
await main()
