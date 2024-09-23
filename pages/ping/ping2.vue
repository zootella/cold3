<script setup>

import { seal } from '@/library/ping.js'

let note = `script setup says: ${seal().w3}, ping2done`

</script>
<template>
<div>
<code>
<a href="ping1">&lt;Prev</a> <a href="ping3">Next&gt;</a>

ping2: {{ note }}

</code>
</div>
</template>
<style scoped>

code, a { color: Gray }

</style>
