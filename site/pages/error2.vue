<script setup>

definePageMeta({layout: 'feed-layout', note: 'on error2'})
//ttd april, you probably won't use feed layout for this error reporting page

let currentError = useError()
log('in error.vue, the current error from useError():', look(currentError))


/*
error.vue - nuxt's default error component, which we keep simple, and not automatic
pages/error2.vue - a regular page, which can be fancy

so the idea here is you use turnstile to POST complete error details to an error logging endpoint
and then tell the user to refresh to start over

note that the click from error.vue can't be automatic, as that could cause an infinite loop!

*/

</script>
<template>

<p>here's the page error2, which can be fancier</p>

</template>
