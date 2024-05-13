<script setup>

import { ref, reactive, watch } from 'vue'
import { see, log } from '~/library/library0'




let d = reactive({
	g1: '',
	g2: ''
})

/*
watch(d, (newD, oldD) => {
	log('watching d got something')
})
*/

function getMeasurements() {
	log('clicked get measurements', d.g2)
}

</script>
<template>

<div>
	<p>this is the chat component</p>
	<p>
		g1 <input type="text" v-model="d.g1" /><br>
		g2 <input type="text" v-model="d.g2" /><button @click="getMeasurements">get measurements</button>
	</p>
</div>

</template>
<style scoped>
</style>
