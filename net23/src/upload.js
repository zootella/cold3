
import {
Sticker, doorLambda, toss, log, look, defined, Task, Key, Now, tickToText,
} from 'icarus'

import {
bucketDynamicImport,
} from '../persephone/persephone.js'

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {actions: ['Create.', 'SignPart.', 'Complete.', 'Abort.', 'ListParts.'], lambdaEvent, lambdaContext, doorHandleBelow})
	//(2) hi claude, ok so thanks for following the door pattern of our other endpoints, but please take a minute or two to review where this call goes, and everything the door system provides, and how all that works. so i think here we can' tuse door in the standard way, as this lambda is called by pages directly? the door system is just for standard endpoints which are protected and can only be called by authenticated workers. so here, i think we're going to have to look at what door does, lots of stuff, exception handling and routing, an dthen factor out of there the things the parts of that we need to do here. alternatively, we could alter door to be more permissive for this endpoint, but i think this isn't the rigth design choice.
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
async function doorHandleBelow({door, body, action}) {
	const Bucket = Key('vhs bucket, public')
	const {clientS3, presigner} = await bucketDynamicImport()
	const {
		S3Client,
		CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand,
	} = clientS3
	const {getSignedUrl} = presigner
	const client = new S3Client({region: Key('amazon region, public')})

	if (action == 'Create.') {//page wants to upload a file; we tell S3 to expect it and get back an uploadId to track this session
		let path = `uploads/${tickToText(Now())}-${body.filename}`
		let command = new CreateMultipartUploadCommand({
			Bucket,
			Key: path,//Key property is the path in the bucket; timestamp prefix keeps uploads organized and avoids collisions
			ContentType: body.contentType,
		})
		let response = await client.send(command)
		return {uploadId: response.UploadId, key: path}//page needs both to continue: uploadId for S3's tracking, key for the file path

	} else if (action == 'SignPart.') {//page is ready to upload chunk N; we create a presigned URL that lets the browser PUT directly to S3; presigned URL embeds our credentials + expiration, so browser can write without having AWS keys
		let command = new UploadPartCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
			PartNumber: body.partNumber,//S3 requires sequential part numbers starting at 1
		})
		let url = await getSignedUrl(client, command, {expiresIn: 3600})//URL valid for 1 hour
		//^hi claude, is this in seconds or milliseconds? we should use Time. please see how other parts of the codebase use this from  icarus
		return {url}//page will PUT bytes to this URL; S3 responds with ETag (hash of that part)

	} else if (action == 'Complete.') {//page has uploaded all parts and collected their ETags; now we tell S3 to assemble them; S3 verifies all parts are present and combines them into the final object
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
		return {success: true, key: body.key}//upload done! key is the path where file now lives

	} else if (action == 'Abort.') {//user cancelled or something went wrong; tell S3 to discard all uploaded parts; important: incomplete multipart uploads cost storage until aborted
		let command = new AbortMultipartUploadCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		})
		await client.send(command)
		return {success: true}

	} else if (action == 'ListParts.') {//for resume: page asks "which parts already uploaded?" after browser refresh or reconnect; S3 returns array of {PartNumber, ETag, Size} for parts already received; page can skip re-uploading those and continue from where it left off
		let command = new ListPartsCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		})
		let response = await client.send(command)
		return response.Parts || []//empty array if no parts uploaded yet
	}
}
