<script setup>//./components/NotificationList.vue

import {
sayPlural,
} from 'icarus'
const pageStore = usePageStore()

</script>
<template>
<div v-if="pageStore.notifications.length" class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NotificationList</i></p>

<div v-for="element in pageStore.notifications" :key="element.tag">
	<NotificationComponent :notification="element" />
</div>

</div>
</template>
