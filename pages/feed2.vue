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

//factory settings for infinite scroll
const _infinite = {

	//counts of posts
	bowlful: 100,//start with one bowlful of posts and add more a bowl at a time
	redline:  20,//fewer than this beyond the leading fold? add more! 
	horizon: 140,//remove posts beyond this number to save memory

	//times in milliseconds
	cooldown: 4*Time.second,//wait this long with nothing changing before removing posts
	interval: 100*Time.millisecond//how frequently we watch the clock to reach the cooldown interval
}

//notice when something changes that could affect the infinite scroll
let resizeObserver//save reference to put away
onMounted(() => {
	window.addEventListener('scroll', onChange)//the user scrolled
	window.addEventListener('resize', onChange)//the user turned their phone
	resizeObserver = new ResizeObserver(onChange)//content loading made the page longer
	resizeObserver.observe(document.documentElement)//watch the root html tag, this is above the body tag

	onChange()//also run once at the very start
})
onUnmounted(() => {
	window.removeEventListener('scroll', onChange)
	window.removeEventListener('resize', onChange)
	resizeObserver.disconnect()
})

let onChangeTick, afterChangeTimer
function onChange() {
	onChangeTick = now()//keeps getting overwritten with the time when the most recent change happened
	if (!afterChangeTimer) afterChangeTimer = setInterval(afterChange, _infinite.interval)//if not already running, make the timer to notice when things have cooled down

	infiniteGrow()
}
function afterChange() {//called every 1/10th a second during and after a dense patch of changes
	if (afterChangeTimer && (now() > (onChangeTick + _infinite.cooldown))) {//we've waited long enough
		clearInterval(afterChangeTimer); afterChangeTimer = null//put away for next time

		infiniteShrink()
	}
}

let allPosts = generatePosts(500)//all the posts the page could show
let visiblePosts = ref([])//the slice the page is showing
let visibleSlice//visiblePosts was sliced from i through j in allPosts

function infiniteGrow() {//immediately and frequently, perform steps for a recent change
	if (!visibleSlice) { slicePosts(); return }//first time after mounted

	let m = scanPosts()//count how many posts are above, within, and below the fold
	let suggestedSlice = { i: visibleSlice.i, j: visibleSlice.j }//make a copy to edit
	if (m.above < _infinite.redline) suggestedSlice.i -= _infinite.bowlful//too few above, add more
	if (m.below < _infinite.redline) suggestedSlice.j += _infinite.bowlful//too few below, add more
	slicePosts(suggestedSlice)
}
function infiniteShrink() {//afterwards and once, perform steps for scrolling has cooled off
	log('...❄️')//if shrinking creates an event, wouldn't this start an infinite loop?

	let m = scanPosts()
	let suggestedSlice = { i: visibleSlice.i, j: visibleSlice.j }//make a copy to edit
	if (m.above > _infinite.horizon) suggestedSlice.i = visibleSlice.i + m.above - _infinite.horizon//too many above, trim to horizon
	if (m.below > _infinite.horizon) suggestedSlice.j = visibleSlice.j - m.below + _infinite.horizon//too many below, trim to horizon
	slicePosts(suggestedSlice)
}

function scanPosts() {
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
function slicePosts(suggestedSlice) {

	//first, check and adjust the inputs
	if (!suggestedSlice) suggestedSlice = {i: 0, j: _infinite.bowlful}
	if (suggestedSlice.i < 0) { suggestedSlice.i = 0 }
	if (suggestedSlice.j - suggestedSlice.i < _infinite.bowlful) { suggestedSlice.j = suggestedSlice.i + _infinite.bowlful }
	if (suggestedSlice.j > allPosts.length) { suggestedSlice.j = allPosts.length }

	//determine if this would actually change anything
	if (!visibleSlice || !sameObject(visibleSlice, suggestedSlice)) {

		visibleSlice = suggestedSlice
		visiblePosts.value = allPosts.slice(visibleSlice.i, visibleSlice.j)
		log(`sliced to ${visibleSlice.i},${visibleSlice.j}`)
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
