<script setup>

import { log, look, cutLast, sayWhenPage, sayWhenFeed } from '../library/library0.js'
import { postDatabase } from '../library/library1.js'

let props = defineProps(['post', 'isStandalone', 'postAbove', 'postBelow'])

let assignedElement = ref()

function myFunction(e) {
	assignedElement.value = e//save the dom element reference for later, not sure if we have to save it in a reactive variable or not
//	console.log(e.getBoundingClientRect())//use it to find out where we are on the page
}

</script>
<template>

<div class="post-class" :ref="myFunction">
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
</div>

</template>
<style scoped>

.post-class {
	height: 250px; /* Fixed height of 200px */
	background-color: #eee; /* Light gray background */
	border: 4px dashed #bbb; /* Thick dashed border */
	padding: 20px;
}

</style>
