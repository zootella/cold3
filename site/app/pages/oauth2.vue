<script setup> definePageMeta({layout: 'blank-layout'})//on the oauth trail: Nuxt page to receive envelope

/*
the user has finished the oauth dance on the sveltekit site, and now it's redirected the browser here to deliver the results
note that this is written the normal universal pattern, but we expect this will always render on the server
*/

//get the encrypted envelope from the query string of the url
const route = useRoute()
let envelope = route.query.envelope
checkText(envelope)

//hand the return envelope to /credential's OauthDone action — the server opens it (with browserHash check), writes a credential_table row on success, and returns the route for us to navigate to next
const useLegacy = false//flip to true to restore OauthDemo's standalone return flow via the legacy /api/oauth.js endpoint; while true, OauthPanel's return won't write credential rows
let task = await fetchWorker(useLegacy ? '/oauth' : '/credential', 'OauthDone.', {envelope})//deliver envelope3 from the SvelteKit server to the Nuxt server, this is the letter about the conclusion of the user's oauth flow, including proof they control an account with a provider
//ttd november2025, move the user's oauth state into the upcoming credential store; then fetch calls like above will live there
//navigateTo in SSR sets response headers for a redirect (303 per redirectCode below), rebooting the tab, so the destination page will fetch oauth status again, but that's fine
log('hi from oauth2.vue after posting the envelope', look({task}))

//navigate to the route that's correct for what the user just did by proving oauth, like maybe home, or dashboard, or welcome new user
await navigateTo(task.route, {replace: true, redirectCode: 303})//replace: true keeps this url out of browser history, so back goes to before it, not here; redirectCode: 303 because we want "see other: GET this URL" semantics (cleaner than Nuxt's default 302 which is ambiguous about method); server-side navigateTo will reboot the tab, but that's ok

</script>
<template>
</template>
