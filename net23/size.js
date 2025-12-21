
import {
log, commas, saySize4,
} from 'icarus'
import fs from 'fs-extra'

const p1 = 'dist/.serverless/net23.zip'//serverless build and serverless deploy make a new file here
const p2 = 'size/net23.zip'//this script copies it to here
const p3 = 'size/net23previous.zip'//but only after moving the previous one here!

async function main() {//copy the net23.zip serverless framework just built out, and show its size

	await fs.ensureDir('size')
	await fs.remove(p3)
	if (await fs.pathExists(p2)) await fs.rename(p2, p3)
	await fs.copy(p1, p2)

	let size2 = (await fs.stat(p2)).size//the new build
	let size3; if (await fs.pathExists(p3)) size3 = (await fs.stat(p3)).size//the previous build, if any

	let s = `💽 net23.zip is ${commas(size2)} bytes`
	if (size3) {
		let gain = size2 - size3
		let sign = gain >= 0 ? '+' : '-'
		s += ` ${sign}${saySize4(Math.abs(gain))} previous`
	}
	log(s)
}

main().catch(e => { console.error('🚧 Error:', e); process.exit(1) })
