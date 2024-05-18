<script setup>

import { runTests, getLogRecord } from '../library/library0'
import '../library/library1'
import '../library/library2'

</script>
<template>

<p>{{ runTests() }}</p>
<textarea readOnly :value="getLogRecord()"></textarea>

</template>
<style scoped>

textarea {
	width: calc(100% - 2em); /* Adjust the margin size as needed */
	margin-right: 2em; /* Add right margin */
	height: calc(100vh - 6em); /* Set height to match viewport height minus additional spacing */
	overflow-x: hidden; /* Hide horizontal scrollbar */
	white-space: pre-wrap; /* Wrap lines */
	border: none; /* Remove border */
	background-color: #f8f8f8; /* Very light gray background */
	resize: none; /* Disable resizing */
}
textarea:focus {
	outline: none; /* Remove focus outline, consider adding alternative focus style */
}

</style>
