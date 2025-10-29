
import fs from 'fs-extra'

/*
the node module sharp, which can resize and watermark images, relies heavily on platform-specific native libraries
yarn install on windows gets the windows ones; on mac, the mac ones
to work deployed to lambda, we need the ones for linux on amazon's graviton chip

use this script to copy sharp native libraries for linux alongside the windows or mac ones in @img
you got the linux libraries from the docker container
this sneaks them into the serverless package zip
yarn will find them and throw them back overboard, so manually run $ yarn stowaway after add or install!

example:
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
as a future third method, you could also configure a docker container with permissions to deploy
*/

/*
ttd october
the whole docker thing was overkill just to get npm to download the right prebuilt binaries
claude found a way to install them into a temporary folder

$ npm install --os=linux --cpu=arm64 --libc=glibc sharp
$ cat package.json

to confirm  you get the right version
(continue on here with instructions to setup)

*/

await fs.copy('../../stowaway', 'node_modules/@img', {overwrite: false})
