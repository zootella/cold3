<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

</script>
<template>

<p>This is cold3.cc, Nuxt on Cloudflare.</p>

<HitComponent />

<ColdComponent />

</template>
