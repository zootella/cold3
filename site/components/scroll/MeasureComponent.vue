<script setup>

import { ref } from 'vue'
import {
log, look, Time
} from 'icarus'

const boundingBox = ref(null)//must be reactive, because vue changes it, even if we don't

function measure() {
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
}

onMounted(() => {
	window.addEventListener('scroll', bounce1)
	window.addEventListener('resize', bounce1)
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

<div>
	<div ref="boundingBox" class="bounding-box">
		This is a large bounding rectangle
	</div>
</div>

</template>
<style scoped>

.bounding-box {
	height: 300px; /* Large enough height to create a noticeable bounding box */
	background-color: #f0f0f0; /* A light gray background to see the box clearly */
	padding: 20px;
	box-sizing: border-box;
}

</style>
