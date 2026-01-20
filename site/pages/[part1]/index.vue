<script setup> definePageMeta({layout: 'column-layout', note: 'on profile'})

/*
notes in render.txt about:
pages/[part1]/index.vue    ->  ProfilePage.vue
pages/[part1]/[part2].vue  ->  PostPage.vue

and how those four use:
stores/renderStore.js
server/api/render.js
composables/useRouteCorrection.js

find these files together by searching "render stack"
*/

const route = useRoute()

const renderStore = useRenderStore()
const user = await renderStore.getUser(route.params.part1)//get information about user1 for route here like https://site.com/user1
if (!user && import.meta.server) setResponseStatus(useRequestEvent(), 404)//if we're rendering this on the server, return the page as we render it, but with the 404 response code in the HTTP headers as a clue to the browser and spiders that this page is not found; this isn't the same thing as when we blow up the page with an error

if (import.meta.client) useRouteCorrection({user})//when the browser runs this on the client, adjust the location bar from a working name to the canonical one, so if the user bookmarks or copies it the link is as correct as possible

</script>
<template>

<ProfilePage v-if="user" :user="user" />
<p v-else>not found</p>

</template>
