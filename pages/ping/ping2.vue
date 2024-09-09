<script setup>

import { pingEnvironment } from '@/library/ping.js'
import { log } from '@/library/library0.js'
import { Tag } from '@/library/library1.js'
import { senseEnvironment } from '@/library/ping.js'
import { actualLogflareLog } from '@/library/cloud2.js'

let note = `page ${pingEnvironment()}, ping2done`


note += `${senseEnvironment()};`
await actualLogflareLog(Tag() + ' ' + note)










</script>
<template>

<div>
<p>ping2: script setup says: {{ note }}</p>
</div>

</template>
