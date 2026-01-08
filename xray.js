
import {
log, look, Size,
} from 'icarus'
import {execSync} from 'child_process'

//make sure secrets are only the places they should be with this powerful search tool
async function main() {
	let searchTerm = process.argv[2]//use like $ yarn xray SEARCH_TERM
	if (!searchTerm) process.exit(1)

	try {
		let result = execSync(//$ brew install ripgrep; rg --version; https://github.com/BurntSushi/ripgrep
			`rg -uuu --column --no-heading --color=never -o "${searchTerm}"`,//disable all default filtering; really search everywhere
			{
				encoding: 'utf8',
				maxBuffer: 128*Size.mb,//128mib, max size of stdout/stderr output ripgrep can return
				stdio: [
					'inherit',//stdin: allow Ctrl+C to interrupt
					'pipe',//stdout: capture ripgrep's output into result variable
					'pipe',//stderr: capture ripgrep's errors into error.stderr
				],
			},
		)
		log(result)
	} catch (e) {
		if (e.status == 1) {
			log(`No matches found for "${searchTerm}"`)
		} else if (e.stdout) {
			log(e.stdout)
		} else {
			throw e
		}
	}
}
main().catch(e => { log('🚧 Error:', look(e)); process.exit(1) })
