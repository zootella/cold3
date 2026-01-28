
import {
vhsSign,
} from 'icarus'

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {actions: ['MediaDemonstrationSign.', 'MediaDemonstrationUpload.'], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

	if (action == 'MediaDemonstrationSign.') {

		return {
			success: true,
			source: 'https://vhs.net23.cc/banner.png?'+(await vhsSign('/', Limit.mediaDownload)),
			sticker: Sticker(),
		}
	}

	if (action == 'MediaDemonstrationUpload.') {
		if (!hasTextSame(body.hash, Key('upload demonstration password hash, private'))) return {success: false, reason: 'BadPassword.'}

		return {
			success: true,
			envelope: await sealEnvelope('Net23Upload.', Limit.mediaUpload, {}),
		}
	}
}
