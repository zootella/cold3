<script setup>//./components/BottomBar.vue

const pageStore = usePageStore()

</script>
<template>

<TurnstileComponent v-if="pageStore.renderTurnstileWidget" class="w-full text-center" />

</template>
