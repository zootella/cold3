<script setup>//components/OldButton.vue
/*
use like:
<OldButton @click="myFunction">Submit</OldButton>

looks like a button; runs a function
use when this isn't the last step in a form, but we want to make the user feel like they're submitting something
*/

const emit = defineEmits(['click'])

</script>
<template>

<button class="pushy" @click="$emit('click')"><slot /></button>

</template>
