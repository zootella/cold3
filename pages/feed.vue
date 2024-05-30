<script setup>

import { postDatabase } from '~/library/library1'

const posts = postDatabase.chronology

</script>
<template>

<NavigationComponent note="on feed" />
<PostComponent
	v-for="post in posts" 
	:key="post.tag"
	:post="post"
	:isStandalone="false"
	:postAbove="null"
	:postBelow="null"
/>

</template>
