
import {
log, look, Now, Tag, Data,
Sticker, snippet,
doorLambda,
} from '../../library/grand.js'

//import sharp from 'sharp'
import * as jimp from 'jimp'//this is a new one, ugh

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda({lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {
	let o = {}

	await snippetBelow()
	o.note = `lambda snippet2 says: ${Sticker().all}`

	return o
}

async function snippetBelow() {
	log('hi in your lambda snippet below')
//	log(look({jimp}))


	let s = `
		<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
			<rect width="200" height="100" fill="lightblue"/>
			<text x="50%" y="50%" alignment-baseline="middle" text-anchor="middle" font-size="20" fill="black">
				Hello, World!
			</text>
		</svg>
	`
	let d = Data({text: s})


	let pngBuffer = await jimp.read(d.array()).then(image => image.getBufferAsync(jimp.MIME_PNG))
	log(look(pngBuffer))


}



/*
ok, your current theory is that rollup is messing up jimp
what if you configure serverless to just zip up your src and library beside node_modules
the aws sdk is excluded, everything else is in there
no packaging at all
this will be faster to start, certainly,
and no larger to upload

similarly, how about net23's package.json doesn't say type module
and lambda.js is still in library, and still imports grand
but then also can require regular node modulesa nd do regular node things

map this out to understand how the boundary between require and import work
it makes sense to keep lambda separate, and do things oh so node standard there
but still have a library of utility functions and front end code that is isomorphic




*/



