<script setup>

import { Time, log, inspect } from '~/library/library0'
import { postDatabase } from '~/library/library1'

//const instance = getCurrentInstance()
const posts = postDatabase.chronology


let statusMessage = ref('')




/*
current above/below/on, and smallest delay between hits
and test on both mobile platforms, every browser!
*/

function measure() {
	if (!(window && document)) return//todo, figure out how to guard this better

	let divs = document.querySelectorAll('.post-class')
	let countAbove = 0, countBelow = 0, countWithin = 0//within means entirely or partially visible
	for (let div of divs) {
		let rect = div.getBoundingClientRect()

		if (rect.bottom < 0) countAbove++
		else if (rect.top > window.innerHeight) countBelow++
		else countWithin++
	}
	statusMessage.value = `${countAbove} above, ${countWithin} within, ${countBelow} below`
}




/*


factory settings are how many posts, like 40
and how many a tip too small are, like /4=10

but obviously make sure there's no way that it creates an oscillation where once the infinity happens, it needs to immediately take action again

plan out the algorithm on paper!
there could be very few posts,
very short posts,
a very very tall computer monitor, etc

keep /feed and /infinity separate



*/







onMounted(() => {
	window.addEventListener('scroll', bounce1)
	window.addEventListener('resize', bounce1)
	measure()
})
onUnmounted(() => {
	window.removeEventListener('scroll', bounce1)
	window.removeEventListener('resize', bounce1)
})

const delay = 20*Time.millisecond//surely scroll events won't happen faster than 1000/60=16 frames? maybe don't need
let timer = null
function bounce1() {//called every time there's a scroll event; can be frequently!
	if (!timer) timer = setTimeout(bounce2, delay)
}
function bounce2() {//runs 100ms after the start of any group of scroll events
	clearTimeout(timer); timer = null
	measure()
}




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
<!--
	ref="postReferenceValue"
-->
<div class="floating-status">{{ statusMessage }}</div>

</template>
<style scoped>

.floating-status {
    position: fixed;
    bottom: 24px;
    left: 24px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    z-index: 1000;
    font-family: monospace;
    font-size: 1.5em;
}

</style>
