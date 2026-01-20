<script setup>
/*
ProfilePage.vue - displays user profile information

Shows: user tag, three name forms (f0, f1, f2)
Parent: render <ProfilePage />, no props needed; uses renderStore.current for data
Server contact: assumes renderStore.load() was already called by the page
*/

const renderStore = useRenderStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>ProfilePage</i></p>

<template v-if="renderStore.current">
	<p class="my-space">
		user tag <code>{{ renderStore.current.userTag }}</code>
	</p>
	<p class="my-space">
		name
		f0 <code>{{ renderStore.current.f0 }}</code>,
		f1 <code>{{ renderStore.current.f1 }}</code>,
		f2 <code>{{ renderStore.current.f2 }}</code>
	</p>
</template>
<template v-else>
	<p>No user signed up with this name.</p>
</template>

</div>
</template>
<style scoped>

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
