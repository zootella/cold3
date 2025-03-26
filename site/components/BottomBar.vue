<script setup>//./components/BottomBar.vue

import {
log, look, Now, Limit,
} from 'icarus'
import {ref, onMounted, watch} from 'vue'
const helloStore = useHelloStore()
const turnstileStore = useTurnstileStore()

/*
ok, so here we are in bottom bar
we can use turnstile store
when a post button calls stepRender
we need code to come here, and render TurnstileComponent in our template
*/

</script>
<template>

<TurnstileComponent v-if="turnstileStore.turnstileEnabled" /><!-- most uses of PostButton will set :useTurnstile="false", and no code inside TurnstileComponent will run -->

status bar, which will hold the turnstile component at the bottom of the page, which should be invisible always

</template>
