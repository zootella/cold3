<script setup>//./components/BottomBar.vue

const turnstileStore = useTurnstileStore()

</script>
<template>
<div class="bar-container">

<TurnstileComponent v-if="turnstileStore.renderWidget" class="w-full text-center" />

</div>
</template>
