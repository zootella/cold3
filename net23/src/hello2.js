
import { nanoid } from 'nanoid'

export const handler = async (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'and hello from hello2!, v3',
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







