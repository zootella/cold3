<script setup>//./components/TopBar.vue

const mainStore = useMainStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<NotificationList v-show="mainStore.notifications.length" />
<CodeEnterList    v-show="mainStore.codes.length"         />

</template>
