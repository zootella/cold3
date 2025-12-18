
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

/*
vzip-make: clean room install

creates vzip/ folder with:
- src/, persephone/, serverless.yml, .env from net23
- merged dependencies from net23 + icarus (production only)
- yarn install to get proper node_modules
- icarus .js files copied to node_modules/icarus/

result: working serverless offline, ready to test locally
*/

const VZIP_DIR = 'vzip'

async function main() {
	console.log('vzip-make: creating clean room install...')

	// start fresh
	await fs.remove(VZIP_DIR)
	await fs.ensureDir(VZIP_DIR)

	// copy source files
	await fs.copy('src', path.join(VZIP_DIR, 'src'))
	await fs.copy('persephone', path.join(VZIP_DIR, 'persephone'))
	await fs.copy('serverless.yml', path.join(VZIP_DIR, 'serverless.yml'))
	if (await fs.pathExists('.env')) {
		await fs.copy('.env', path.join(VZIP_DIR, '.env'))
	}
	console.log('vzip-make: copied src, persephone, serverless.yml, .env')

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
	await fs.writeFile(
		path.join(VZIP_DIR, 'package.json'),
		JSON.stringify(vzipPkg, null, '\t')
	)
	console.log('vzip-make: created package.json with merged dependencies')
	console.log('vzip-make: dependencies:', Object.keys(mergedDeps).join(', '))

	// run yarn install (--production to be explicit about no devDeps)
	console.log('vzip-make: running yarn install --production...')
	execSync('yarn install --production', {
		cwd: VZIP_DIR,
		stdio: 'inherit',
	})

	// copy icarus .js files AFTER yarn install (icarus is a workspace, not an npm package)
	const icarusDest = path.join(VZIP_DIR, 'node_modules/icarus')
	await fs.ensureDir(icarusDest)
	const icarusContents = await fs.readdir(icarusSrc)
	for (const item of icarusContents) {
		if (item.endsWith('.js') || item === 'package.json') {
			await fs.copy(path.join(icarusSrc, item), path.join(icarusDest, item))
		}
	}
	console.log('vzip-make: copied icarus .js files to node_modules/icarus/')

	console.log('vzip-make: done! test with: yarn vzip-local')
}

main().catch(err => {
	console.error('vzip-make: fatal error:', err)
	process.exit(1)
})
