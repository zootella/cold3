<script setup>

/*
on the error trail: error3 landing page

a catcher (today: the oauth endpoint) sealed an error that arrived outside our normal page/fetchWorker flow into an
Error3. envelope and redirected the browser here. we post it to /error3, whose toss logs it to Datadog and blows up
error.vue — surfacing it the same way every other fatal error is. (error3.js has the full picture.)
*/

const route = useRoute()

let envelope = route.query.envelope
checkText(envelope)

await fetchWorker('/error3', 'Error3.', {envelope})

</script>
<template>
</template>
