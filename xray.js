
import {
log, look, Size,
} from 'icarus'
import {execFileSync} from 'child_process'

//make sure secrets are only the places they should be with this powerful search tool 🩻
//use like $ pnpm xray FujiTracerX10 -- the X family is reserved for examples like this one, the way movie phone numbers start 555; searching it finds only xray's own notes and documentation
//prints a census of the files that contain the given text, searching really everywhere: gitignored, hidden, and binary files included
//deliberately light: the operator matches the printed census against the expectations in xray.md by hand, thinking as they go
async function main() {
	let searchTerm = process.argv[2]
	if (!searchTerm) { log('give the text to find, like $ pnpm xray SEARCH_TERM'); process.exit(1) }

	let result
	try {
		result = execFileSync('rg', [//$ brew install ripgrep; https://github.com/BurntSushi/ripgrep
			'-uuu',//disable all default filtering; really search everywhere
			'-F',//fixed string rather than regular expression; a tracer is a literal
			'-c',//count matches per file; the census is paths and counts, so what surrounds a hit never prints
			'--no-messages',//quiet complaints about files that can't be read
			searchTerm,
			'.',//search the tree from here; without an explicit path, ripgrep reads piped stdin instead of the disk
		], {
			encoding: 'utf8',
			maxBuffer: 128*Size.mb,//max size of output ripgrep can return
		})
	} catch (e) {
		if (e.status == 1) { log(`clean; "${searchTerm}" appears nowhere`); return }//ripgrep exits 1 to say no matches
		else if (e.stdout) { result = e.stdout }//matches found even though some files also errored; take what it found
		else throw e
	}

	let files = result.split('\n').filter(line => line.length).map(line => {
		let i = line.lastIndexOf(':')//count follows the last colon, so a path containing colons still parses
		return {path: line.slice(0, i), count: Number(line.slice(i + 1))}
	}).sort((a, b) => a.path.localeCompare(b.path))

	let total = 0
	for (let f of files) { total += f.count; log(`${(f.count+'').padStart(4)}  ${f.path}`) }
	log(`${total} in ${files.length} files; a search can't see into compressed archives like the lambda zip--stream those separately, like $ unzip -p net23/dist/.serverless/net23.zip | rg -F -c "${searchTerm}"`)
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
