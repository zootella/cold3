<script setup>

import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { cutLast, sayWhenPage, sayWhenFeed } from '~/library/library0'
import { checkTag, postDatabase } from '~/library/library1'

const route = useRoute()
let c = cutLast(route.params.id, '-')
let tag = c.found ? c.after : c.before
checkTag(tag)
let post = postDatabase.lookup[tag]

//find the 0+ index of this post in the array postDatabase.chronology
let index = -1;
for (let i = 0; i < postDatabase.chronology.length; i++) {
	let p = postDatabase.chronology[i]
	if (p.tag == tag) {
		index = i
		break
	}
}

//point to the posts that, on a feed, would render above and below
let above, below
if (index > 0) above = postDatabase.chronology[index-1]
if (index < postDatabase.chronology.length - 1) below = postDatabase.chronology[index+1]





</script>
<template>

<div>

<div class="post-container">

<h2>post {{ post.post }} of {{ post.quantity }}</h2>
<p>{{ sayWhenPage(post.tick) }}</p>
<p>tag <i>{{ post.tag }}</i>, tick <i>{{ post.tick }}</i></p>

<p>
	<NuxtLink :to="'/post/' + above?.tag" v-if="above">{{'< '}}More Recent</NuxtLink>
	<span v-else>(most recent post)</span>
	{{' | '}}
	<NuxtLink :to="'/post/' + tag">Permalink</NuxtLink>
	{{' | '}}
	<NuxtLink :to="'/post/' + below?.tag" v-if="below">Earlier{{' >'}}</NuxtLink>
	<span v-else>(first post ever)</span>
</p>

</div>

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
