<script setup>

/*
const turnstileSiteKey = config.public.ACCESS_TURNSTILE_ID

let name = ref('')
let status = ref('(no status yet)')

const turnstileEl = ref(null)
const turnstileToken = ref('')

function textChanged() {
  log(`text changed to "${name.value}"`)
  status.value = `entered ${name.value.length} characters`
}

// When Turnstile succeeds, store the token
function onTurnstileSuccess(token) {
  turnstileToken.value = token
}

function renderTurnstile() {
  if (window.turnstile && turnstileEl.value) {
    window.turnstile.render(turnstileEl.value, {
      sitekey: turnstileSiteKey,
      callback: onTurnstileSuccess,
      size: 'invisible',
      execution: 'execute'
    })
  }
}

onMounted(() => {
  // Wait until Turnstile script is ready, then render the widget
  if (window.turnstile) {
    renderTurnstile()
  } else {
    const i = setInterval(() => {
      if (window.turnstile) {
        clearInterval(i)
        renderTurnstile()
      }
    }, 100)
  }
})

// Watch the name field. Once user starts typing and we don't yet have a token, request one.
watch(name, () => {
  if (name.value.length > 0 && !turnstileToken.value && turnstileEl.value && window.turnstile) {
    window.turnstile.execute(turnstileEl.value)
  }
})

async function buttonClicked() {
  log(`button clicked with name "${name.value}"`)

  if (!turnstileToken.value) {
    alert('Verification in progress, please wait a moment and try again.')
    return
  }

  try {
    let t = Now()
    let response = await $fetch('/api/name', {
      method: 'POST',
      body: {
        name: name.value,
        turnstileToken: turnstileToken.value
      }
    })
    let d = Now() - t
    status.value = `name api took ${d}ms to say: ${response.note}`
  } catch (e) {
    log('fetch caused exception:', look(e))
  }
}
*/


import {
log, look, Now,
} from 'icarus'
import {ref} from 'vue'

let name = ref('')
let status = ref('(no status yet)')
function textChanged() {
	log(`text changed to "${name.value}"`)
	status.value = `entered ${name.value.length} characters`
}
async function buttonClicked() {
	log(`button clicked with name "${name.value}"`)

	try {
		let t = Now()
		let response = await $fetch('/api/name', {method: 'POST', body: {name: name.value}})
		let d = Now() - t

		status.value = `name api took ${d}ms to say: ${response.note}`
	} catch (e) {
		log('fetch caused exception:', look(e))
	}
}

/*
add a checkbox []accept terms
submit button is only available when name not blank and box checked
when that happens, is also when turnstile generates its thing
a single click causes fetch, and unchecks the box, which grays the button--this is the client side debounce
this is a great idea--if you can get this basic flow right, you'll use it everywhere
*/



</script>
<template>

<p>Check if your desired username is available.</p>
<input type="text" v-model="name" @input="textChanged" />
<button @click="buttonClicked">Check</button>
<p>Status: <i>{{ status }}</i></p>

</template>













