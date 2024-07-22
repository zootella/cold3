
import { nanoid } from 'nanoid'

export const handler = async (event) => {

	//try some big ints
	let answer = BigInt(Date.now()) * 2n

	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello2, version 2024jul22e',
      answer: `${answer}`,
			tag: nanoid()
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







