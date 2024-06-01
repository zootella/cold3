<style scoped>
</style>
<template>

<NavigationComponent note="on feed2" />
<PostComponent
	v-for="post in visiblePosts" 
	:key="post.tag"
	:post="post"
	:isStandalone="false"
	:postAbove="null"
	:postBelow="null"
/>

</template>
<script setup>

import { log, inspect, now, Time, sameObject } from '~/library/library0'
import { generatePosts } from '~/library/library1'

//factory settings for infinite scroll, counts of posts:
const bowlful  = 100//bring posts in another bowlful at a time
const redline  =  20//add more when we're this close to the edge
const horizon  = 140//remove posts beyond this horizon to save memory
//times in milliseconds:
const cooldown = 4*Time.second//remove distant posts after a long quiet period
const interval = 100*Time.millisecond//check the temprature this frequently

//notice when something changes that could affect the infinite scroll
let observer//save reference to put away
onMounted(() => {
	window.addEventListener('scroll', changed)//the user scrolled
	window.addEventListener('resize', changed)//the user turned their phone
	observer = new ResizeObserver(changed)//content loading made the page longer
	observer.observe(document.documentElement)//watch the root html tag, this is above the body tag

	changed()//also run once at the very start
})
onUnmounted(() => {
	window.removeEventListener('scroll', changed)
	window.removeEventListener('resize', changed)
	observer.disconnect()
})

let recently, timer
function changed() {
	recently = now()//keeps getting overwritten with the time when the most recent change happened
	if (!timer) timer = setInterval(warm, interval)//if not already running, make the timer to notice when things have cooled down

	infiniteGrow()
}
function warm() {//called every 1/10th a second during and after a dense patch of changes
	if (timer && (now() > (recently + cooldown))) {//we've waited long enough
		clearInterval(timer); timer = null//put away for next time

		infiniteShrink()
	}
}

let allPosts = generatePosts(500)//all the posts the page could show
let visiblePosts = ref([])//the slice the page is showing
let visibleSlice//visiblePosts was sliced from i through j in allPosts

function infiniteGrow() {//immediately and frequently, perform steps for a recent change
	let m = measure()//count how many posts are above, within, and below the

	if (visibleSlice) {

		let i = visibleSlice.i
		let j = visibleSlice.j

		if (m.below < redline) { j += bowlful }//far too few below, add many more below
		if (m.above < redline) { i -= bowlful }//far too few above, add many more above

		reslice({i, j})

	} else {
		reslice()
	}
}
function infiniteShrink() {//afterwards and once, perform steps for scrolling has cooled off
	let m = measure()
	log('...❄️')//if shrinking creates an event, wouldn't this start an infinite loop?
}

function measure() {

	let divs = document.querySelectorAll('.post-class')
	let above = 0, below = 0, within = 0//within means entirely or partially visible
	for (let div of divs) {
		let rect = div.getBoundingClientRect()

		if (rect.bottom < 0) above++
		else if (rect.top > window.innerHeight) below++
		else within++
	}
	return {above, within, below}
}
function reslice(suggestedSlice) {

	//first, check and adjust the inputs
	if (!suggestedSlice) suggestedSlice = {i: 0, j: bowlful}
	if (suggestedSlice.i < 0) { suggestedSlice.i = 0 }
	if (suggestedSlice.j - suggestedSlice.i < bowlful) { suggestedSlice.j = suggestedSlice.i + bowlful }
	if (suggestedSlice.j > allPosts.length) { suggestedSlice.j = allPosts.length }

	if (!visibleSlice || !sameObject(visibleSlice, suggestedSlice)) {//determine if this would actually change anything
		visibleSlice = suggestedSlice
		visiblePosts.value = allPosts.slice(visibleSlice.i, visibleSlice.j)
		log(`resliced to ${visibleSlice.i},${visibleSlice.j}`)
	}
}

/*
plan out the algorithm on paper!
there could be very few posts,
very short posts,
a very very tall computer monitor, etc

watch out for oscillations!
*/




</script>
