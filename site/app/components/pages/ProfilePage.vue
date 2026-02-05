<script setup>//profile component of a user that is probably not the same as the one signed in!

/*
notes in render.txt about:
pages/[part1]/index.vue    ->  ProfilePage.vue
pages/[part1]/[part2].vue  ->  PostPage.vue

and how those four use:
stores/renderStore.js
server/api/render.js
composables/useRouteCorrection.js

find these files together by searching "render stack"
*/

const props = defineProps({
	user: {type: Object, default: null},
})

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>ProfilePage</i></p>

<template v-if="user">
	<p class="my-space">
		user tag <code>{{ user.userTag }}</code>
	</p>
	<p class="my-space">
		name
		f0 <code>{{ user.name.f0 }}</code>,
		f1 <code>{{ user.name.f1 }}</code>,
		f2 <code>{{ user.name.f2 }}</code>
	</p>
</template>
<template v-else>
	<p>No user signed up with this name.</p>
</template>

</div>
</template>
<style scoped>
@reference "tailwindcss";

.my-space {
	@apply flex flex-wrap items-baseline gap-2;
}

</style>
