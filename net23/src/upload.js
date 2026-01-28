
import {

//manual icarus import block for upload lambda
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
checkText, hasText, checkTextSame, hasTextSame,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,
sealEnvelope, openEnvelope,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,

//and also import these references
decryptKeys, checkActions, awaitDoorPromises, checkForwardedSecure, checkOriginValid,
tickToText, originApex,

} from 'icarus'

import {
bucketDynamicImport,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await uploadLambda('POST', {actions: ['UploadCreate.', 'UploadSign.', 'UploadComplete.', 'UploadAbort.', 'UploadList.'], lambdaEvent, lambdaContext})//the other lambda handlers use doorLambda, but they're all for authenticated worker<->lambda communication. Here, pages need to upload to Amazon directly, so we can't use doorLambda. Instead, we copy over the patterns and protections from icarus to this one endpoint. 💦 Not very DRY, and if we ever have a second page<->lambda endpoint we may reconsider, ttd january
}
async function uploadLambda(method, {actions, lambdaEvent, lambdaContext}) {
	try {
		let door = {}, response, error
		try {

			await uploadLambdaOpen({method, actions, lambdaEvent, lambdaContext, door})
			response = await uploadHandleBelow({
				door,
				body: door.body,
				action: door.body?.action,
			})

		} catch (e) { error = e }
		try {

			let r = await uploadLambdaShut(door, response, error)
			if (response && !error) return r

		} catch (e2) { await logAlert('upload shut', {e2, door, response, error}) }
	} catch (e3) { console.error('[OUTER]', e3) }
	return {statusCode: 500, headers: {'Access-Control-Allow-Origin': originApex()}, body: null}
}
async function uploadLambdaOpen({method, actions, lambdaEvent, lambdaContext, door}) {
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: 'u10', environment: process.env})
	}
	await decryptKeys('lambda', sources)

	door.task = Task({name: 'upload lambda'})//make a door object like icarus does for worker<>lambda calls
	door.lambdaEvent = lambdaEvent
	door.lambdaContext = lambdaContext

	checkForwardedSecure(lambdaEvent.headers)//deployed, protocol must be https
	if (method != lambdaEvent.httpMethod) toss('method mismatch', {method, door})//Uppy will PUT to S3, but the page must POST here
	door.method = method
	checkOriginValid(lambdaEvent.headers)//doorLambda checks Origin; here, pages call directly so we check origin is the Nuxt site

	door.body = makeObject(lambdaEvent.body)//parse body
	checkActions({action: door.body?.action, actions})//check action
	door.letter = await openEnvelope('Net23Upload.', door.body.envelope)//open envelope; page previously got from worker
}
async function uploadLambdaShut(door, response, error) {
	door.response = response
	door.error = error
	door.task?.finish()

	let r
	if (error) {
		logAlert('upload error', {body: door.body, response, error})
		r = null
	} else {
		r = {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': originApex(),//page at cold3.cc calls Lambda at api.net23.cc; browser requires CORS headers on every response, not just the preflight OPTIONS (which API Gateway handles via serverless.yml)
			},
			body: makeText(response),
		}
	}
	await awaitDoorPromises()
	return r
}

/*
S3 multipart upload: browser uploads files in chunks directly to S3, but needs Lambda to orchestrate.
Why? Browser can't have AWS credentials, so Lambda creates presigned URLs that grant temporary permission.

Flow for a file upload:
1. Create. - Lambda tells S3 "starting an upload", S3 returns uploadId to track this upload session
2. SignPart. - For each chunk, Lambda creates a presigned URL; browser PUTs bytes directly to S3, gets back ETag
3. Complete. - Browser collected all ETags; Lambda tells S3 "combine these parts into the final file"

The browser never sends file bytes through Lambda - that would be slow and expensive.
Instead, Lambda just does the coordination, and browser talks directly to S3 for the actual data.
*/
async function uploadHandleBelow({door, body, action}) {
	const Bucket = Key('vhs bucket, public')
	const {clientS3, presigner} = await bucketDynamicImport()
	const {
		S3Client,
		CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand,
	} = clientS3
	const {getSignedUrl} = presigner
	const client = new S3Client({region: Key('amazon region, public')})

	if (action == 'UploadCreate.') {//page wants to upload a file; we tell S3 to expect it and get back an uploadId to track this session
		let filename = checkText(body.filename)
		if (!/^[0-9A-Za-z][0-9A-Za-z.\-]*$/.test(filename)) toss('filename', {filename})//letters, numbers, dots, hyphens only; no slashes, spaces, or other characters that could manipulate the S3 key path

		let key = `uploads/${tickToText(Now())}.${Tag()}.${filename}`//choose a unique path and filename in the bucket for this upload; in AWS parlance this is the "key"
		let command = new CreateMultipartUploadCommand({//we give S3 our bucket name, the target key, and content type; S3 allocates a multipart upload session and returns an UploadId we'll use for all subsequent parts
			Bucket,
			Key: key,//timestamp prefix keeps uploads organized and avoids collisions
			ContentType: body.contentType,
		})
		let response = await client.send(command)
		return {uploadId: response.UploadId, key}//page needs both to continue: uploadId for S3's tracking, key for the file location in the bucket

	} else if (action == 'UploadSign.') {//page is ready to upload chunk N; we create a presigned URL that lets the browser PUT directly to S3; presigned URL embeds our credentials + expiration, so browser can write without having AWS keys
		let url = await getSignedUrl(
			client,
			new UploadPartCommand({
				Bucket,
				Key: body.key,
				UploadId: body.uploadId,
				PartNumber: body.partNumber,//S3 requires sequential part numbers starting at 1
			}),
			{//options object as third parameter
				expiresIn: Limit.mediaUpload/Time.second//generate signed URLs that expire in this number of seconds
			},
		)
		return {url}//page will PUT bytes to this URL; S3 responds with ETag (hash of that part)

	} else if (action == 'UploadComplete.') {//page has uploaded all parts and collected their ETags; now we tell S3 to assemble them; S3 verifies all parts are present and combines them into the final object
		let command = new CompleteMultipartUploadCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
			MultipartUpload: {
				Parts: body.parts.map(p => ({
					PartNumber: p.PartNumber,
					ETag: p.ETag,//S3 uses ETags to verify parts haven't changed since upload
				})),
			},
		})
		await client.send(command)
		return {success: true, key: body.key}//upload done! key is where the file now lives in the bucket

	} else if (action == 'UploadAbort.') {//user cancelled or something went wrong; tell S3 to discard all uploaded parts; important: incomplete multipart uploads cost storage until aborted
		let command = new AbortMultipartUploadCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		})
		await client.send(command)
		return {success: true}

	} else if (action == 'UploadList.') {//for resume: page asks "which parts already uploaded?" after browser refresh or reconnect; S3 returns array of {PartNumber, ETag, Size} for parts already received; page can skip re-uploading those and continue from where it left off
		let command = new ListPartsCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		})
		let response = await client.send(command)
		return response.Parts || []//empty array if no parts uploaded yet
	}
}
