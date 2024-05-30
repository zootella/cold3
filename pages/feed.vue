<script setup>

import { Time, log, inspect } from '~/library/library0'
import { postDatabase } from '~/library/library1'

const instance = getCurrentInstance()

const posts = postDatabase.chronology





//const boundingBox = ref(null)//must be reactive, because vue changes it, even if we don't

function measure() {

/*
	const p = instance.refs['Fouv7hYGoytFMpU8JF0Fp']
	console.log(p)
	if (p) {
		let element = p.$el || p
		let rect
		if (element && element.getBoundingClientRect) rect = element.getBoundingClientRect()
//		log(p, p.$el, element, element.getBoundingClientRect, rect)
	} else {
//		log('no p')
	}

	/*
	if (boundingBox.value) {
		const r = boundingBox.value.getBoundingClientRect()

		//pixel height distances from the top of the page to:
		const divTop = r.top + window.pageYOffset
		const divBottom = r.bottom + window.pageYOffset
		const viewportTop = window.pageYOffset
		const viewportBottom = window.innerHeight + window.pageYOffset
		const totalHeight = document.documentElement.scrollHeight;//total height of page

		log(`div at ${divTop}-${divBottom}, viewport at ${viewportTop}-${viewportBottom}, document height ${totalHeight}`)
	}
	*/
}



onMounted(() => {
	window.addEventListener('scroll', bounce1)
	window.addEventListener('resize', bounce1)


	const i = getCurrentInstance();
	const r = i.refs.feedreferencevalue;
	log('refs length is ' + r.length)
	if (r && r.length >= 3) {
		const e = r[2].$el; // Accessing the DOM element of the third PostComponent
		const rect = e.getBoundingClientRect();
		console.log(rect); // Logs the bounding rectangle of the third item
	}


})
onUnmounted(() => {
	window.removeEventListener('scroll', bounce1)
	window.removeEventListener('resize', bounce1)
})

const delay = 50*Time.millisecond
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
	ref="feedreferencevalue"
	:post="post"
	:isStandalone="false"
	:postAbove="null"
	:postBelow="null"
/>

</template>
