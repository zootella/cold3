<script setup>//./components/BottomBar.vue

const turnstileStore = useTurnstileStore()

</script>
<template>

<TurnstileComponent v-if="turnstileStore.renderWidget" class="w-full text-center" />

</template>
