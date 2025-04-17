<script setup>

import {
runTests, liveBox, addLogSink, newline,
} from './index.js'

import {ref, onMounted} from 'vue'//these imports are automatic in Nuxt, but here in just Vite+Vue!

let logs = ''//just for the icarus page, make a local record all the logs code everywhere makes
addLogSink((s) => { logs += (logs.length ? newline : '') + s })//don't start with a blank line

const refResults = ref('')
const refLiveBox = ref('')

onMounted(async () => {
	refResults.value = (await runTests()).message
})

/* tiny tests run six places:
-- ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-> ./icarus/icarus.vue        vite
-- ./test.js                  node
*/

</script>
<template>

<p class="class1">{{refResults}}</p>
<p class="class2a"><input type="text" v-model="refLiveBox" class="class2" id="box2"/></p>
<pre class="class3">{{liveBox(refLiveBox)}}</pre>
<textarea readOnly :value="logs" class="class4" id="box4"></textarea>

</template>
<style scoped>

.class1 {}
.class2 {
  width: calc(100% - 1.5em); /* Adjust the margin size as needed */
  margin-right: 2em; /* Add right margin */
  box-sizing: border-box; /* Ensure padding and border are included in the element's total width and height */
  border: 1px solid #ccc; /* Add a simple square border */
	font: 1em serif; /* Larger text size and serif font */
	padding: 4px;
}
.class2:focus {
  outline: none; /* Remove default focus outline */
  border-color: #ccc; /* Ensure border color stays the same on focus */
}
.class2a {
  margin-bottom: 0.5em; /* Adjust the bottom margin */
}
.class3 {
	font-family: monospace; /* Set the font family to monospace */
  margin-top: 0; /* Adjust the top margin */
  margin-bottom: 0.7em; /* Adjust the bottom margin */
}
.class4 {
	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */
	height: calc(100vh - 11em); /* Set height to match viewport height minus additional spacing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
	border: none; /* Remove border */
	background-color: #f8f8f8; /* Very light gray background */
	resize: none; /* Disable resizing */
}
.class4:focus {
	outline: none; /* Remove focus outline, consider adding alternative focus style */
}

</style>
