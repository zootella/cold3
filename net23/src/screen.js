
import {
Sticker, doorLambda,
} from 'icarus'

export const handler = async (lambdaEvent, lambdaContext) => {
	return doorLambda('GET', {lambdaEvent, lambdaContext, doorProcessBelow})
}
async function doorProcessBelow(door) {

	//make sure the origin header is present and value valid right here, too
	//vhs should only serve media files to pages (not naked tabs) on the valid domain name (not weird unknown sites)

	if (door.body.key == 'value1') {//todo november, obviosly this gets more sophisticated
		return door.lambdaEvent.Records[0].cf.request//return the original request object, allowing the request to proceed to the vhs CloudFront distribution, which will serve the media file from the vhs bucket
	} else {
		return {statusCode: 403, headers: {'Content-Type': 'application/json'}, body: null}//return 403 Forbidden
	}
}
