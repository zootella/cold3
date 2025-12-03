<script setup> definePageMeta({layout: 'blank-layout'}) //./pages/oauth2.vue ~ on the oauth trail, nuxt page to get envelope from sveltekit

/*
the user has finished the oauth dance on the sveltekit site, and now it's redirected the browser here to deliver the results
note that this is written the normal universal pattern, but we expect this will always render on the server
*/

//get the encrypted envelope from the query string of the url
const route = useRoute()
let envelope = route.query.envelope
checkText(envelope)

//tell the oauth endpoint that we've got this message about the user returning with proof
let response = await fetchWorker('/api/oauth', {method: 'POST', body: {action: 'OauthDone.', envelope}})

log('hi from oauth2.vue after posting the envelope', look({response}))

//staying within the nuxt spa, click over to the route that's correct, like maybe home, or dashboard, or welcome new user
await navigateTo(response.route, {replace: true})//keep this url out of browser history, so back goes to before it, not here

</script>
<template>
</template>
