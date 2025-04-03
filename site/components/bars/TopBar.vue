<script setup>//./components/TopBar.vue

import {
log, look, Now,
} from 'icarus'
import {ref} from 'vue'
const helloStore = useHelloStore()

//top bar, always there, holds stuff that might appear

/*
ok, from hello2, we want to know, are there codes for us?
and if there are, then we v-if up 
*/

</script>
<template>

<CodeEnterList v-show="helloStore.codes" />

</template>
