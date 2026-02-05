<script setup>//component for a user post

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
	postId: {type: String, required: true},
})//instead of ProfilePage and PostPage using renderStore directly, we get the user object from the store as assigned to us by our parent as a property. this is the right pattern for soon when some pages render lists of posts in a feed, for instance, ttd january

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PostPage</i></p>

<template v-if="user">
	<p class="my-space">
		post <code>{{ postId }}</code>
	</p>
	<p class="my-space">
		by user tag <code>{{ user.userTag }}</code>
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
