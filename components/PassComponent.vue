<script setup>

//import { log } from '~/library/library0'
import { customAlphabet } from 'nanoid'

const generator1 = customAlphabet('abcdefghijklmnopqrstuvwxyz', 4)
const generator2 = customAlphabet('0123456789', 4)
function generateSingle() {
	let s = generator1() + generator2()
	let s2 = s.charAt(0).toUpperCase() + s.slice(1);
	return s2
}

function generateAll() {
	const quantity = 200
	let s = ''
	for (var i = 0; i < quantity; i++) s += generateSingle() + ', '
	return s + " all generated locally"
}
let output = generateAll()

</script>
<template>
<div>

<p>{{ output }}</p>

</div>
</template>
<style scoped>


</style>
