
export default defineEventHandler((workerEvent) => {
	return {message: 'noop'}
})

/*
2024sep20

./server/api/endpoint1.js
./library/library1.js

Nitro automatically restarts really fast when you save the code for a Nuxt endpoint
but if you make a change in a library function endpoint code uses, it doesn't restart
and Ctrl+C and $ npm run local takes over 30 seconds!

so here's the workaround:
just keep this open in a tab, and Ctrl+S to restart the server whenever you want
current saved edits in endpoints and library functions stick
*/
