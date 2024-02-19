<script lang="ts" setup>

import { ref } from "vue";

const tick1 = ref(Date.now());

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

const r = await useFetch("/api/mirror");
console.log("got from use fetch, message: " + r.data.value.message);
console.log("secret length: " + r.data.value.secretLength);
console.log("server tick: " + sayTick(r.data.value.serverTick));

</script>
<template>
<div>

<p>
	Loaded {{ sayTick(tick1) }}.
	This is cold3.cc, on Cloudflare with Nuxt, version 2024feb18a.
</p>

<div>
	<form @submit.prevent="mySubmit">
		Text <input type="text" v-model="textContents" /> <button>Send</button>
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
