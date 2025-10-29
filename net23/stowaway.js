
import fs from 'fs-extra'

/*
     _
 ___| |__   __ _ _ __ _ __
/ __| '_ \ / _` | '__| '_ \
\__ \ | | | (_| | |  | |_) |
|___/_| |_|\__,_|_|  | .__/
                     |_|

https://www.npmjs.com/package/sharp
https://github.com/lovell/sharp
https://sharp.pixelplumbing.com/
https://github.com/libvips/libvips

sharp is a high-performance node image processing module
some javascript wraps libvips, a native module in C
it works windows/mac/linux but the native binaries are platform-specific

here are easy manual steps to get the binaries for lambda
this is node 22, amazon linux 2023, and amazon's graviton chip

~/Documents/code/cold3/net23
~/Documents/code/stowaway

		make a new empty stowaway folder alongside the cold3 monorepo folder

$ mkdir stowaway
$ cd stowaway
$ npm install --os=linux --cpu=arm64 --libc=glibc sharp@0.34.4

		install sharp for amazon linux into the empty folder

$ cat package.json
$ ls -la node_modules/@img
$ find node_modules/@img -ls
$ sha256sum <path>

		check the version you got in package.json
		find the ~16mb libvips binary, and hash it

$ cd ../cold3
$ yarn wash
$ yarn install

		the stowaway script won't overwrite, so wash node modules empty to let it copy in a new version

$ cd net23
$ ls -la node_modules/@img
drwxr-xr-x@ colour
drwxr-xr-x@ sharp-darwin-arm64
drwxr-xr-x@ sharp-libvips-darwin-arm64

		before stowaway, you've got colour and the darwin editions, because we did this on a mac

$ yarn stowaway
$ ls -la node_modules/@img
total 0
drwxr-xr-x@ colour
drwxr-xr-x@ sharp-darwin-arm64
drwxr-xr-x@ sharp-libvips-darwin-arm64
drwxr-xr-x@ sharp-libvips-linux-arm64
drwxr-xr-x@ sharp-linux-arm64

		stowaway copied in the linux versions
		local development works with different platform versions side-by-side

things to note:
- the stowaway script doesn't overwrite, so yarn wash to get actually new versions in
- yarn add anywhere will find and remove the additional modules, so stowaway runs for every deploy
- serverless.yml builds net23.zip picking colour and the two linux folders by name, and excluding everything else

     _                                         
 ___| |_ _____      ____ ___      ____ _ _   _ 
/ __| __/ _ \ \ /\ / / _` \ \ /\ / / _` | | | |
\__ \ || (_) \ V  V / (_| |\ V  V / (_| | |_| |
|___/\__\___/ \_/\_/ \__,_| \_/\_/ \__,_|\__, |
                                         |___/ 

use this script to copy sharp native libraries for linux alongside the windows or mac ones in @img
this sneaks them into the serverless package zip
yarn will find them and throw them back overboard, so manually run $ yarn stowaway after add or install!

$ yarn install   ~ corrects modules for the computer we're coding on
$ yarn stowaway  ~ adds linux sharp binaries alongside ones yarn put there for local development
$ yarn build     ~ serverless package makes net23.zip, taking the ones for linux by name
$ yarn deploy    ~ serverless deploy (importantly skipping package first)

"scripts": {
	"build": "serverless package",                                   ~ make the zip
	"deploy": "serverless deploy --force",                           ~ make the zip and upload it
	"justdeploy": "serverless deploy --force --package .serverless", ~ upload without making first
},
justdeploy is for when you've made the zip in the docker container, copied it out, and deploy that
that alternative is cleaner but more cumbersome
*/

await fs.copy('../../stowaway/node_modules/@img', 'node_modules/@img', {overwrite: false})
