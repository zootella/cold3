
import { nanoid } from 'nanoid'

import { runTests } from '../../library/library0.js'
import '../../library/library1.js'
import '../../library/library2.js'
import '../../library/database.js'

export const handler = async (event) => {

	//try some big ints
	let answer = BigInt(Date.now()) * 2n

	console.log(typeof runTests)

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello2, version 2024jul22i',
      answer: `${answer}`,
			tag: nanoid(),
			test: await runTests()
		}),
	}
}







/*
import nanoid
import Tag
big int literals
run tests

npm run pack
npm run local



*/







