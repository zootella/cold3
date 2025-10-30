<script setup>

import {
validateName,
} from 'icarus'

const refName2Box = ref(''); const refStatus2 = ref('')
const refName1Box = ref(''); const refStatus1 = ref('')
const refStatus = ref('')

watch([refName2Box], () => {//the top box controls the lower one
	let v = validateName(refName2Box.value, Limit.name)
	log(look({input: refName2Box.value, v}))
	if (v.formPageIsValid) {
		refStatus2.value = v.formPage//set the status here
		refName1Box.value = v.f1//and the contents of the box below
	} else {
		refStatus2.value = `(not valid yet, keep typing...)`
	}
})
watch([refName1Box], () => {//which is also independently editable
	let v = validateName(refName1Box.value, Limit.name)
	if (v.isValid) {
		refStatus1.value = v.f1//set the status here
	} else {
		refStatus1.value = `(not valid yet, keep typing...)`
	}
})

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>ValidateNameComponent</i></p>

<p>Choose your user name:</p>
<p><input :maxlength="Limit.name" v-model="refName2Box" placeholder="name for pages" class="w-96" /></p>
<p>On pages and cards you'll be <i>"{{refStatus2}}"</i></p>

<p>And from that, here's what your name will be in links. You can edit this box directly, too.</p>
<p><input :maxlength="Limit.name" v-model="refName1Box" placeholder="name for links" class="w-96" /></p>
<p>That'll come through as <code>https://cold3.cc/<b>{{refStatus1}}</b></code></p>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
