
//./xray.js - make sure secrets are only the places they should be with this powerful search tool
import {execSync} from 'child_process'

let searchTerm = process.argv[2]//use like $ yarn xray SEARCH_TERM
if (!searchTerm) process.exit(1)

try {
	let result = execSync(//$ brew install ripgrep; rg --version; https://github.com/BurntSushi/ripgrep
		`rg -uuu --column --no-heading --color=never -o "${searchTerm}"`,//disable all default filtering; realy search everywhere
		{
			encoding: 'utf8',
			maxBuffer: 128*1024*1024,//128mib, max size of stdout/stderr output ripgrep can return
			stdio: [
				'inherit',//stdin: allow Ctrl+C to interrupt
				'pipe',//stdout: capture ripgrep's output into result variable
				'pipe',//stderr: capture ripgrep's errors into error.stderr
			],
		},
	)
	console.log(result)
} catch (error) {
	if (error.status === 1) {
		console.log(`No matches found for "${searchTerm}"`)
	} else if (error.stdout) {
		console.log(error.stdout)
	} else {
		console.error(error.message)
	}
}
