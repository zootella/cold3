<script setup>//./components/TimeRemaining.vue

import {
log, look, Now, Limit, Time, sayPlural,
} from 'icarus'
import {ref, onMounted, onUnmounted} from 'vue'

let _intervalIdentifier = null
onMounted(() => {
	_intervalIdentifier = setInterval(intervalFunction, Time.second)
})
onUnmounted(() => {
	if (_intervalIdentifier) clearInterval(_intervalIdentifier)
})

const props = defineProps({
	start:    {type: Number, required: true},
	duration: {type: Number, required: true},
})
const emit = defineEmits(['buzzer'])

const refDeadline = ref(Now() + props.duration)
const refMessage = ref('')

function intervalFunction() {//this will run every second
	let remaining = refDeadline.value - Now()

	if (remaining > 0) {

		let minutes = Math.floor(remaining / Time.minute)
		if (minutes) refMessage.value = `${minutes} minute${sayPlural(minutes)} remaining!`
		else         refMessage.value = `less than a minute remaining!!`

	} else {

		refMessage.value = `buzzer!`
		if (_intervalIdentifier) clearInterval(_intervalIdentifier)
		emit('buzzer')
	}
}
intervalFunction()//run once at the start, too

const startTime = (new Date(props.start)).toLocaleTimeString(navigator.language, {hour: 'numeric', minute: 'numeric'})

</script>
<template>

<span>
	{{startTime}}, {{refMessage}}
</span>

</template>
