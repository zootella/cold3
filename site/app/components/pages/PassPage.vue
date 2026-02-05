<script setup>

function generateAll() {
	const quantity = 200
	let s = ''
	for (let i = 0; i < quantity; i++) s += generateOne() + ', '
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
