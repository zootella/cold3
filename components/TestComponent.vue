<script setup>

import { ref, reactive, onMounted } from 'vue'
import { newline, runTests, ok, test, addLogDestination } from '~/library/library0'
//import { log, newline, runTests, ok, test, addLogDestination } from '~/library/library0'
import { unique } from '~/library/library1'


import { getLogsAndRunTests } from '~/library/library2'

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

/*
new design

make the page not hvae a box that scrolls down, that's the log panel
instead, the page starts with the traffic light and stats

log still goes to the developer panel
but there's another function, box(s), which puts text on the page to see your output

make getting here just the regular $ npm run pages:dev
and make changing and saving library0 rerun the tests and refresh the page
maybe you can't do this within nuxt because it won't update unless necessary, though
*/

function getLogs() {
	return getLogsAndRunTests()
}



</script>
<template>
<div>

<p><button @click="runTests">run tests again, oh yeah!</button></p>
<p>new design:</p>
<p><textarea readOnly :value="getLogsAndRunTests()"></textarea></p>
<p>earlier design</p>
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
