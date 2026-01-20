<script setup> definePageMeta({layout: 'column-layout', note: 'on post'})

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
const user = await renderStore.getUser(route.params.part1)
if (!user && import.meta.server) setResponseStatus(useRequestEvent(), 404)

if (import.meta.client) useRouteCorrection({user})

</script>
<template>

<PostPage v-if="user" :user="user" :postId="route.params.part2" />
<p v-else>not found</p>

</template>
