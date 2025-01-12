<script setup>

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

let browserTag
onMounted(() => {//doesn't run on server, even when hydrating
	browserTag = getBrowserTag()
	signCheck()//async but not awaiting
})

async function signIn()    { await callAccount('action in')    }//these should be "In." "Out." "Check."
async function signOut()   { await callAccount('action out')   }
async function signCheck() { await callAccount('action check') }
async function callAccount(action) {
	try {
		let t = Now()
		let response = await $fetch('/api/account', {
			method: 'POST',
			body: {
				browserTag,
				password: passwordModel.value,
				action,
			}
		})
		t = Now() - t
		log('success', look(response))
		statusText.value = `This browser is ${response.signedIn2 ? 'signed in. 🟢' : 'signed out. ❌'} Fetch: ${t}ms. Note: ${response.note}`
		return response
	} catch (e) {
		log('caught', e)
	}
}

let passwordModel = ref('')
let statusText = ref('(no status yet)')
let stickText = ref('')

</script>
<template>
<div>

sign-in component to try refactoring from account component and message component

</div>
</template>











