


<script setup>
//./components/FormComponent.vue
import { log, look, Limit } from 'icarus'
const helloStore = useHelloStore()

const refNote = ref('')

const refButtonState = ref('start')

function onButtonClicked() {
	log("button clicked, so now it's working. we'll get onButtonFinished in a moment...")
	refButtonState.value = 'working...'
}
function onButtonFinished(result) {
	log(look(result))
	refButtonState.value = 'finished.'
}
</script>

<template>
	<div class="border border-gray-300 p-2">
		<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>FormComponent</i></p>
		<p>
			<input
				:maxlength="Limit.input"
				type="text"
				v-model="refNote"
				placeholder="type a note"
				class="w-72"
			/>
			<PostButtonComponent
				:note="refNote"
				:browser-tag="helloStore.browserTag"
				path="/api/form"
				action="SubmitNote."
				@button-clicked="onButtonClicked"
				@button-finished="onButtonFinished"
			/>
		</p>
		<p>{{refButtonState}}</p>
	</div>
</template>

ok--now, let's add two additional features
let's work on this now: (a) FormComponent needs to know when the user clicks the button. right now, it just knows when the button is done with its tasks that it does when the user clicks it
let's work on this in a little bit: (b) FormComponent needs to give the button two label strings, like "Submit Your Note" for when it's not running, and "Submitting..." while it is running. these strings are set by the parent, and performed by the child

<script setup>
//./components/PostButtonComponent.vue
import {log, look, Now} from 'icarus'

// define props passed in from the parent
const props = defineProps({
	note:       { type: String, required: true },//question: do we have to establish type: String? and what does required: true mean? does it mean not falsey? something else
	browserTag: { type: String, required: true },
	path:       { type: String, required: true },
	action:     { type: String, required: true },
})
// define the event that will emit the fetch result
const emit = defineEmits(['button-finished'])

const refInFlight = ref(false)
const refButtonState = ref('gray') // gray: disabled, green: enabled, orange: in flight

// simple note validation
function validateNote(s) {
	return s.length >= 5 ? { isValid: true, raw: s } : { isValid: false, raw: s }
}

// update the button state based on the note validity and whether a fetch is in flight
watch(//we are passing watch three arguments now

	//first argument
	[
		() => props.note,//question: why is the first element a function here?
		refInFlight,//and this one is just normal
	],

	//second argument
	() => {
		const v = validateNote(props.note)

		if (refInFlight.value) { refButtonState.value = 'orange' }
		else if (v.isValid)    { refButtonState.value = 'green' }
		else                   { refButtonState.value = 'gray' }
	},

	//third argument
	{
		immediate: true//run once at the start, in addition to later upon each change
	},
)

// function to handle button click and perform the fetch
async function clickedButton() {
	emit('button-clicked')
	let result, error, success = true
	let t1 = Now()
	try {
		refInFlight.value = true
		result = await $fetch(props.path, {method: 'POST', body: {
			action: props.action,
			browserTag: props.browserTag,
			note: props.note
		}})
		//it's a bit cumbersome to have every element of the body set up as a separate prop. is there a way i can have a single prop, called body? then, the form above will prepare it with everything that the button should POST, and the button here will use it in $fetch
	} catch (e) {
		error = e
		success = false
	} finally {
		refInFlight.value = false
	}
	let t2 = Now()
	emit('button-finished', {p: {success, result, error, tick: t2, duration: t2 - t1}})
}
</script>

<template>
	<button
		:disabled="refButtonState !== 'green'"
		:class="refButtonState"
		class="pushy"
		@click="clickedButton"
	>Submit Your Note</button>
	<!-- later (not now) ill try to make the text on the button something FormComponent above sets, also. oh, and also to set another button label to use while the button is in flight -->
</template>

<style scoped>
button.gray        { background-color: gray; }
button.green       { background-color: green; }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange; }
</style>












