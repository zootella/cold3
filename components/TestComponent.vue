<script setup>

import { ref, reactive, onMounted } from 'vue'
import { log, newline, runTests, ok, test, addLogDestination } from '~/library/library0'

const logContents = ref('');



function boxLogger(s) {
	logContents.value += newline + s
}




onMounted(() => {
	addLogDestination(boxLogger)
	runTests()
})

test(() => {
	ok(true)
	ok(true)
	ok(true)

	log('hi within a test')
})







</script>
<template>
<div>

<p><button @click="runTests">run tests again, oh yeah!</button></p>
<p><textarea readOnly :value="logContents"></textarea></p>

</div>
</template>
<style scoped>

textarea {

	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */

	max-width: 100%;
	height: 30em; /* Adjust to control the number of lines */
	resize: vertical; /* Allows vertical resizing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
}

</style>
