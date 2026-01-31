
import {
log, look, commas, newline,
} from 'icarus'
import path from 'path'
import {execSync} from 'child_process'
import fs from 'fs-extra'
import {nodeFileTrace} from '@vercel/nft'

async function main() {//build a lean net23/dist/.serverless/net23.zip with the right native binaries for Lambda

	await fs.remove('dist')
	await fs.ensureDir('dist')//empty the dist folder
	await fs.copy('.env',           'dist/.env')//copy lambda source files, persephone library files, serverless.yml and .env
	await fs.copy('serverless.yml', 'dist/serverless.yml')
	{//strip lines marked BuildRemove; they're for local dev with serverless-offline, but production uses only the Function URL
		let p = 'dist/serverless.yml'
		let c = await fs.readFile(p, 'utf8')
		c = c.split(/\r?\n/).filter(line => !line.includes('BuildRemove')).join(newline)
		await fs.writeFile(p, c)
	}//ttd january, now that the lambda function url refactor is working, note to come back here and clean this up maybe
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

	log("🌳 Analyzing with Vercel's Node File Trace...")
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
	c = c.replace('"cloud": false', '"cloud": true')//in dist's icarus/wrapper.js, set cloud true
	await fs.writeFile(p, c)
}

main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
