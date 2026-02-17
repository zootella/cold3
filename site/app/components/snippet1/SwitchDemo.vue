<script setup>

const refNotifications = ref(true)
const refMarketing = ref(false)

const computedSummary = computed(() => {
	const a = []
	if (refNotifications.value) a.push('notifications')
	if (refMarketing.value) a.push('marketing')
	return a.length ? a.join(' and ') : 'nothing'
})

</script>
<template>
<div class="border border-gray-300 p-2 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>SwitchDemo</i></p>

<label class="flex items-center gap-2">
	<Switch v-model="refNotifications" />
	<span>Notifications</span>
</label>
<label class="flex items-center gap-2">
	<Switch v-model="refMarketing" />
	<span>Marketing</span>
</label>
<p>You've opted in to {{ computedSummary }}</p>

</div>
</template>
