
import {
log, look, commas, saySize4,
} from 'icarus'
import fs from 'fs-extra'

const p1 = 'dist/.serverless/net23.zip'//serverless build and serverless deploy make a new file here
const p2 = 'size/net23.zip'//this script copies it to here
const p3 = 'size/net23previous.zip'//but only after moving the previous one here!

async function main() {//copy out the net23.zip file that serverless framework just built and show its size

	await fs.ensureDir('size')//note that git ignores "size", and seal doesn't include zips in wrapper
	await fs.remove(p3)
	if (await fs.pathExists(p2)) await fs.rename(p2, p3)
	await fs.copy(p1, p2)//we've shifted the files p1 -> p2 -> p3

	let size2 = (await fs.stat(p2)).size//the zip serverless just built
	let size3 = 0; if (await fs.pathExists(p3)) size3 = (await fs.stat(p3)).size//the previous one, or zero

	let gain = size2 - size3
	let absolute = Math.abs(gain)
	let comparison = 'same as previous'
	if (absolute) comparison = `previous ${gain > 0 ? '+' : '-'}${absolute == 1 ? '1 byte' : saySize4(absolute)}`
	log(`💽 net23.zip is ${saySize4(size2)}; ${comparison}`)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
