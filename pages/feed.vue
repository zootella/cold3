<script setup>
/*
here in feed.vue, are the tasks:
-render the list of posts
*/

import { postDatabase } from '~/library/library1'

const posts = postDatabase.chronology

</script>
<template>

<NavigationComponent note="on feed" />
<PostInFeedComponent
	v-for="post in posts" 
	:key="post.tag"
	:post="post"
	:isStandalone="false"
	:postAbove="null"
	:postBelow="null"
/>

</template>
