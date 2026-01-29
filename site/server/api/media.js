
import {
vhsSign,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['MediaDeliverySign.', 'MediaUploadPermission.', 'MediaUploadHash.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	// 🟠 Sign
	if (action == 'MediaDeliverySign.') {//a page wants a URL to show a media file from the VHS bucket through CloudFront; we have to add a signature to get through vhs.cjs to approve delivery

		return {
			success: true,
			source: 'https://vhs.net23.cc/banner.png?'+(await vhsSign('/', Limit.mediaDownload)),
			sticker: Sticker(),
		}

	// 🟠 Permission
	} else if (action == 'MediaUploadPermission.') {//a page is asking permission to use the /upload lambda; we grant an envelope if they submitted the correct password, ttd january

		if (hasTextSame(body.hash, Key('upload demonstration password hash, private'))) {
			return {
				success: true,
				permissionEnvelope: await sealEnvelope('UploadPermission.', Limit.mediaUpload, {}),
			}
		} else {
			return {
				success: false,
				reason: 'BadPassword.',
			}
		}

	// 🟠 Hash
	} else if (action == 'MediaUploadHash.') {//page calls here with hashes from client and lambda, before and after the upload

		let letter
		if (body.hashEnvelope) letter = await openEnvelope('LambdaHashed.', body.hashEnvelope)//trusted information the lambda sealed for us here

		log(`#️⃣ worker got hashes:`, look({browserHash, action, body, letter}))//ttd january, here's where soon we'll update file_table in supabase, and tell the lambda to move or delete the file from /uploads/<tag> to a hash based location in the bucket. here also is where, if hashes match a blob we already have, we tell the page to short circuit what would be a duplicate upload and storage to instant success 🪄✨

		return {
			success: true
		}
	}
}
