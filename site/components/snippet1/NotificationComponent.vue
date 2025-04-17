<script setup>//./components/NotificationComponent.vue

import {
} from 'icarus'
const helloStore = useHelloStore()

const props = defineProps({
	item: {type: Object, required: true},
})

function divClick() {
  helloStore.removeNotification(props.item.tag)
}
</script>
<template>
<div class="border border-gray-300 p-2" @click="divClick">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>NotificationComponent</i></p>

<p>{{item.message}}</p>

</div>
</template>
