<script lang="ts" setup>

import { ref, onMounted } from "vue";

const tick1 = ref(Date.now());//tick1 is start of script
const tick2 = ref(0);//tick2 is on mounted
const tick3 = ref(0);//tick3 is before fetch
const tick4 = ref(0);//tick4 is after fetch
const tick5 = ref(0);//tick5 is the time on the server

onMounted(() => {
	tick2.value = Date.now();
});


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

const textContents = ref("");
function mySubmit() {
	var s = `${sayTick(Date.now())} '${textContents.value}'`;
	console.log(s);
	logText.value += "\r\n" + s;
	textContents.value = "";
}

const logText = ref("");

await doFetch();
async function doFetch() {
	tick3.value = Date.now();
	const r = await useFetch("/api/mirror");
	tick4.value = Date.now();
	console.log("got from use fetch, message: " + r.data.value.message);
	console.log("secret length: " + r.data.value.secretLength);
	console.log("server tick: " + sayTick(r.data.value.serverTick));
	tick5.value = r.data.value.serverTick;
}
async function clickedFetch() {
	await doFetch();
}



</script>
<template>
<div>

<p>
	This is cold3.cc, on Cloudflare with Nuxt, version 2024feb28a.
</p>
<p>
	tick1 {{ sayTick(tick1) }}, script start<br/>
	tick2 {{ sayTick(tick2) }}, on loaded<br/>
	tick3 {{ sayTick(tick3) }}, before fetch<br/>
	tick4 {{ sayTick(tick4) }}, after fetch<br/>
	tick4 {{ sayTick(tick5) }}, time on the server<br/>
</p>

<div>
	<form @submit.prevent="mySubmit">
		Text <input type="text" v-model="textContents" /> <button>Send</button>
		{{ textContents.length ? `measured ${textContents.length} characters` : "no contents" }}
	</form>
</div>

<div>
	<p>
		<button @click="clickedFetch">Fetch</button>
	</p>
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
