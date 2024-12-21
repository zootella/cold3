<script setup>

import {
log, look, Now, Time,
} from 'icarus'
import {ref, watch} from 'vue'

/*
here's a simple example of states for a simple form
the user changes two fields: name and terms

when the user has typed text in the name box and checked terms,
form contents as a whole are submittable, and script enables the button

when the user clicks the button, flight starts, simulating a POST to the server
during this time, the button isn't enabled, preventing a user's double-click from creating duplicate POSTs
this is a simple client-side method of debouncing

we use Vue's watch() because it can trigger a change in multiple reactive variables
and also, the handler fires if either the user or our own script changes any of them
individual handlers in the template would only be able to detect changes the user makes on the page

building upon this, we'll:
[]do a real fetch to an api endpoint
[]add Cloudflare Turnstile to this simple form
*/

let refName = ref('')
let refTerms = ref(false)
let refContentsSubmittable = ref(false)//true when the form contents are complete enough the user could submit them
let refInFlight = ref(false)//true while the page has post out to the server
let refStatus = ref('')

watch([refName, refTerms], () => {
	refContentsSubmittable.value = refName.value.length && refTerms.value
	//here, we don't need to watch refInFlight, maybe because all we're setting is refContentsSubmittable, and that doesn't depend on in flight or not
})

async function buttonClicked() {
	refTerms.value = false//uncheck the box, but keep the name the same

	log('flight start')
	refInFlight.value = true//as though we're fetching
	setTimeout(() => {//as though a second later, the fetch is done
		refInFlight.value = false
		log('flight completed')
	}, 2*Time.second)
}

</script>
<template>
<div>

<p>Check if your desired username is available.</p>
<p>
	Name: <input type="text" v-model="refName" />
</p>
<p>
	<input type="checkbox" v-model="refTerms" id="idTerms" />{{' '}}
	<label for="idTerms">Accept Terms</label>{{' '}}
	<button
		:disabled="!(refContentsSubmittable && !refInFlight)"
		:class="{
			'ghost':  !refContentsSubmittable && !refInFlight,
			'ready':   refContentsSubmittable && !refInFlight,
			'flight':                             refInFlight
		}"
		@click="buttonClicked"
	>Check</button>
</p>
<p>Status: <i>{{ refStatus }}</i></p>

</div>
</template>
<style scoped>

button.ghost       { background-color: gray; }
button.ready       { background-color: green; }
button.ready:hover { background-color: pink; }
button.flight      { background-color: orange; }

</style>
