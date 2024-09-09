<script setup>

import { pingEnvironment } from '@/library/ping.js'

let note = `script setup says: ${pingEnvironment()}, ping2done`

</script>
<template>

<div>
<p>ping2: {{ note }}</p>
</div>

</template>
