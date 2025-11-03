<script setup>//components/LinkButton.vue
/*
use like:
<LinkButton @click="myFunction">{{'<'}} Back</LinkButton>

looks like a link; runs a function
under the hood, uses <button> to keep clear of making a mess with the browser's navigation and history
*/

//ttd april2025, you called this just Link and it dodn't work, and didn't produce an error, so find otu why, and maybe choose different names for this set, like MyButton, MyLink, MyNavigate

const emit = defineEmits(['click'])

</script>
<template>

<button class="linky" @click="$emit('click')"><slot /></button>

</template>
