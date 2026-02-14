<script setup> definePageMeta({layout: 'blank-layout'})//on the oauth trail: Nuxt page to receive envelope

/*
the user has finished the oauth dance on the sveltekit site, and now it's redirected the browser here to deliver the results
note that this is written the normal universal pattern, but we expect this will always render on the server
*/

//get the encrypted envelope from the query string of the url
const route = useRoute()
let envelope = route.query.envelope
checkText(envelope)

//tell the oauth endpoint that we've got this message about the user returning with proof
let task = await fetchWorker('/oauth', 'OauthDone.', {envelope})
//ttd november, move the user's oauth state into the upcoming credential store; then fetch calls like above will live there
//navigateTo in SSR returns a 302, rebooting the tab, so the destination page will fetch oauth status again, but that's fine
log('hi from oauth2.vue after posting the envelope', look({task}))

//navigate to the route that's correct for what the user just did by proving oauth, like maybe home, or dashboard, or welcome new user
await navigateTo(task.route, {replace: true})//keep this url out of browser history, so back goes to before it, not here; also, calling navigateTo during server render will set response headers for a 302 redirect, so this will reboot the tab, but that's ok

</script>
<template>
</template>
