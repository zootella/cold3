<script setup>

import { useRoute } from 'vue-router'
import {
log, cutLast,
checkTag, postDatabase
} from '@/library/grand.js'

const route = useRoute()
let c = cutLast(route.params.more, '-')
let t = c.found ? c.after : c.before
checkTag(t)
let post = postDatabase.lookup[t]

//find the 0+ index of this post in the array postDatabase.chronology
let index = -1;
for (let i = 0; i < postDatabase.chronology.length; i++) {
	let p = postDatabase.chronology[i]
	if (p.tag == t) {
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

<NavigationComponent note="on post" />
<PostComponent
	:key="post.tag"
	:post="post"
	:isStandalone="true"
	:postAbove="above"
	:postBelow="below"
/>

</template>
