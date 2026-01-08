
import {
log, look,
} from 'icarus'
import {promises as fs} from 'fs'

async function main() {
	let p = '../icarus/wrapper.js'
	let c = await fs.readFile(p, 'utf8')
	c = c.replace('"cloud": true', '"cloud": false')
	await fs.writeFile(p, c)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
