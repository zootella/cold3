<script setup>

defineProps({note: String})

</script>
<template>

<div>
	<p>
		<NuxtLink to="/">index</NuxtLink>{{' - '}}
		<NuxtLink to="/ping/test">test</NuxtLink>{{' '}}
		<NuxtLink to="/door">door</NuxtLink>{{' '}}
		<NuxtLink to="/account">account</NuxtLink>{{' '}}
		<NuxtLink to="/password">password</NuxtLink>{{' '}}
		<NuxtLink to="/chat">chat</NuxtLink>{{' '}}
		<NuxtLink to="/count">count</NuxtLink>{{' '}}
		<NuxtLink to="/page1">page1</NuxtLink>{{' '}}
		<NuxtLink to="/page2">page2</NuxtLink>{{' '}}
		<NuxtLink to="/pass">pass</NuxtLink>{{' - '}}
		<NuxtLink to="/feed">feed</NuxtLink>{{' '}}
		<NuxtLink to="/feed2">feed2</NuxtLink>{{' '}}
		<NuxtLink to="/post/Fouv7hYGoytFMpU8JF0Fp">post</NuxtLink>{{' '}}
		<NuxtLink to="/post/NR0vIdQZAwnEjhCZWe1ca">first</NuxtLink>{{' - '}}
		<NuxtLink to="/log">log</NuxtLink>{{' '}}
		<i>{{ note }}, v2024sep18a</i>
	</p>
</div>

</template>
<style scoped>
</style>
