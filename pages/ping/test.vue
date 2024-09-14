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
