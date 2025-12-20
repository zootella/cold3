
import path from 'path'
import {execSync} from 'child_process'
import fs from 'fs-extra'
import {nodeFileTrace} from '@vercel/nft'
import {
log, look, commas,
} from 'icarus'

async function main() {//build a lean net23/dist/.serverless/net23.zip with the right native binaries for Lambda

	let z = 'dist/.serverless/net23.zip'
	if (await fs.pathExists(z)) {
		let size = (await fs.stat(z)).size
		log(`💽 Deleting ${commas(size)} byte net23.zip from last time`)//size the previous one as a sanity check
	}
	/*
	hi claude, two notes for you here for when we get to this:

	(1)

	hi claude, ok, take a look at this file, build.js, as well as the new size.js alongside, both of which are called from net23/package.json
	ok so this build script sets things up so that serverless build or serverless deploy can generate net23/dist/.serverless/net23.zip
	and this zip file then gets uploaded to amazon, but how big it is and what's inside is also important to developers as they watch the builds going up by
	currently, we just have this script which acts before serverless makes the zip
	and so it can't see the zip that is made
	but it can see the zip from last time, before it empties a fresh dest folder for the new build starting here now

	ok so here's what i want to do
	well have a new script, size.js, which runs after serverless package or serverless deploy
	that script will move zip files forward along a chain as follows
	(a) net23/dist/net23previous.zip
	(b) net23/dist/net23.zip
	(c) net23/dist/.serverless/net23.zip
	after a build that is with or without a deploy, serverless makes a new (c)
	the size script should move this forward, deleting a, moving b to a, copying c to b
	and then the size script should output a one line description of the size, like:

	💽 net23.zip is 12,345,678 bytes, previous +123 KB

	using commas() and saySize4(), and saying +  or - if it got bigger or smaller

	(2)

	also, is the script deploy-only correct? this will cause serverless to not generate a new net23.zip, and deploy the one already there, unchanged up to amazon??
	*/
	await fs.remove('dist')
	await fs.ensureDir('dist')//empty the dist folder
	await fs.copy('.env',           'dist/.env')//copy lambda source files, persephone library files, serverless.yml and .env
	await fs.copy('serverless.yml', 'dist/serverless.yml')
	await fs.copy('src',            'dist/src')
	await fs.copy('persephone',     'dist/persephone')//other files in the net23 folder are left behind; note net23.zip will gain package-lock.json from npm install; it's not too big and having the exact dependency versions locked in the deployed artifact could be valuable for debugging

	//make a package.json for dist based on net23's, with icarus's dependencies merged in
	let p1 = JSON.parse(await fs.readFile('package.json'))
	let p2 = JSON.parse(await fs.readFile('../icarus/package.json'))
	p1.dependencies = {//set the dist/package.json dependencies to have
		...p1.dependencies,//all the net23 dependencies
		...p2.dependencies}//and additionally the icarus dependencies
	delete p1.dependencies.icarus//but not the icarus workspace dependency "*"; we have icarus' dependencies and its code is coming
	await fs.writeFile('dist/package.json', JSON.stringify(p1, null, '\t'))

	log('📜 npm install...')//have npm use dist/package.json to build a new clean production only dist/node_modules
	execSync('npm install --omit=dev --os=linux --cpu=arm64 --libc=glibc', {//install for amazon linux on their graviton chip to get the right sharp native binaries
		cwd: 'dist',//run this command in the dist subfolder
		stdio: 'inherit',//show its command line output
	})

	//now that we have node_modules populated, copy in the icarus .js files
	await fs.ensureDir('dist/node_modules/icarus')//as though there's a node module named "icarus"
	let files = await fs.readdir('../icarus')
	for (let file of files) {
		if (file == 'package.json' || file.endsWith('.js')) await fs.copy('../icarus/'+file, 'dist/node_modules/icarus/'+file)
	}

	log("💫 Analyzing with Vercel's Node File Trace...")
	let entryPoints = (await fs.readdir('dist/src')).filter(f => f.endsWith('.js')).map(f => 'dist/src/' + f)
	let {fileList} = await nodeFileTrace(entryPoints, {base: 'dist'})//from vercel nft's results, pull out the list of necessary files
	let necessary = [...fileList].filter(f => f.startsWith('node_modules/'))//lambda, persephone, icarus files above we've already got

	log(`🗂️ Taking necessary files...`)
	await fs.rename('dist/node_modules', 'dist/node_modules_source')
	for (let file of necessary) {
		await fs.ensureDir(path.dirname('dist/'+file))
		await fs.copy('dist/' + file.replace('node_modules', 'node_modules_source'), 'dist/'+file)
	}
	await fs.remove('dist/node_modules_source')

	let p = 'dist/node_modules/icarus/wrapper.js'
	let c = await fs.readFile(p, 'utf8')
	c = c.replace('"cloud": false', '"cloud": true')//in wrapper.js, set cloud to true
	await fs.writeFile(p, c)
}

main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
