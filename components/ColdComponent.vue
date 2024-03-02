<script lang="ts" setup>

//imports
import { ref, reactive, onMounted } from "vue";
import { unique } from "~/library/library";//nuxt makes tilde project root

//ticks
const t = reactive({
	tick1: 0,//start of script
	tick2: 0,//on mounted
	tick3: 0,//before fetch
	tick4: 0,//after fetch
	tick5: 0,//time on server
	duration34: 0,//how long the fetch took
	difference35: 0//differences between the clocks
});
t.tick1 = Date.now();
onMounted(() => { t.tick2 = Date.now(); });

//enter button and log box
const textContents = ref("");
function submitEnter() {
	log(`entered "${textContents.value}"`);
	textContents.value = "";
}
const logText = ref("");

//fetch button and use fetch
await doFetch();
async function doFetch() {
	t.tick3 = Date.now();
	const r = await useFetch("/api/mirror");
	t.tick4 = Date.now();
	t.duration34 = t.tick4 - t.tick3;
	log(`fetched message "${r.data.value.message}", secret length "${r.data.value.secretLength}", unique "${r.data.value.unique}", tick "${r.data.value.serverTick}"`);
	t.tick5 = r.data.value.serverTick;
	t.difference35 = t.tick5 - t.tick3;
}
async function clickedFetch() { await doFetch(); }

//library functions
function log(s) {
	let s2 = `${sayTick(Date.now())} '${s}'`;
	console.log(s2);
	logText.value += `\r\n${s2}`;
}
function sayTick(tick) {
	if (!tick) return "(not yet)";//don't render jan1 1970 as a time something actually happened
	var date = new Date(tick);//create a Date object using the given tick count
	var weekday = date.toLocaleDateString('en-US', { weekday: 'short' });//get text like "Mon"
	var hours = date.getHours();//extract hours, minutes, seconds, and milliseconds
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();
	var milliseconds = date.getMilliseconds().toString().padStart(3, "0");
	return `${weekday} ${hours}h ${minutes}m ${seconds}.${milliseconds}s`;
}

</script>
<template>
<div>

<p>
	This is cold3.cc, on Cloudflare with Nuxt, unique {{ unique() }}, version 2024mar2a.
</p>

<p>
	tick1 {{ sayTick(t.tick1) }}, script start<br/>
	tick2 {{ sayTick(t.tick2) }}, on mounted<br/>
	tick3 {{ sayTick(t.tick3) }}, before fetch<br/>
	tick4 {{ sayTick(t.tick4) }}, after fetch, duration {{ t.duration34 }}ms<br/>
	tick5 {{ sayTick(t.tick5) }}, server time, difference {{ t.difference35 }}ms<br/>
</p>
<div>
	<p>
		<button @click="clickedFetch">Fetch</button>
	</p>
</div>

<NoteComponent />

<div>
	<form @submit.prevent="submitEnter">
		Text <input type="text" v-model="textContents" /> <button>Enter</button>
		{{ textContents.length ? `measured ${textContents.length} characters` : "no contents" }}
	</form>
</div>
<div><p><textarea readOnly placeholder="log box" :value="logText"></textarea></p></div>

</div>
</template>
<style scoped>

textarea {

	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */

	max-width: 100%;
	height: 12em; /* Adjust to control the number of lines */
	resize: vertical; /* Allows vertical resizing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
}

</style>
