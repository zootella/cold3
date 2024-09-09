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

import { log, look, Now, Time, sameObject } from '@/library/library0.js'
import { generatePosts } from '@/library/library1.js'

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
	onChangeTick = Now()//keeps getting overwritten with the time when the most recent change happened
	if (!afterChangeTimer) afterChangeTimer = setInterval(afterChange, _infinite.interval)//if not already running, make the timer to notice when things have cooled down

	infiniteGrow()
}
function afterChange() {//called every 1/10th a second during and after a dense patch of changes
	if (afterChangeTimer && (Now() > (onChangeTick + _infinite.cooldown))) {//we've waited long enough
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

2024jun2
ok, now on day 4, infinite scrolling has become a quagmire
current solution works on desktop, not mobile
on desktop, works, but messes up dragging the scrollbar, which is annoying
on mobile, adding or removing from above the fold doesn't keep the current post in view, and creates an infinite loop of removing posts
popular platforms never remove from the top, instead just adding to the bottom until the tab runs out of memory
it's possible that your components will be so efficient that you could survive the memory issue
possible solutions at this point:

(1) affect the scroll
there are javascript apis to scroll, window.scrollBy(0, -heightDifference) and window.scroll
when adding or removing posts above, you could measure the distance below, add or remove, and then scroll so there's the same distance below
but this could deepen the quagmire
then three things would be scrolling: the user, the browser, and the page!
when you tell vue to affect the post list, it doesn't do it immediately--you've already demonstrated not being able to get a revised total page height right away

(2) posts out of field switch to lightweight divs of the same height
the vue list will have to be of PostOrSpacerComponent components
and then the feed tells them to be a post or a spacer
immediately on scroll, spacers need to become posts
after the 4s cooldown, distant posts can become spacers
it's easy to get to and change properties of individual items in the list:

	<PostOrSpacerComponent
		v-for="post in visiblePosts" 
		:key="post.tag"
		:show="true" ... />

	visiblePosts.value[index].show = false

you still have to pass all the properties Post needs through PostOrSpacer
you're not coding this now, but are confident you could
also, the page can ask the browser how much memory its using with performance.measureUserAgentSpecificMemory().bytes
something you like about this solution is while the desktop scrollbar is wonky going down, it always works to drag it up--dragging all the way up to get the menu may be a frequent user activity

also, you do eventually want a pagination option
probably as a route rather than a setting
so users who want it can find it, while infinite scroll is always the default
*/



</script>
