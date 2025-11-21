<script setup>//./components/ImprovedPostButton.vue
/*
(1) basic use leaning on defaults:

const refBasicButton = ref(null)
async function onBasicButton(email) {
	let task = await refBasicButton.value.post('/api/endpoint', {action: 'SetEmail.', email})
	//response body is task.response
}
<ImprovedPostButton ref="refBasicButton" label="Submit" :onClick="() => onBasicButton('alice@example.com')" />

(2) customized use with all features:

const refCustomButton = ref(null)
const refCustomButtonCanSubmit = ref(false)//set to true to let the button be clickable, the button below is watching
const refCustomButtonInFlight = ref(false)//the button below sets to true while it's working, we can watch

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

<ImprovedPostButton
	label="Submit"
	labelFlying="Submitting..."
	:useTurnstile="true"

	ref="refCustomButton"
	:canSubmit="refCustomButtonCanSubmit"
	v-model:inFlight="refCustomButtonInFlight"
	:onClick="onCustomButton"
/>

looks like a button; runs a function
use when this is the last step in a form, and it's time to actually POST to an api endpoint
and additionally, if necessary, protect the endpoint with cloudflare turnstile on the page and server
*/

/*
ttd november
ok, in an evening with claude, you duplicated PostButton to this new ImprovedPostButton, which should be easy to use in both simple applications and those which require lots of features

right now there are three types of buttons in the front end:
1. <button> regular HTML with onClick and fetchWorker (example, TrailDemo1)
2. <PostButton />, which you started using, but is quite complex (example, TrailDemo2)
3. <ImprovedPostButton />, here, which should be an easier migration path from button, and also a drop in replacement for PostButton

ok, so this code was written and checked by ai, but has not actually run yet, even in a smoke test
so go carefully, switching button and PostButton to ImprovedPostButton one component at a time, testing everything
[]but then the goal is to have eliminated button and PostButton, because everywhere it's ImprovedPostButton
[]and then get rid of PostButton and TrailDemo1
[]and then rename ImprovedPostButton -> PostButton
*/

import {
useTurnstileHere,
} from 'icarus'
const pageStore = usePageStore()

//props
const props = defineProps({
	label:        {type: String,   required: true},
	labelFlying:  {type: String,   default: ''},//optional, if you want to change from label "Submit" to orange "Submitting..."
	useTurnstile: {type: Boolean,  default: false},
	canSubmit:    {type: Boolean,  default: true},
	onClick:      {type: Function, required: true},
})

//emits
const emit = defineEmits(['update:inFlight'])//parents can optionally watch our in-flight status with v-model:inFlight

//refs
const refState = ref('gray')
const refLabel = ref(props.label)
const refInFlight = ref(false)

onMounted(() => {
	if (props.useTurnstile && useTurnstileHere()) pageStore.renderTurnstileWidget = true//causes BottomBar to render TurnstileComponent
})

watch([() => props.canSubmit, refInFlight], () => {
	if (refInFlight.value) {
		refState.value = 'orange'
		if (hasText(props.labelFlying)) refLabel.value = props.labelFlying
	} else {
		refLabel.value = props.label
		if (props.canSubmit) {
			refState.value = 'green'
		} else {
			refState.value = 'gray'
		}
	}
}, {immediate: true})//run this right away at the start to set things up, before running it again on the first change

// the method that performs the post operation; this is exposed to the parent
defineExpose({post: async (path, body) => {
	let task = Task({name: 'post button', path, body})
	refInFlight.value = true
	emit('update:inFlight', true)//if our parent needs to follow our orange condition, they can watch for this event
	if (props.useTurnstile && useTurnstileHere()) {
		body.turnstileToken = await pageStore.getTurnstileToken()//this can take a few seconds
		task.tick2 = Now()//related, note that task.duration will be how long the button was orange; how long we made the user wait. it's not how long turnstile took on the page, as we get turnstile started as soon as the button renders!
	}
	task.response = await fetchWorker(path, {body})//throws on non-2XX; button remains orange but whole page enters error state
	task.finish({success: true})
	refInFlight.value = false
	emit('update:inFlight', false)
	return task//ttd november, different than PostButton which returns task.response, throwing away task, but TrailDemo2 does want to say how long the task took! and will be simpler if that can be a feature here! also returning the task sets up .response as the name, rather than letting the caller alternate between response and result. it's the response body, so deliver it named that way
}})

//ttd march2025, at some point you should actually hide the turnstile widget to make sure it doesn't actually still sometimes show up. you have notes for that, it's something like some settings in code, some in the dashboard, or something
</script>
<template>

<button
	:disabled="refState != 'green'"
	:class="refState"
	class="pushy"
	@click="props.onClick($event)"
>{{refLabel}}</button>

</template>
<style scoped>

button.gray        { background-color: gray;    }
button.green       { background-color: #16a34a; }
button.green:hover { background-color: #4ade80; }
button.orange      { background-color: orange;  }
/*
ttd april2025, get these in line with the tailwind styles in tailwind.css
you've set green and hover to match tailwind bg-green-600 and 400, but manually, which is bad
*/

</style>
