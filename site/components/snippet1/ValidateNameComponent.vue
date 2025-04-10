<script setup>

import {
validateName,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

const refPageBox   = ref(''); const refPageStatus   = ref('')
const refFormalBox = ref(''); const refFormalStatus = ref('')
const refStatus = ref('')

watch([refPageBox], () => {//the top box controls the lower one
	let v = validateName(refPageBox.value, Limit.name)
	log(look({input: refPageBox.value, v}))
	if (v.formPageIsValid) {
		refPageStatus.value = v.formPage//set the status here
		refFormalBox.value = v.formFormal//and the contents of the box below
	} else {
		refPageStatus.value = `(not valid yet, keep typing...)`
	}
})
watch([refFormalBox], () => {//which is also independently editable
	let v = validateName(refFormalBox.value, Limit.name)
	if (v.isValid) {
		refFormalStatus.value = v.formFormal//set the status here
	} else {
		refFormalStatus.value = `(not valid yet, keep typing...)`
	}
})

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>ValidateNameComponent</i></p>

<p>Choose your user name:</p>
<p><input :maxlength="Limit.name" v-model="refPageBox" placeholder="name for pages" class="w-96" /></p>
<p>On pages and cards you'll be <i>"{{refPageStatus}}"</i></p>

<p>And from that, here's what your name will be in links. You can edit this box directly, too.</p>
<p><input :maxlength="Limit.name" v-model="refFormalBox" placeholder="name for links" class="w-96" /></p>
<p>That'll come through as <code>https://cold3.cc/<b>{{refFormalStatus}}</b></code></p>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
