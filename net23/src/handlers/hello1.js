
export const handler = async (event) => {
	return {
		statusCode: 200,
		body: JSON.stringify({
			message: 'hello1, version 2024jul16j'
		})
	}
}
