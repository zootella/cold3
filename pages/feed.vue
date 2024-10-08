<script setup>

import {
Time, log, look, Now,
postDatabase
} from '@/library/grand.js'

//const instance = getCurrentInstance()
const posts = postDatabase.chronology


let status = reactive({line1:'', line2:''})


let lastMeasure = 0, sinceMeasure = 0, shortestMeasure = -1
let lastMeasurements = []
let keepMeasurements = 20




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

	let n = Now()
	if (!lastMeasure) {//first measurement ever
		lastMeasure = n
	} else {
		sinceMeasure = n - lastMeasure//how long since most recent
		lastMeasure = n
		if (shortestMeasure == -1 || sinceMeasure < shortestMeasure) shortestMeasure = sinceMeasure//new smallest every winner

		lastMeasurements.push(sinceMeasure)
		if (lastMeasurements.length > keepMeasurements) lastMeasurements.shift()


	}

	status.line1 = `${countAbove} above, ${countWithin} within, ${countBelow} below, ${shortestMeasure}ms shortest`
	status.line2 = `${lastMeasurements}`
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
	window.addEventListener('scroll', bounce0)
	window.addEventListener('resize', bounce0)
	bounce0()
})
onUnmounted(() => {
	window.removeEventListener('scroll', bounce0)
	window.removeEventListener('resize', bounce0)
})

function bounce0() {
	measure()
}

const delay = 5*Time.millisecond//surely scroll events won't happen faster than 1000/60=16 frames? maybe don't need
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
<div class="floating-status">
{{ status.line1 }}<br/>
{{ status.line2 }}
</div>

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
}

</style>
