<script setup>//./components/TopBar.vue

const helloStore = useHelloStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<NotificationList v-show="helloStore.notifications.length" />
<CodeEnterList    v-show="helloStore.codes.length"         />

</template>
