<script setup>

import { log, inspect, now, Time, sameObject } from '~/library/library0'
import { generatePosts } from '~/library/library1'

const allPosts = window ? generatePosts(10) : []//all the posts in the database
const visibleCapacity = 50//keep this number of posts on the page
const edgeSmall = 10
const edgeBig = 20
const edge = 10

let visiblePosts = ref([])
let visibleSlice
reslice()
function reslice(suggestedSlice) {
	if (!(window && document)) return//todo, figure out how to guard this better

	//first, check and adjust the inputs
	if (!suggestedSlice) suggestedSlice = {i: 0, j: visibleCapacity}
	if (suggestedSlice.i < 0) { suggestedSlice.i = 0 }
	if (suggestedSlice.j - suggestedSlice.i < visibleCapacity) { suggestedSlice.j = suggestedSlice.i + visibleCapacity }
	if (suggestedSlice.j > allPosts.length) { suggestedSlice.j = allPosts.length }

	//would this actually change anything?
	if (visibleSlice && visibleSlice.i == suggestedSlice.i && visibleSlice.j == suggestedSlice.j) return

	visibleSlice = suggestedSlice
	visiblePosts.value = allPosts.slice(visibleSlice.i, visibleSlice.j)
	log(`resliced to ${visibleSlice.i},${visibleSlice.j}`)
}
/*
with capacity 30, 0,30 oscillates with 10,40
same with capacity 40

it might be that when it removes posts, the scroll changes
*/


function measure() {
	if (!(window && document)) return//todo, figure out how to guard this better

	let divs = document.querySelectorAll('.post-class')
	let above = 0, below = 0, within = 0//within means entirely or partially visible
	for (let div of divs) {
		let rect = div.getBoundingClientRect()

		if (rect.bottom < 0) above++
		else if (rect.top > window.innerHeight) below++
		else within++
	}

	let i = visibleSlice.i
	let j = visibleSlice.j


	//scrolling forwards
	if (!below) { j += edge   }//scrolled to the bottom post, add more below
		/*
	if (above > edge)   { i += edge }//far too many above, remove a few above

	//scrolling back
	if (!above < edge) { i -= edge   }//far too few above, add many more above
	if (below > edge)   { j -= edge }//far too many below, remove a few below


/*
	//scrolling forwards
	if (below < edgeSmall) { j += edgeBig   }//far too few below, add many more below
	if (above > edgeBig)   { i += edgeSmall }//far too many above, remove a few above

	//scrolling back
	if (above < edgeSmall) { i -= edgeBig   }//far too few above, add many more above
	if (below > edgeBig)   { j -= edgeSmall }//far too many below, remove a few below
		*/

	reslice({i, j})
}

/*
factory settings are how many posts, like 40
and how many a tip too small are, like /4=10

but obviously make sure there's no way that it creates an oscillation where once the infinity happens, it needs to immediately take action again

plan out the algorithm on paper!
there could be very few posts,
very short posts,
a very very tall computer monitor, etc




ok, this method works on desktop, not on mobile
and there's an oscillation you can't explain, fixed by small and large edges, which you also can't explain
but even when working, if you're on desktop and have a scrollbar, you can't scroll to the top normally
so maybe:
(1) right now for 1.0, do infinite add, no remove
(2) later on, replace posts far above the viewport with empty divs of the same height
but if that optimization works, shouldn't browsers already be doing it?

oh also there's the [load more recent posts] button at the top
actually this could just be a link back to the feed, or a refresh, or something
yeah because maybe the user scrolled back up to the top to find the menu or something
they shouldn't have to reload all unloaded forever



there's also the "when you hit the end" method


it's also possible that your components are efficient enough, as is vue, that you can do grow-only infinite scroll and it works
you'll of course already have the optimization to only play one video at a time (only have one video *player* that moves around!)
and to only show images when they're in the viewport
so then it's just component html and text
ctrl+f



what if it adds on the leading edge immediately
but then removes from the trailing edge only after a timeout
because you're only doing that to save memory, anyway
perhaps this will end the race condition

you still like the load previous when going up so the user can reach the menu

down, close to edge, instantaneous, add lots more below
down, after delay *of no scrolling*, remove lots up top (may steer around the mobile superfast scrolling problem)
any removed up top? have button that says how many, maybe just links or refreshes or reloads
what if that button is pagination, essentially
a back arrow to the start of the feed which was the start of the page
big _1_ _2_ _3_ to pages
so when you scroll down, it's infinite, and moving crap far above to pages
and when you scroll up, you can click any of those pages, including page 1, to render down from there
and you can always scroll down again
this is an interesting idea
it avoids the crazy long page in a memory broken tab problem
it also avoids the infinite or pagination setting
and the infinite or pagination route



next morning
ok, at this point, more than a finished system for scrolling
this is really just an investigation
in which you build tools, and determine behaviors

what if the feed page, only while it's rendered, has a heartbeat
iphone can scroll at 16ms, android at 7ms
have a timer go off 20x/second, 50ms
each time it fires, it measures the page height and scroll position
maybe it also scans down the posts, measuring each's height
msot of the time there's no change, and it takes no action, so it's really fast
if there is a change, then it adds more on the leading edge, removes from the start

here's where it can replace posts that are way out of scrolling range with divs that are the same height
it can do this directly, rather than needing to report down to a post and tell it to change
also, this architecture means that posts don't all have to individually try to figure out where they are on the page


if there's a change, then it adds and removes items






imagine you have a 50ms timer
now you don't have to listen to scroll and resize events
instead, you check the dimensions 20x/second, and see when they've changed
if they've changed, you add more items

you also notice when there's been no change for more than 500ms
this means no scrolling, no loading happened
that's when you remove items from the trailing end

later on, it's easier to add features to see where posts are within or near the fold, too

this way, you're doing the same thing, essentially
there's only one timer rather than a bunch of events
absolutely not every post trying to register for events!
















*/



//factory settings for infinite scroll
const timeFast = 50//milliseconds, load more posts nearly immediately
const timeSlow = 500//milliseconds, remove distant posts after a longer quiet period
const postsPage    = 100//number of posts, load this onto a page for the user to scroll down into
const postsEdge    = 20//number of posts, near the edge so load more
const postsHorizon = 140//number of posts, beyond this number is too far, unload

//a feed has a single pulse timer
//avoid listening to multiple events, running multiple timers, messaging post components, and intersection observer
let pulseTimer
onMounted(() => { pulseTimer = setInterval(pulse, timeFast) })
onUnmounted(() => { clearInterval(pulseTimer); pulseTimer = null })
let measured, measuredWhen, waitForThingsToSettleDown//page and scroll measurements
function pulse() {//runs 50 times a second, so be quick about it
	let n = now()
	let m = {
		scrollWidth:  document.documentElement.scrollWidth,
		scrollHeight: document.documentElement.scrollHeight,
		clientWidth:  document.documentElement.clientWidth,
		clientHeight: document.documentElement.clientHeight,
		scrollX: window.scrollX,
		scrollY: window.scrollY
	}
	if (!measured || !sameObject(measured, m)) {//the user scrolled or the page changed size, like by loading
		measured = m//save measurements for next time
		measuredWhen = n//and when the saved measurements are from
		infiniteGrow()//add more posts to a short end, if necessary
		waitForThingsToSettleDown = true
		//it's correct for this part to happen frequently through continuous scroll changes
	}
	if (waitForThingsToSettleDown && n > measuredWhen + timeSlow) {//once things have settled down
		waitForThingsToSettleDown = false



		//it's correct for this part to not happen at all if there are continuous scroll changes



	}

}

let grewWhen
function infiniteGrow() {//right away, add more posts to the infinite scroll



	//if you added more, make a note when

}
function infiniteShrink() {//after a longer quiet period, remove posts that are far away from being seen


	//if you

}



//notice when something changes that could affect the infinite scroll
let resizeObserver//save reference to put away
onMounted(() => {
	window.addEventListener('scroll', somethingJustChanged)//the user scrolled
	window.addEventListener('resize', somethingJustChanged)//the user turned their phone
	resizeObserver = new ResizeObserver(somethingJustChanged)//content loading made the page longer
	resizeObserver.observe(document.documentElement)//above <body>, watch <html>

	somethingJustChanged()//also run at the very start
})
onUnmounted(() => {
	window.removeEventListener('scroll', somethingJustChanged)
	window.removeEventListener('resize', somethingJustChanged)
	resizeObserver.disconnect()
})





function somethingJustChanged() {

}
function nothingsChangedForAwhile() {

}



















</script>
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
<style scoped>
</style>
