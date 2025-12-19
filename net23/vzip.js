
import path from 'path'
import {execSync} from 'child_process'
import fs from 'fs-extra'
import {nodeFileTrace} from '@vercel/nft'
import {
log, look,
} from 'icarus'

async function build() {//build the file net23/vzip/.serverless/net23.zip to deploy to AWS Lambda

	log('Emptying...')//empty the vzip folder
	await fs.remove('vzip')
	await fs.ensureDir('vzip')

	log('Seeding...')//copy lambda source files, persephone library files, serverless.yml and .env
	await fs.copy('.env',           'vzip/.env')
	await fs.copy('serverless.yml', 'vzip/serverless.yml')
	await fs.copy('src',            'vzip/src')
	await fs.copy('persephone',     'vzip/persephone')

	//make a package.json for vzip based on net23's, with icarus's dependencies merged in
	let p1 = JSON.parse(await fs.readFile('package.json'))
	let p2 = JSON.parse(await fs.readFile('../icarus/package.json'))
	p1.dependencies = {//the vzip/package.json dependencies: {} object
		...p1.dependencies,//all the net23 dependencies
		...p2.dependencies}//and additionally the icarus dependencies
	delete p1.dependencies.icarus//remove the icarus workspace dependency "*"; we've brought in icarus' dependencies and will copy its code soon below
	await fs.writeFile('vzip/package.json', JSON.stringify(p1, null, '\t'))

	log('npm 📜 installing...')//have npm use vzip/package.json to build a new clean production only vzip/node_modules
	execSync('npm install --omit=dev --os=linux --cpu=arm64 --libc=glibc', {//install for amazon linux on their graviton chip to get the right sharp native binaries
		cwd: 'vzip',//run this command in the vzip subfolder
		stdio: 'inherit',//show its command line output
	})

	log('Placing icarus...')//now that we have node_modules populated, copy in the icarus .js files
	await fs.ensureDir('vzip/node_modules/icarus')//as though there's a node module named "icarus"
	let files = await fs.readdir('../icarus')
	for (let file of files) {
		if (file == 'package.json' || file.endsWith('.js')) await fs.copy('../icarus/'+file, 'vzip/node_modules/icarus/'+file)
	}

	log("Running Vercel's 💫 Node File Trace...")
	let entryPoints = (await fs.readdir('vzip/src')).filter(f => f.endsWith('.js')).map(f => 'vzip/src/' + f)
	let {fileList} = await nodeFileTrace(entryPoints, {base: 'vzip'})//from vercel nft's results, pull out the list of necessary files
	let necessary = [...fileList].filter(f => f.startsWith('node_modules/'))//lambda, persephone, icarus files above we've already got

	log(`...which identifies ${necessary.length} necessary files in node_modules. Taking...`)
	await fs.rename('vzip/node_modules', 'vzip/node_modules_source')
	for (let file of necessary) {
		await fs.ensureDir(path.dirname('vzip/'+file))
		await fs.copy('vzip/' + file.replace('node_modules', 'node_modules_source'), 'vzip/'+file)
	}
	await fs.remove('vzip/node_modules_source')

	log('Marking cloud ☁️ true in wrapper.js...')
	let p = 'vzip/node_modules/icarus/wrapper.js'
	let c = await fs.readFile(p, 'utf8')
	c = c.replace('"cloud": false', '"cloud": true')
	await fs.writeFile(p, c)
}

build().catch(e => { log('Error:', look(e)); process.exit(1) })
