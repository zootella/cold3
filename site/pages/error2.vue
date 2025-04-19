<script setup>

definePageMeta({layout: 'feed-layout', note: 'on error2'})
//ttd april, you probably won't use feed layout for this error reporting page

let currentError = useError()
log('in error.vue, the current error from useError():', look(currentError))

</script>
<template>

<p>here's the page error2, which can be fancier</p>

</template>
