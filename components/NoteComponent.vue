<script setup>

import { ref, watch, onMounted } from 'vue'

const note = ref('')

//watch for changes to the note and save them to local storage
watch(note, (s) => {
	localStorage.setItem('localNote', s)
})

//load a note from local storage after the component mounts
onMounted(() => {
	note.value = localStorage.getItem('localNote') || ''
});

</script>
<template>

<div>
	<p>
		Note saved in local storage:
		<input v-model="note" style="width: 30em;" />
	</p>
</div>

</template>
<style scoped>
</style>
