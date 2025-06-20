<script setup>//./components/PostButton.vue
/*
use like:

const refButton = ref(null)
const refButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refButtonInFlight = ref(false)//the button below sets to true while it's working, we can watch

watch([refName], () => {//example where the form is watching the user type a name
	let v = validateName(refName.value, Limit.name)
	refButtonCanSubmit.value = toBoolean(v.isValid)//avoid vue's type warning
})

async function onClick() {
	let result = await refButton.value.post('/api/name', {
		action: 'SomeAction.',
		name: refName.value,
		email: refEmail.value,
	})
}

<PostButton
	labelIdle="Submit"
	labelFlying="Submitting..."
	:useTurnstile="false"

	ref="refButton"
	:canSubmit="refButtonCanSubmit"
	v-model:inFlight="refButtonInFlight"
	:onClick="onClick"
/>

looks like a button; runs a function
use when this is the last step in a form, and it's time to actually POST to an api endpoint
and additionally, if necessary, protect the endpoint with cloudflare turnstile on the page and server
*/

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

//props
const props = defineProps({
	labelIdle:    {type: String,   required: true},
	labelFlying:  {type: String,   required: true},
	useTurnstile: {type: Boolean,  required: true},

	/*ref="refButton"*///is here when you're setting attributes, but is not a property, of course
	canSubmit:    {type: Boolean,  required: true},//can i remove type boolean just on this one, so that code that uses my post button can set a validation result that is simply truthy or falsey, in place of a true boolean?
	inFlight:     {type: Boolean,  required: true},
	onClick:      {type: Function, required: true},
})

//emits
const emit = defineEmits(['update:inFlight'])

//refs
const refButtonState = ref('gray')
const refButtonLabel = ref(props.labelIdle)

onMounted(async () => {//ttd april, does this need to be async?
	if (props.useTurnstile && useTurnstileHere()) pageStore.renderTurnstileWidget = true//causes BottomBar to render TurnstileComponent
})

watch([() => props.canSubmit, () => props.inFlight], () => {
	if (props.inFlight) {
		refButtonState.value = 'orange'
		refButtonLabel.value = props.labelFlying
	} else {
		refButtonLabel.value = props.labelIdle
		if (props.canSubmit) {
			refButtonState.value = 'green'
		} else {
			refButtonState.value = 'gray'
		}
	}
}, {immediate: true})//run this right away at the start to set things up, before running it again on the first change

// the method that performs the post operation; this is exposed to the parent
defineExpose({post: async (path, body) => {
	let task = Task({name: 'post button', path, body})
	emit('update:inFlight', true)//this lets our parent follow our orange condition
	if (props.useTurnstile && useTurnstileHere()) {
		body.turnstileToken = await pageStore.getTurnstileToken()//this can take a few seconds
		task.tick2 = Now()//related, note that task.duration will be how long the button was orange; how long we made the user wait. it's not how long turnstile took on the page, as we get turnstile started as soon as the button renders!
	}
	task.response = await fetchWorker(path, {body})//throws on non-2XX; button remains orange but whole page enters error state
	task.finish({success: true})
	emit('update:inFlight', false)
	return task.response//return the response, discarding the task, so things don't keep getting deeper
}})

//ttd march, at some point you should actually hide the turnstile widget to make sure it doesn't actually still sometimes show up. you have notes for that, it's something like some settings in code, some in the dashboard, or something
</script>
<template>

<button
	:disabled="refButtonState != 'green'"
	:class="refButtonState"
	class="pushy"
	@click="props.onClick($event)"
>{{refButtonLabel}}</button>

</template>
<style scoped>

button.gray        { background-color: gray; }
button.green       { background-color: #16a34a; }
button.green:hover { background-color: #4ade80; }
button.orange      { background-color: orange; }
/*
ttd april, get these in line with the tailwind styles in tailwind.css
you've set green and hover to match tailwind bg-green-600 and 400, but manually, which is bad
*/

</style>
