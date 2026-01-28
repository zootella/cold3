
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
			source: 'https://vhs.net23.cc/banner.png?'+(await vhsSign('/', 2*Time.hour)),
			sticker: Sticker(),
		}
	}

	if (action == 'MediaDemonstrationUpload.') {

		return {
			success: true,
			envelope: await sealEnvelope('Net23Upload.', Time.minute, {}),
		}
	}
}
