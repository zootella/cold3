
import {
Sticker,
Now, Time, Limit,
toss, log,
checkText, hasTextSame,
Tag, checkTag,
Key, doorLambda,
sealEnvelope, openEnvelope,
hashStream,
} from 'icarus'
import {
bucketDynamicImport,
} from '../persephone/persephone.js'
import {
Readable,
} from 'node:stream'//it's fine to use Node in a Lambda (unlike pretty much everywhere else in this monorepo! 🙄)

export const handler = async (lambdaEvent, lambdaContext) => {
	return await doorLambda('POST', {
		from: 'Page.',
		actions: ['Gate.', 'UploadCreate.', 'UploadSign.', 'UploadComplete.', 'UploadAbort.', 'UploadList.', 'UploadHash.'],
		lambdaEvent,
		lambdaContext,
		doorHandleBelow: uploadHandleBelow,
	})
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

	//report reachability to our manual CORS tests; application code doesn't use this action
	if (action == 'Gate.') return {success: true, sticker: Sticker()}

	//page must submit permission envelope from worker
	door.letter = await openEnvelope('UploadPermission.', body.permissionEnvelope)

	const Bucket = Key('vhs bucket, public')
	const {clientS3, presigner} = await bucketDynamicImport()
	const {
		S3Client, GetObjectCommand,
		CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListPartsCommand,
	} = clientS3
	const {getSignedUrl} = presigner
	const client = new S3Client({region: Key('amazon region, public')})

	// 🟠 Create
	if (action == 'UploadCreate.') {//page wants to upload a file; we tell S3 to expect it and get back an uploadId to track this session
		let tag = Tag()//tag's tale 1/4: Lambda generates unique tag, embeds in key upload/<tag>, returns both
		let key = `upload/${tag}`//simple key format: just the tag. filename/metadata tracked in Worker DB, not bucket path
		let response = await client.send(new CreateMultipartUploadCommand({//we give S3 our bucket name, the target key, and content type; S3 allocates a multipart upload session and returns an UploadId we'll use for all subsequent parts
				Bucket,
				Key: key,//unique tag ensures no collisions
				ContentType: body.contentType,
		}))
		return {success: true, uploadId: response.UploadId, key, tag}//page needs uploadId for S3's tracking, key for file location, tag for identifying this upload session

	// 🟠 Sign
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
		return {success: true, url}//page will PUT bytes to this URL; S3 responds with ETag (hash of that part)

	// 🟠 Complete
	} else if (action == 'UploadComplete.') {//page has uploaded all parts and collected their ETags; now we tell S3 to assemble them; S3 verifies all parts are present and combines them into the final object

		await client.send(new CompleteMultipartUploadCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
			MultipartUpload: {
				Parts: body.parts.map(p => ({
					PartNumber: p.PartNumber,
					ETag: p.ETag,//S3 uses ETags to verify parts haven't changed since upload
				})),
			},
		}))
		return {success: true, key: body.key}//upload done! key is where the file now lives in the bucket

	// 🟠 Abort
	} else if (action == 'UploadAbort.') {//user cancelled or something went wrong; tell S3 to discard all uploaded parts; important: incomplete multipart uploads cost storage until aborted

		await client.send(new AbortMultipartUploadCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		}))
		return {success: true}

	// 🟠 List
	} else if (action == 'UploadList.') {//for resume: page asks "which parts already uploaded?" after browser refresh or reconnect; S3 returns array of {PartNumber, ETag, Size} for parts already received; page can skip re-uploading those and continue from where it left off

		let response = await client.send(new ListPartsCommand({
			Bucket,
			Key: body.key,
			UploadId: body.uploadId,
		}))
		return {success: true, parts: response.Parts || []}//empty array if no parts uploaded yet

	// 🟠 Hash
	} else if (action == 'UploadHash.') {//page asks us to hash a completed upload; we read from S3, compute hashes, return both cleartext (for page to display) and sealed envelope (for Worker to trust)

		let key = checkText(body.key)
		let tag = checkTag(body.tag)

		//tag's tale 3/4: page sends tag, Lambda verifies it matches key, seals in bucketEnvelope
		let keyParts = key.split('/')//key format: upload/<tag>
		let keyTag = keyParts.length >= 2 ? keyParts[1] : ''
		if (!hasTextSame(tag, keyTag)) toss('tag mismatch', {tag, keyTag, key})//page can't claim a different tag than what Lambda embedded in the key

		//get the file from S3
		let response = await client.send(new GetObjectCommand({Bucket, Key: key}))
		let size = response.ContentLength
		//hi claude, in the same way that we check the tag and hash, maybe we should also check the size, you know? with your knowledge of consumer devices and S3 and uppy, could there ever be an instance that isn't an error surrounding an interrupted upload or mistake fragment where the size is (correctly) not the same? like encoding with text files or something??
		
		let stream = Readable.toWeb(response.Body)//convert S3's response body Node stream to the newer Web Streams API ReadableStream
		let t = Now()
		let result = await hashStream({stream, size})//computes both the tip and piece hashes in a single read through the stream
		let duration = Now() - t
		let tipHash = result.tipHash.base32()
		let pieceHash = result.pieceHash.base32()
		log(`#️⃣ lambda hashed in ${duration}ms:`, tipHash, pieceHash)

		return {
			success: true,
			tipHash, pieceHash, duration,//cleartext for the page to display
			hashEnvelope: await sealEnvelope('LambdaHashed.', Limit.mediaUpload, {//sealed proof from trusted lambda server to worker
				tag, key, size,
				tipHash, pieceHash, duration,
			}),
		}
	}
}
