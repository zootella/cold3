<script setup>

import { ref } from 'vue'
import { fun6 } from './library6'
import { fun7 } from '../library/library7'

let count = ref(0)

console.log('hi in icarus script setup')
console.log(fun6())
console.log(fun7())

</script>
<template>

<h1>hello icarus</h1>

<div class="card">
	<button type="button" @click="count++">count is {{ count }}</button>
	<p>Edit <code>components/HelloWorld.vue</code> to test HMR</p>
</div>

</template>
