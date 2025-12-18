
import { nodeFileTrace } from '@vercel/nft'
import fs from 'fs-extra'
import path from 'path'

/*
vzip-trace: prune node_modules using vercel nft

traces entry points in vzip/, then:
- copies traced node_modules files to node_modules_traced/
- removes original node_modules/
- renames node_modules_traced/ to node_modules/

run after vzip-make, before vzip-deploy
*/

const VZIP_DIR = 'vzip'

async function main() {
	console.log('vzip-trace: tracing dependencies...')

	// check vzip exists
	if (!await fs.pathExists(VZIP_DIR)) {
		console.error('vzip-trace: vzip folder not found, run yarn vzip-make first')
		process.exit(1)
	}

	// find entry points
	const srcDir = path.join(VZIP_DIR, 'src')
	const persephoneDir = path.join(VZIP_DIR, 'persephone')

	const entryPoints = []

	const srcFiles = await fs.readdir(srcDir).catch(() => [])
	for (const file of srcFiles) {
		if (file.endsWith('.js')) {
			entryPoints.push(path.join(VZIP_DIR, 'src', file))
		}
	}

	const persephoneFiles = await fs.readdir(persephoneDir).catch(() => [])
	for (const file of persephoneFiles) {
		if (file.endsWith('.js')) {
			entryPoints.push(path.join(VZIP_DIR, 'persephone', file))
		}
	}

	console.log(`vzip-trace: found ${entryPoints.length} entry points`)

	// run nft trace
	const { fileList } = await nodeFileTrace(entryPoints, {
		base: VZIP_DIR,
	})

	console.log(`vzip-trace: nft traced ${fileList.size} files`)

	// count node_modules files to copy
	const nodeModulesFiles = []
	for (const file of fileList) {
		if (file.startsWith('node_modules/')) {
			nodeModulesFiles.push(file)
		}
	}
	console.log(`vzip-trace: ${nodeModulesFiles.length} files in node_modules to keep`)

	// copy traced files to node_modules_traced
	const tracedDir = path.join(VZIP_DIR, 'node_modules_traced')
	await fs.ensureDir(tracedDir)

	for (const file of nodeModulesFiles) {
		const relativePath = file.slice(13)  // strip "node_modules/"
		const src = path.join(VZIP_DIR, file)
		const dest = path.join(tracedDir, relativePath)

		await fs.ensureDir(path.dirname(dest))
		await fs.copy(src, dest)
	}

	console.log('vzip-trace: copied traced files')

	// swap folders
	const nodeModulesDir = path.join(VZIP_DIR, 'node_modules')
	await fs.remove(nodeModulesDir)
	await fs.rename(tracedDir, nodeModulesDir)

	console.log('vzip-trace: swapped node_modules')
	console.log('vzip-trace: done! next: yarn vzip-deploy')
}

main().catch(err => {
	console.error('vzip-trace: fatal error:', err)
	process.exit(1)
})
