<script setup>

import { sticker } from '@/library/sticker.js'

let note = `script setup says: ${sticker().all}, ping2done`

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
