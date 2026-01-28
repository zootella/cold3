
import {
origin23, originApex,
log, look,
} from 'icarus'
import dotenv from 'dotenv'

async function main() {
	dotenv.config({quiet: true})

	const worker = originApex()//http://localhost:3000 locally, but then talks up to real signed-in Amazon
	const lambda = origin23()//http://localhost:4000/prod locally, or https://api.net23.cc in cloud

	//step 1: get an envelope from the nuxt worker, acting as the page would
	log('step 1: getting envelope from worker at', worker)
	let envelopeResponse = await fetch(`${worker}/api/media`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({action: 'MediaDemonstrationUpload.'}),
	})
	let envelopeData = await envelopeResponse.json()
	log('envelope response:', look(envelopeData))
	if (!envelopeData.envelope) { log('no envelope returned'); return }
	let envelope = envelopeData.envelope

	//step 2: create a multipart upload on the lambda
	log('step 2: creating multipart upload at', lambda)
	let createResponse = await fetch(`${lambda}/upload`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', 'Origin': worker},
		body: JSON.stringify({action: 'UploadCreate.', envelope, filename: 'smoke-test.txt', contentType: 'text/plain'}),
	})
	let createData = await createResponse.json()
	log('create response:', look(createData))
	if (!createData.uploadId) { log('create failed'); return }
	let {uploadId, key} = createData

	//step 3: sign part 1
	log('step 3: signing part 1')
	let signResponse = await fetch(`${lambda}/upload`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', 'Origin': worker},
		body: JSON.stringify({action: 'UploadSign.', envelope, uploadId, key, partNumber: 1}),
	})
	let signData = await signResponse.json()
	log('sign response:', look(signData))
	if (!signData.url) { log('sign failed'); return }

	//step 4: put bytes directly to s3 using the presigned url
	log('step 4: putting bytes to s3')
	let payload = Buffer.from('smoke test upload from upload.js')
	let putResponse = await fetch(signData.url, {
		method: 'PUT',
		headers: {'Content-Type': 'text/plain'},
		body: payload,
	})
	let etag = putResponse.headers.get('etag')
	log('put status:', putResponse.status, 'etag:', etag)
	if (!etag) { log('put failed, no etag'); return }

	//step 5: complete the multipart upload
	log('step 5: completing upload')
	let completeResponse = await fetch(`${lambda}/upload`, {
		method: 'POST',
		headers: {'Content-Type': 'application/json', 'Origin': worker},
		body: JSON.stringify({action: 'UploadComplete.', envelope, uploadId, key, parts: [{PartNumber: 1, ETag: etag}]}),
	})
	let completeData = await completeResponse.json()
	log('complete result:', look(completeData))

	log('done! file should be in bucket at:', key)
}
main().catch(e => { log('error:', look(e)); process.exit(1) })
