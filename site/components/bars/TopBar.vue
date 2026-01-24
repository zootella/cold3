<script setup>

const mainStore = useMainStore()
const pageStore = usePageStore()

//top bar, always there, holds stuff that might appear

</script>
<template>

<NotificationList />
<OtpEnterList />
<CodeEnterList v-show="mainStore.codes.length" />

</template>
