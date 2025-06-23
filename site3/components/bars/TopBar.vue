<script setup>//./components/TopBar.vue

const mainStore = useMainStore()
const pageStore = usePageStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<NotificationList v-show="pageStore.notifications.length" />
<CodeEnterList    v-show="mainStore.codes.length"         />

</template>
