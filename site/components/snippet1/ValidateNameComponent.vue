<script setup>

import {
validateName,
} from 'icarus'

const refStatus = ref(false)//overall status
const refName0 = ref('')//output for form 0, normalized to reserve
const refName1 = ref(''); const refBox1 = ref('')//output text and input box for form 1, canonical for route
const refName2 = ref(''); const refBox2 = ref('')//output text and input box for form 2, pretty for pages and cards

watch([refBox2], () => {//box 2 on top controls box 1
	let v = validateName(refBox2.value, Limit.name)
	refStatus.value = v.ok
	if (v.f2ok) {
		refName2.value = v.f2//set the status here
		refBox1.value = v.f1//and the contents of the box below
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})
watch([refBox1], () => {//which is also independently editable
	let v = validateName(refBox1.value, Limit.name)
	refStatus.value = v.ok
	if (v.ok) {
		refName0.value = v.f0
		refName1.value = v.f1//set the status here
	} else {
		refName0.value = ''
		refName1.value = ''
		refName2.value = ''
	}
})

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>ValidateNameComponent</i></p>

<p>Choose your user name:</p>
<p><input :maxlength="Limit.name" v-model="refBox2" placeholder="name for pages" class="w-96" /></p>
<p>Valid {{refStatus ? '✅ Yes' : '❌ No'}}</p>
<p>On pages and cards you'll be <i>{{refName2}}</i></p>

<p>And from that, here's what your name will be in links. You can edit this box directly, too.</p>
<p><input :maxlength="Limit.name" v-model="refBox1" placeholder="name for links" class="w-96" /></p>
<p>Your profile will be at <code>https://{{Key('domain, public')}}/{{refName1}}</code></p>
<p>We'll reserve <code>{{refName0}}</code> for you, also.</p>

</div>
</template>
<style scoped>

button.gray        { background-color: gray;       }
button.green       { background-color: green;      }
button.green:hover { background-color: lightgreen; }
button.orange      { background-color: orange;     }

</style>
