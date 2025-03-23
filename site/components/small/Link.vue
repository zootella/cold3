<script setup>//components/Link.vue
/*
use like:
<Link @click="myFunction">{{'<'}} Back</Link>

looks like a link; runs a function
under the hood, uses <button> to keep clear of making a mess with the browser's navigation and history
*/

const emit = defineEmits(['click'])

</script>
<template>

<button class="linky" @click="$emit('click')"><slot /></button>

</template>
