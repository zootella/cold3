<script setup>

import { pingEnvironment } from '@/library/ping.js'

/* tiny tests run four places:
-> ./pages/ping/test.vue  nuxt
-- ./net23/src/test.js    lambda
-- ./icarus/icarus.vue    vite
-- ./test.js              node
*/
import { runTests } from '../library/library0.js'
import '../library/library1.js'
import '../library/library2.js'
import '../library/door.js'
import '../library/door2.js'
import '../library/database.js'
import '../library/cloud.js'
import '../library/cloud2.js'

let note = `script setup says: ${(await runTests()).message}, ${pingEnvironment()}`
/*
TODO
so tiny tests run four places, but really the nuxt one should be expanded to three:
page server rendered, page client rendered, and server api
and you could do this pretty easily,
except the only decent way you've found to see page server rendered is curl > saved.html
because hybrid rendering is all about not letting you see or save the first part

also, does including tiny tests in nuxt mean the whole bundle, even in production, is unnecessarily larger?
you may want to comment this out at the end
there's also process.env.NODE_ENV != 'production'
*/

</script>
<template>
<div>
<code>

test: {{ note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
