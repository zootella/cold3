<script setup>

function generateAll() {
	let s = ''
	for (let i = 0; i < 100; i++) s += generateOne() + ', '
	for (let i = 0; i < 20; i++) s += Tag() + ', '
	return s + ' all generated locally'
}
function generateOne() {
	return roll(_a).toUpperCase() + roll(_a) + roll(_a) + roll(_a) + roll(_0) + roll(_0) + roll(_0) + roll(_0)
}
const _a = 'abcdefghijklmnopqrstuvwxyz'
const _0 = '0123456789'
function roll(alphabet) {
	return alphabet.charAt(Math.floor(Math.random() * alphabet.length))
}
let output = generateAll()

</script>
<template>
<div>

<p>{{output}}</p>

</div>
</template>
