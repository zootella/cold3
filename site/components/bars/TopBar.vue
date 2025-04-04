<script setup>//./components/TopBar.vue

import {
log, look, Now,
} from 'icarus'
import {ref} from 'vue'
const codeStore = useCodeStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<CodeEnterList v-show="codeStore.visibleCodes.length" />

</template>
