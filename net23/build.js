
import {
log, look, commas, newline, deindent,
} from 'icarus'
import path from 'path'
import {execSync} from 'child_process'
import fs from 'fs-extra'
import {nodeFileTrace} from '@vercel/nft'

async function main() {//build a lean net23/dist/.serverless/net23.zip with the right native binaries for Lambda

	await fs.remove('dist')
	await fs.ensureDir('dist')//empty the dist folder
	await fs.copy('.env',           'dist/.env')//copy lambda source files, persephone library files, serverless.yml and .env
	await fs.copy('src',            'dist/src')
	await fs.copy('persephone',     'dist/persephone')//other files in the net23 folder are left behind; note net23.zip will gain package-lock.json from npm install; it's not too big and having the exact dependency versions locked in the deployed artifact could be valuable for debugging

	let c = await fs.readFile('serverless.yml', 'utf8')
	c = c.split(/\r?\n/).filter(line => !line.includes('BuildRemove')).join(newline)//strip lines marked BuildRemove; they let serverless-offline emulate API Gateway-style; we deploy to Lambda Function URLs instead
	await fs.writeFile('dist/serverless.yml', c)

	//make a package.json for dist based on net23's, with icarus's dependencies merged in
	let p1 = JSON.parse(await fs.readFile('package.json'))
	let p2 = JSON.parse(await fs.readFile('../icarus/package.json'))
	p1.dependencies = {//set the dist/package.json dependencies to have
		...p1.dependencies,//all the net23 dependencies
		...p2.dependencies}//and additionally the icarus dependencies
	delete p1.dependencies.icarus//but not the icarus workspace dependency "*"; we have icarus' dependencies and its code is coming
	p1.pnpm = {//pnpm can't fake platform from the CLI; it reads supportedArchitectures from package.json
		supportedArchitectures: {//install optional deps for Lambda's platform, not the build machine's
			os: ['linux'],//Amazon Linux 2023
			cpu: ['arm64'],//Graviton
			libc: ['glibc'],//pnpm ignores this and installs musl too; we delete musl after install
		},
		onlyBuiltDependencies: ['sharp'],//pnpm 10 blocks postinstall scripts by default; sharp needs theirs to set up its native binaries
	}
	await fs.writeFile('dist/package.json', JSON.stringify(p1, null, '\t'))

	//also place npmrc and pnpm workspace files alongside package.json in dist
	await fs.writeFile('dist/.npmrc', deindent`
		node-linker=hoisted #flat layout so vercel nft doesn't trace into .pnpm symlink farm
	`)
	await fs.writeFile('dist/pnpm-workspace.yaml', deindent`
		#we place a blank file here to stop pnpm from looking further upwards to the monorepo above
	`)

	//pnpm installs faster than npm
	log('📜 pnpm install...')
	execSync('pnpm install --prod', {
		cwd: 'dist',
		stdio: 'inherit',
	})
	await fs.remove('dist/node_modules/@img/sharp-linuxmusl-arm64')
	await fs.remove('dist/node_modules/@img/sharp-libvips-linuxmusl-arm64')//sharp ships two sets of linux-arm64 native binaries: glibc (for Amazon Linux, Ubuntu, Debian) and musl (for Alpine). pnpm ignores the libc filter and installs both (~17 MB each), so as a workaround, we manually delete musl

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
	c = await fs.readFile(p, 'utf8')
	c = c.replace('"cloud": false', '"cloud": true')//in dist's icarus/wrapper.js, set cloud true
	await fs.writeFile(p, c)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
