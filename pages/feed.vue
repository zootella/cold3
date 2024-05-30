<script setup>

import { log, inspect } from '~/library/library0'
import { postDatabase } from '~/library/library1'

const instance = getCurrentInstance()

const posts = postDatabase.chronology

</script>
<template>

<NavigationComponent note="on feed" />
<PostComponent
	v-for="post in posts" 
	:key="post.tag"
	:ref="post.tag"
	:post="post"
	:isStandalone="false"
	:postAbove="null"
	:postBelow="null"
/>

</template>
