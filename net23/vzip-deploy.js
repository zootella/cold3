
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

/*
vzip-deploy: deploy vzip to aws

prepares vzip/ for deployment:
- swaps sharp binaries (mac -> linux arm64 from stowaway)
- sets cloud mode in wrapper.js

then runs serverless deploy from vzip/
*/

const VZIP_DIR = 'vzip'

async function main() {
	console.log('vzip-deploy: preparing for deployment...')

	// check vzip exists
	if (!await fs.pathExists(VZIP_DIR)) {
		console.error('vzip-deploy: vzip folder not found, run yarn vzip-make first')
		process.exit(1)
	}

	// 1. swap sharp binaries: remove mac, add linux
	const stowawayPath = '../../stowaway/node_modules/@img'
	const vzipImgPath = path.join(VZIP_DIR, 'node_modules/@img')

	if (await fs.pathExists(stowawayPath)) {
		// remove any mac/windows binaries
		const imgContents = await fs.readdir(vzipImgPath).catch(() => [])
		for (const item of imgContents) {
			if (item.includes('darwin') || item.includes('win32')) {
				await fs.remove(path.join(vzipImgPath, item))
				console.log(`vzip-deploy: removed ${item}`)
			}
		}

		// copy linux binaries from stowaway
		const linuxDirs = [
			'sharp-libvips-linux-arm64',
			'sharp-linux-arm64',
			'colour',
		]
		for (const dir of linuxDirs) {
			const src = path.join(stowawayPath, dir)
			const dest = path.join(vzipImgPath, dir)
			if (await fs.pathExists(src)) {
				await fs.copy(src, dest, { overwrite: true })
				console.log(`vzip-deploy: copied ${dir}`)
			}
		}
	} else {
		console.error('vzip-deploy: stowaway folder not found!')
		console.error('run these commands to set up stowaway:')
		console.error('  mkdir -p ../../stowaway')
		console.error('  cd ../../stowaway')
		console.error('  npm install --os=linux --cpu=arm64 --libc=glibc sharp@0.34.4')
		process.exit(1)
	}

	// 2. set cloud mode in wrapper.js
	const wrapperPath = path.join(VZIP_DIR, 'node_modules/icarus/wrapper.js')
	if (await fs.pathExists(wrapperPath)) {
		let content = await fs.readFile(wrapperPath, 'utf8')
		content = content.replace(/"cloud":\s*(true|false)/, '"cloud": true')
		await fs.writeFile(wrapperPath, content)
		console.log('vzip-deploy: set wrapper.js cloud mode')
	} else {
		console.error('vzip-deploy: wrapper.js not found')
		process.exit(1)
	}

	// 3. deploy from vzip
	console.log('vzip-deploy: running serverless deploy...')
	execSync('serverless deploy', {
		cwd: VZIP_DIR,
		stdio: 'inherit',
	})

	console.log('vzip-deploy: done!')
}

main().catch(err => {
	console.error('vzip-deploy: fatal error:', err)
	process.exit(1)
})
