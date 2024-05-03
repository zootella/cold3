<script setup>

import { ref, watch, onMounted } from 'vue'
import { unique } from "~/library/library1";//nuxt makes tilde project root
import { see, log } from "~/library/library0";//nuxt makes tilde project root

const note = ref('')
const browserTag = ref('')

//watch for changes to the note and save them to local storage
watch(note, (s) => {
	localStorage.setItem('localNote', s)
})

//load a note from local storage after the component mounts
onMounted(() => {
	note.value = localStorage.getItem('localNote') || ''

	//also, create or get the browser id
	let alreadySaved = localStorage.getItem('browserTag')
	console.log(typeof alreadySaved)
	console.log(alreadySaved)
	console.log('^ type and value of already saved')

	if (!alreadySaved) {
		let tag = unique()
		console.log('picked new tag ' + tag)
		browserTag.value = tag
		localStorage.setItem('localNote', tag)
	}

	//you'll probably move browserTag into pinia so all the components can get to it

});

</script>
<template>

<div>
	<p>
		Note saved in local storage:
		<input v-model="note" style="width: 30em;" />
	</p>
	<p>
		browserTag: <i>{{ browserTag }}</i>
	</p>
</div>

</template>
<style scoped>
</style>
