<script lang="ts" setup>

import { ref, reactive, onMounted } from 'vue'
import {
log, look, Now, sayTick
} from '@/library/grand.js'

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
t.tick1 = Now();
onMounted(() => { t.tick2 = Now(); });

//enter button and log box
const textContents = ref("");
function submitEnter() {
	logToBox(`entered "${textContents.value}"`);
	textContents.value = "";
}
const logText = ref("");

//fetch button and use fetch
await doFetch();
async function doFetch() {
	t.tick3 = Now();
	const r = await useFetch("/api/mirror2d",	{method: 'POST'});
	t.tick4 = Now();
	t.duration34 = t.tick4 - t.tick3;
	logToBox(`fetched message "${r.data.value.message}", access length "${r.data.value.accessLength}", tag "${r.data.value.tag}", tick "${r.data.value.serverTick}", say environment "${r.data.value.sayEnvironment}"`);
	t.tick5 = r.data.value.serverTick;
	t.difference35 = t.tick5 - t.tick3;
}
async function clickedFetch() { await doFetch(); }

//library functions
function logToBox(s) {
	let s2 = `${sayTick(Now())} '${s}'`;
	//log(s2);
	logText.value += `\r\n${s2}`;
}

</script>
<template>
<div>

<p>
	This is cold3.cc, Nuxt on Cloudflare.
</p>

<CountComponent2 />

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
