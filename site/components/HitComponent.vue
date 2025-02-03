<script setup>

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'

/*
//not sure if we'll get refs this way, or if they'll come from useFetch or fetch$
let refHits = ref(0)
let refDuration = ref(0)
*/

/*
onMounted(async () => {//doesn't run on server, even when hydrating
	//not sure if we need to do anything in here, actually
})

function clickedHit() {
	log('clicked hit')
}
*/

/*
we can use an existing endpoint at /api/hit
we'll POST action: 'Get.' or 'Increment.'
and expect a response body r with r.hits set to a number, which the component should show
*/

/*
this component is a simple little hit counter
i'd like it to hydrate on the server first, so that a client that can't even run javascript can get the current hit count

all of this is nuxt 3 with vue's composition api, and modern full stack javascript
*/

/*
here are notes for later (not now)

pinia
1[] remake your global counter, which goes between useFetch and the database
2[] make your pinia counter, which persists between routes
3[] understand the right way to merge those two

perhaps a simple way to merge the two
on first load, useFetch gets the count as part of hydration. you can confirm that getbot save or curl contains the count, without even js on teh client!
then, the count is saved in pinia, clicks away and back again don't both the server. you can see that the last fetch time is zero
clicks to the button to increment call the server with $fetch
*/



let {data, pending, error} = useFetch(
	'/api/hit',
	{
		method: 'POST',
		body: {
			action: 'Get.'
		}
	}
)

//<p>{{refHits}} hits, fetch took {{refDuration}}ms <button class="pushy" @onClick="clickedHit">Hit</button></p>


</script>

<template>
<div>

<p><i>HitComponent</i></p>

<div v-if="pending">Loading hit count...</div>
<div v-else-if="error">Error: {{ error.message }}</div>
{{data?.hits}} hits from {{data?.sticker}}

</div>
</template>













