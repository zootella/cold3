//stowaway.mjs
/*
net23's package.json has type set to commonjs so we can require classic modules for lambda
but we want to run this script with $ yarn stowaway
the extension .mjs lets us keep things modern here
*/

import fs from 'fs-extra'

/*
the node module sharp, which can resize and watermark images, relies heavily on platform-specific native libraries
yarn install on windows gets the windows ones; on mac, the mac ones
to work deployed to lambda, we need the ones for linux

copy sharp native libraries for amazon linux alongside the windows or mac ones in @img
this sneaks them into the serverless package zip
yarn will find them and throw them back overboard, so manually run $ yarn stowaway after add or install!

example:
$ yarn install   ~ corrects modules for the computer we're coding on
$ yarn stowaway  ~ adds amazon linux sharp binaries alongside ones yarn put there for mac or windows
$ yarn build     ~ serverless package makes net23.zip, not realizing there are extra binaries in there!
$ yarn deploy    ~ serverless deploy (importantly skipping package first)

"scripts": {
	"build": "serverless package",                                   ~ make the zip
	"deploy": "serverless deploy --force",                           ~ make the zip and upload it
	"justdeploy": "serverless deploy --force --package .serverless", ~ upload without making first
},
justdeploy is for when you've made the zip in the docker container, copied it out, and deploy that
this is the slower but cleaner and better way to deploy to lambda, which doesn't involve the stowaway trick
*/

await fs.copy('../../stowaway', 'node_modules/@img', {overwrite: false})
