
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

/*
vzip-deploy: deploy vzip to aws

prepares vzip/ for deployment:
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

	// set cloud mode in wrapper.js
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

	// deploy from vzip
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
