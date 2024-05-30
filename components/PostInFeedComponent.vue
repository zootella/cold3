<script setup>
/*
here in PostInFeedComponent.vue, are the tasks:
-render a single post according to the given props
*/

import { ref } from 'vue'
import { log, inspect, cutLast, sayWhenPage, sayWhenFeed } from '~/library/library0'
import { postDatabase } from '~/library/library1'

const props = defineProps(['post', 'isStandalone', 'postAbove', 'postBelow'])

</script>
<template>

<div class="post-container">
	<h2>post {{ post.order }} of {{ post.quantity }}</h2>
	<p>{{ sayWhenPage(post.tick) }}</p>
	<p>tag <i>{{ post.tag }}</i>, tick <i>{{ post.tick }}</i></p>
	<p>
		<NuxtLink :to="'/post/' + postAbove?.tag" v-if="postAbove">{{'< '}}More Recent</NuxtLink>
		<span v-else>(most recent post)</span>
		{{' | '}}
		<NuxtLink :to="'/post/' + post.tag">Permalink</NuxtLink>
		{{' | '}}
		<NuxtLink :to="'/post/' + postBelow?.tag" v-if="postBelow">Earlier{{' >'}}</NuxtLink>
		<span v-else>(first post ever)</span>
	</p>
	<p><i>(post in feed component)</i></p>
</div>

</template>
<style scoped>

.post-container {
	height: 300px; /* Fixed height of 200px */
	background-color: #eee; /* Light gray background */
	border: 4px dashed #bbb; /* Thick dashed border */
	padding: 20px;
}

</style>
