<script setup>//open graph social share card for a user, at the root of their profile page

defineProps({
	title: String,
	sticker: String,
})

</script>
<template>

<div :style="{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: '60px', backgroundColor: 'white', color: '#111', fontFamily: 'Inter, sans-serif', border: '1px solid #ccc'}">
	<div :style="{fontSize: '72px', fontWeight: 400, lineHeight: 1.1}">{{ title }}</div>
	<div :style="{fontSize: '34px', fontWeight: 700, marginTop: '24px', color: '#888'}">ProfileCard on {{ sticker }}</div>
</div>

</template>
