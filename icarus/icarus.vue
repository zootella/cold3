
<script setup>

import { ref } from 'vue'
import { fun6 } from './library6'
import { log, runTests, temporaryGetLogRecord } from '../library/library0'
import { fun7 } from '../library/library7'

let count = ref(0)


function getLogsAndRunTests() {
	return 'logs and tests'
}

log('hi in icarus script setup')
log(fun6())
log(fun7())

</script>
<template>

<p>{{ runTests() }}</p>
<textarea readOnly :value="temporaryGetLogRecord()"></textarea>

</template>
<style scoped>

textarea {

	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */

	max-width: 100%;
	height: calc(100vh - 6em); /* Set height to match viewport height */
	resize: vertical; /* Allows vertical resizing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
	border: none;

	background-color: #f8f8f8; /* Very light gray background */

}
textarea:focus {
	outline: none;
}

</style>
