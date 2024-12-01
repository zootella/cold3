
import {
	doorLambda,
} from 'icarus'





export const handler = async (lambdaEvent, lambdaContext) => {
	try {
		return doorLambda({lambdaMethod: 'Get.', lambdaEvent, lambdaContext, doorProcessBelow})
	} catch (e) { console.error('[OUTER]', e) }
	return {statusCode: 500, headers: {'Content-Type': 'application/json'}, body: null}
}
async function doorProcessBelow(door) {

	/*
	ok, here, in production, this is correctly a GET
	and correctly there should be no net23 access key

	you need to factor this properly and securely
	like maybe it's:
		return doorLambda({lambdaMethod: 'Get.', lambdaEvent, lambdaContext, doorProcessBelow})
	and then doorlambda checks that this is the method, parses to body that way
	and only checks the access code on POST
	yeah, that's probably the right way to do it
	*/

	if (door.body.key == 'value1') {//todo november, obviosly this gets more sophisticated
		return door.lambdaEvent.Records[0].cf.request//return the original request object, allowing the request to proceed to the vhs CloudFront distribution, which will serve the media file from the vhs bucket
	} else {
		return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: null }//return 403 Forbidden
	}
}
