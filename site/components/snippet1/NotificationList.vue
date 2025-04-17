<script setup>//./components/NotificationList.vue

import {
sayPlural,
} from 'icarus'
const helloStore = useHelloStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NotificationList</i></p>

<div v-for="item in helloStore.notifications" :key="item.tag">
	<NotificationComponent :item="item" />
</div>

</div>
</template>
