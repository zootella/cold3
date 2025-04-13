<script setup>//./components/TopBar.vue

import {ref} from 'vue'
const helloStore = useHelloStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<CodeEnterList v-show="helloStore.codes.length" />

</template>
