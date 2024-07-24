
import { nanoid } from 'nanoid'

import { runTests, log } from '../../library/library0.js'
import '../../library/library1.js'
import '../../library/library2.js'
import '../../library/database.js'

export const handler = async (event) => {

	//try some big ints
	let answer = BigInt(Date.now()) * 2n

	//confirm we can get to environment variables and cloud secrets
	let access = 'not found'
	if (typeof process.env.ACCESS_NETWORK_23 == 'string') access = process.env.ACCESS_NETWORK_23.length

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello2, version 2024jul22i',
			answer: `${answer}`,
			tag: nanoid(),
			test: await runTests(),
			access: access
		})
	}
}
