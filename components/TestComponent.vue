<script setup>



import { ref, reactive, onMounted } from "vue";



const logContents = ref("");


logContents.value = "v 2024mar2c";









//tiny log and toss
function log(...a) {
	a.forEach(e => console.log(e));
}
function logError(note, watch) {
	var description = "[LOG ERROR] " + note + _describe(watch);
	console.error(description);
	if (watch) console.error(watch);
}
function toss(note, watch) {
	var description = "[TOSS] " + note + _describe(watch);
	console.error(description);
	if (watch) console.error(watch);
	throw new Error(description);
}
function _describe(watch) {
	var s = "";//TODO here's where you'd put in the timestamp prefix if you add that
	if (watch)
		for (var k in watch)
			s += `\r\n-- ${k} (${typeof watch[k]}) ${JSON.stringify(watch[k])}`;
	return s;
}
//exporty({log, logError, toss});






//tiny tests
var tests = [];
var assertionsPassed, assertionsFailed, testsThrew;
function test(f) {
	tests.push(f);
}
function ok(assertion) {
	if (assertion) {
		assertionsPassed++;
	} else {
		assertionsFailed++;
		console.error("Test not ok, second line number expanded below:");
	}
}
function runTests() {
	var g = String.fromCodePoint(0x2705);  // Green check emoji
	var r = String.fromCodePoint(0x274C);  // Red X
	var a = String.fromCodePoint(0x1F815); // Up arrow

	assertionsPassed = 0;
	assertionsFailed = 0;
	testsThrew = 0;
	for (var i = 0; i < tests.length; i++) {
		try { tests[i](); } catch (e) { testsThrew++; console.error(e); }
	}
	if (assertionsFailed || testsThrew) {
		console.error(`${r} ${a}${a}${a} Tests failed ${a}${a}${a} ${r}`);
	} else {
		console.log(`${g} ${assertionsPassed} assertions in ${tests.length} tests all passed ${g}`);
	}
}
//exporty({test, ok, runTests});
/*
TODO you forgot to add done:

test((ok, done) => {
	ok(true);
	done();
});
*/

var noop = (function(){});
//exporty({noop});





function myLength(s) {
	return s.length;
}
test(() => {
	ok(myLength("") ==  0);
	ok(myLength("hi") == 2);
});






runTests();










</script>
<template>
<div>

<div><p><textarea readOnly :value="logContents"></textarea></p></div>


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
