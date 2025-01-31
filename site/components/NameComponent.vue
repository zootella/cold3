<script setup>

import {
log, look, Now, Time,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

let refName = ref('')
let refTerms = ref(false)

let refButtonState = ref('gray')//gray for ghosted, green for clickable, or orange for post-in-flight
let refTurnstileComponent = ref(null)

let refInFlight = ref(false)//true while we're getting a token and POSTing to our own api, both of those combined
let refResponse = ref('')

watch([refName, refTerms, refInFlight, refResponse], () => {
	if (refInFlight.value) {//turnstile or post in flight
		refButtonState.value = 'orange'
	} else if (refName.value.length && refTerms.value) {//form ready to submit
		refButtonState.value = 'green'
	} else {
		refButtonState.value = 'gray'
	}
})

async function clickedSubmit() {//gets called when the user clicks the button
	try {
		log('clicked submit start')
		refInFlight.value = true

		let t1 = Now()
		let token = await refTurnstileComponent.value.getToken()//this can take a few seconds
		let t2 = Now()
		let body = {name: refName.value, terms: refTerms.value, turnstileToken: token}
		refResponse.value = await $fetch('/api/name', {method: 'POST', body})
		let t3 = Now()
		log(`button was orange for turnstile's ${t2-t1}ms and then fetch's ${t3-t2}ms`)

	} catch (e) {
		log('clicked submit caught', look(e))
	} finally {
		refInFlight.value = false
		log('clicked submit end')
	}
}

</script>
<template>
<div>

<p>Check if your desired username is available.</p>
<p>Name: <input type="text" v-model="refName" /></p>
<div>
	<label><input type="checkbox" v-model="refTerms" /> Accept Terms</label>{{' '}}
	<button :disabled="refButtonState != 'green'" :class="refButtonState" @click="clickedSubmit" class="pushy">Check</button>
</div>
<p>Response: <code>{{ refResponse }}</code></p>
<TurnstileComponent ref="refTurnstileComponent" />

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
