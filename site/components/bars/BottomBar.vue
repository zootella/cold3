<script setup>//./components/BottomBar.vue

const pageStore = usePageStore()

</script>
<template>
<div class="bar-container">

<TurnstileComponent v-if="pageStore.renderWidget" class="w-full text-center" />

</div>
</template>
