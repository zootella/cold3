
import {
log,
} from 'icarus'
//hi claude code, ok, so i've imported log from icarus, and i think we can use it below. this script gets run by local node, which node 22 on my box, and some of the things in icarus we can use to make steps here easier
import path from 'path'
import {execSync} from 'child_process'
import fs from 'fs-extra'
import {nodeFileTrace} from '@vercel/nft'

async function main() {
	const start = Date.now()

	// 1. wash - remove vzip folder
	console.log('vzip: washing...')
	await fs.remove('vzip')
	await fs.ensureDir('vzip')

	// 2. make - copy source files, npm install, copy icarus
	console.log('vzip: making...')

	// copy source files
	await fs.copy('src', 'vzip/src')
	await fs.copy('persephone', 'vzip/persephone')
	await fs.copy('serverless.yml', 'vzip/serverless.yml')
	if (await fs.pathExists('.env')) {
		await fs.copy('.env', 'vzip/.env')
	}

	// read dependencies from net23 and icarus (production deps only)
	const icarusSrc = '../icarus'
	const net23Pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))
	const icarusPkg = JSON.parse(await fs.readFile(path.join(icarusSrc, 'package.json'), 'utf8'))

	// merge dependencies (icarus is a workspace ref, skip it)
	const mergedDeps = {}
	for (const [name, version] of Object.entries(net23Pkg.dependencies || {})) {
		if (name !== 'icarus') {
			mergedDeps[name] = version
		}
	}
	for (const [name, version] of Object.entries(icarusPkg.dependencies || {})) {
		mergedDeps[name] = version
	}

	// create vzip package.json (no devDependencies)
	const vzipPkg = {
		name: 'vzip',
		type: 'module',
		private: true,
		dependencies: mergedDeps,
	}
	await fs.writeFile('vzip/package.json', JSON.stringify(vzipPkg, null, '\t'))

	// run npm install with linux arm64 flags (for lambda deployment)
	execSync('npm install --omit=dev --os=linux --cpu=arm64 --libc=glibc', {
		cwd: 'vzip',
		stdio: 'inherit',
	})

	// copy icarus .js files AFTER npm install (icarus is a workspace, not an npm package)
	const icarusDest = 'vzip/node_modules/icarus'
	await fs.ensureDir(icarusDest)
	const icarusContents = await fs.readdir(icarusSrc)
	for (const item of icarusContents) {
		if (item.endsWith('.js') || item === 'package.json') {
			await fs.copy(path.join(icarusSrc, item), path.join(icarusDest, item))
		}
	}

	// 3. trace - nft trace, prune node_modules
	console.log('vzip: tracing...')

	// find entry points
	const entryPoints = []
	const srcFiles = await fs.readdir('vzip/src').catch(() => [])
	for (const file of srcFiles) {
		if (file.endsWith('.js')) {
			entryPoints.push('vzip/src/' + file)
		}
	}
	const persephoneFiles = await fs.readdir('vzip/persephone').catch(() => [])
	for (const file of persephoneFiles) {
		if (file.endsWith('.js')) {
			entryPoints.push('vzip/persephone/' + file)
		}
	}

	// run nft trace
	const { fileList } = await nodeFileTrace(entryPoints, {
		base: 'vzip',
	})

	// collect node_modules files to keep
	const nodeModulesFiles = []
	for (const file of fileList) {
		if (file.startsWith('node_modules/')) {
			nodeModulesFiles.push(file)
		}
	}
	console.log(`vzip: traced ${nodeModulesFiles.length} files in node_modules`)

	// copy traced files to node_modules_traced
	await fs.ensureDir('vzip/node_modules_traced')
	for (const file of nodeModulesFiles) {
		const relativePath = file.slice(13)  // strip "node_modules/"
		const dest = 'vzip/node_modules_traced/' + relativePath
		await fs.ensureDir(path.dirname(dest))
		await fs.copy('vzip/' + file, dest)
	}

	// swap folders
	await fs.remove('vzip/node_modules')
	await fs.rename('vzip/node_modules_traced', 'vzip/node_modules')

	// 4. set cloud mode in wrapper.js
	console.log('vzip: setting cloud mode...')
	const wrapperPath = 'vzip/node_modules/icarus/wrapper.js'
	if (await fs.pathExists(wrapperPath)) {
		let content = await fs.readFile(wrapperPath, 'utf8')
		content = content.replace(/"cloud":\s*(true|false)/, '"cloud": true')
		await fs.writeFile(wrapperPath, content)
	} else {
		console.error('vzip: wrapper.js not found')
		process.exit(1)
	}

	const elapsed = ((Date.now() - start) / 1000).toFixed(1)
	console.log(`vzip: done in ${elapsed}s`)
}

main().catch(err => {
	console.error('vzip: fatal error:', err)
	process.exit(1)
})
