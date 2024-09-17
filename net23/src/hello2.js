
import { nanoid } from 'nanoid'

export const handler = async (event) => {

	//try some big ints
	let answer = BigInt(Date.now()) * 2n

	//confirm we can get to environment variables and cloud secrets
	let access = 'not found'
	if (typeof process.env.ACCESS_NETWORK_23 == 'string') access = process.env.ACCESS_NETWORK_23.length

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello2, version 2024aug14a',
			answer: `${answer}`,
			tag: nanoid(),
			access: access
		})
	}
}
