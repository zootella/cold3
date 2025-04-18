//./plugins/helloPlugin.client.js

export default defineNuxtPlugin(async (nuxtApp) => {

	const helloStore = useHelloStore()
	await helloStore.hello1()//$fetch-es to /api/hello1 on first call, does not do that on later calls
	//await hello1, as a whole bunch of components will render depending on helloStore.userTag or not
	//but don't await this one, just get it started now, when the page hits a new tab, and let it happen in a moment after there are already components on the page
	/*no await*/helloStore.hello2()

	/*
	ttd april, all of this will change with the cookie based browser tag, and that's fine
	also, you're thinking you do a quick monolith single hello, to show the user a complete rendered page all at once, rather than a page that grows and snaps open in more than one step
	*/
})
