<script setup>

definePageMeta({layout: 'feed-layout', note: 'on test'})

import {Sticker, runTests} from 'icarus'

/* tiny tests run six places:
-> ./pages/ping/test.vue      nuxt page, server and client rendered
-- ./server/api/ping/test.js  nuxt api
-- ./net23/src/test.js        lambda
-- ./icarus/icarus.vue        vite
-- ./test.js                  node
*/

/*
TODO note to remove tests from production
does including tiny tests in nuxt mean the whole bundle, even in production, is unnecessarily larger?
you may want to comment this out at the end
there's also process.env.NODE_ENV != 'production'
*/

//run tests for page, will run on server and then client as part of hybrid rendering
let note = `script setup says: ${(await runTests()).message}, ${Sticker().all}`

//run tests a third time, by fetching a server api endpoint, will run on server
let {data, error} = await useFetch('/api/ping/test', {method: 'POST'})

</script>
<template>
<div>
<code>
<a href="ping5">&lt;Prev</a> Next&gt;

test: {{ note }}; {{ data.note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
