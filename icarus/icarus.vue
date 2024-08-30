<script setup>

import { ref, onMounted } from 'vue' 

import { runTests, getLogRecord, testBox } from '../library/library0.js'
import '../library/library1.js'
import '../library/library2.js'
import '../library/database.js'
import '../library/cloud.js'
import '../library/cloud2.js'

const boxModel = ref('')
const testMessage = ref('')

onMounted(async () => {
	testMessage.value = await runTests()
})

</script>
<template>

<p class="class1">{{ testMessage }}</p>
<p class="class2a"><input type="text" v-model="boxModel" class="class2" id="box2"/></p>
<p class="class3">{{ testBox(boxModel) }}</p>
<textarea readOnly :value="getLogRecord()" class="class4" id="box4"></textarea>

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