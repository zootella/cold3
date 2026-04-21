<script setup>

/*
on the oauth trail *and* on the error trail: Nuxt catcher's mitt for exceptions from SvelteKit (landing page)

if SvelteKit throws during the oauth flow, we turn that into a 303 redirect back here in Nuxt-land
this is how an exception on the SvelteKit side can blow up the page the same way
*/

const route = useRoute()

let envelope = route.query.envelope
checkText(envelope)

await fetchWorker('/error3', 'Error3.', {envelope})

</script>
<template>
</template>
