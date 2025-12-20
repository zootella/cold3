<script setup>//./components/PostButton.vue
/*
(1) basic use leaning on defaults:

const refBasicButton = ref(null)
async function onBasicButton(email) {
	let task = await refBasicButton.value.post('/api/endpoint', {action: 'SetEmail.', email})
	//response body is task.response
}
<PostButton ref="refBasicButton" :onClick="() => onBasicButton('alice@example.com')">Submit</PostButton>

(2) customized use with all features:

const refCustomButton = ref(null)
const refCustomButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refCustomButtonIsDoing = ref(false)//the button below sets to true while it's working, we can watch

watch([refName], () => {//example where the form is watching the user type a name
	let v = validateName(refName.value, Limit.name)
	refCustomButtonCanSubmit.value = toBoolean(v.ok)//avoid vue's type warning
})

async function onCustomButton() {
	let task = await refCustomButton.value.post('/api/name', {
		action: 'SomeAction.',
		name: refName.value,
		email: refEmail.value,
	})
}

<PostButton
	labeling="Submitting..."
	:useTurnstile="true"

	ref="refCustomButton"
	:canSubmit="refCustomButtonCanSubmit"
	v-model:isDoing="refCustomButtonInFlight"
	:onClick="onCustomButton"
>Submit</PostButton>

looks like a button; runs a function
use when this is the last step in a form, and it's time to actually POST to an api endpoint
and additionally, if necessary, protect the endpoint with cloudflare turnstile on the page and server
*/

/*
ttd november
ok, in an evening with claude, you improved PostButton, which should be easy to use in both simple applications and those which require lots of features

right now there are three types of buttons in the front end:
1. <button> regular HTML with onClick and fetchWorker (example, TrailDemo1)
2. <OriginalPostButton />, which you started using, but is quite complex (example, TrailDemo2)
3. <PostButton />, here, which should be an easier migration path from button, and also a drop in replacement for PostButton

ok, so this code was written and checked by ai, but has not actually run yet, even in a smoke test
so go carefully, switching button and PostButton to PostButton one component at a time, testing everything
[]but then the goal is to have eliminated button and PostButton, because everywhere it's PostButton
[]and then get rid of PostButton and TrailDemo1
[]and then rename PostButton -> PostButton
*/

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

//props
const props = defineProps({
	labeling: {type: String, default: ''},//optional, if you want to change from "Submit" to "Submitting..." while doing
	useTurnstile: {type: Boolean, default: false},

	/*ref="refButton"*///is here when you're setting attributes, but is not a property, of course
	canSubmit: {type: Boolean, default: true},//can i remove type boolean just on this one, so that code that uses my post button can set a validation result that is simply truthy or falsey, in place of a true boolean?
	onClick: {type: Function, required: true},
})

//emits
const emit = defineEmits(['update:isDoing'])//parents can optionally watch our in-flight status with v-model:isDoing

//refs
const refState = ref('ghost')
const refDoing = ref(false)

onMounted(() => {
	if (props.useTurnstile && useTurnstileHere()) pageStore.renderTurnstileWidget = true//causes BottomBar to render TurnstileComponent
})

watch([() => props.canSubmit, refDoing], () => {
	if (refDoing.value) {
		refState.value = 'doing'
	} else {
		if (props.canSubmit) {
			refState.value = 'ready'
		} else {
			refState.value = 'ghost'
		}
	}
}, {immediate: true})//run this right away at the start to set things up, before running it again on the first change

// the method that performs the post operation; this is exposed to the parent
defineExpose({post: async (path, body) => {
	let task = Task({name: 'post button', path, body})
	refDoing.value = true
	emit('update:isDoing', true)//if our parent needs to follow our doing condition, they can watch for this event
	if (props.useTurnstile && useTurnstileHere()) {
		body.turnstileToken = await pageStore.getTurnstileToken()//this can take a few seconds
		task.tick2 = Now()//related, note that task.duration will be how long the button was doing; how long we made the user wait. it's not how long turnstile took on the page, as we get turnstile started as soon as the button renders!
	}
	task.response = await fetchWorker(path, {body})//throws on non-2XX; button remains doing but whole page enters error state
	task.finish({success: true})
	refDoing.value = false
	emit('update:isDoing', false)
	return task
}})

//ttd march2025, at some point you should actually hide the turnstile widget to make sure it doesn't actually still sometimes show up. you have notes for that, it's something like some settings in code, some in the dashboard, or something
</script>
<template>

<button
	:disabled="refState != 'ready'"
	:class="['my-button', refState]"
	@click="props.onClick($event)"
>
	<template v-if="labeling && refDoing">{{props.labeling}}</template><!-- custom like "Submitting..." -->
	<slot v-else /><!-- default button label like "Submit" -->
</button>

</template>
