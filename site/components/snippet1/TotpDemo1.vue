<script setup>//./components/TotpDemo.vue

import {
sayTick, Data,
totpEnroll, totpSecretIdentifier, totpValidate, totpGenerate, totpConstants,
browserIsBesideAppStore,
} from 'icarus'

const refLabel = ref('user.name@example.com')
const refIssuer = ref(Key('domain, public'))
const refUri = ref('')

let enrollment
async function generate() {
	enrollment = await totpEnroll({label: refLabel.value, issuer: refIssuer.value, addIdentifier: true})
	refUri.value = enrollment.uri
}

function redirect() {
	window.location.href = enrollment.uri//ttd august2025, this is the plain html way, claude says best for otpauth on mobile; Nuxt has navigateTo, Vue Router has useRouter().push()
}

let interval
onMounted(() => { interval = setInterval(repeater, 66) })
onUnmounted(() => { if (interval) clearInterval(interval) })
async function repeater() { if (!enrollment) return
	let secret = Data({base32: enrollment.secret})

	let t = Now()
	refCodePrev.value = await totpGenerate(secret, t - (30*Time.second))
	refCodeHere.value = await totpGenerate(secret, t)
	refCodeNext.value = await totpGenerate(secret, t + (30*Time.second))
	refCodeTime.value = sayTick(t)
}

const refCodePrev = ref('')
const refCodeHere = ref('')
const refCodeNext = ref('')
const refCodeTime = ref('')

</script>
<template>
<div class="border border-gray-300 p-2 bg-gray-100 space-y-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>TotpDemo1 (legacy)</i></p>

<div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 items-center">
	<div></div><p>Generate a new RFC6238 TOTP enrollment</p>
	<p class="text-right m-0">User:</p><input v-model="refLabel" class="px-2 py-2 border border-gray-300 rounded" />
	<p class="text-right m-0">Issuer:</p><input v-model="refIssuer" class="px-2 py-2 border border-gray-300 rounded" />
	<div></div><Button :click="generate" class="justify-self-start">Generate</Button>
</div>

<p>
	Is this a phone or tablet with an authenticator app or app store?
	{{browserIsBesideAppStore() ? '📲 ✅ YES' : '💻 🚫 NO'}}
</p>

<div v-if="refUri" class="space-y-2">
	<p>Generated enrollment information:</p>
  <pre class="whitespace-pre-wrap break-words">{{enrollment}}</pre>
  <p>On mobile, we'll automatically: <Button :click="redirect">Redirect to the default authenticator app</Button></p>
  <p>On desktop, we'll show a QR code:</p>
  
  <div class="flex justify-center py-2">
    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <QrCode :address="refUri" />
      </div>
      
      <div class="space-y-2">
      	<p>The server and authenticator app share the secret, and use it with the time to generate matching codes:</p>
        <p><code>{{refCodePrev}}</code> previous code</p>
        <p><code>{{refCodeHere}}</code> current code</p>
        <p><code>{{refCodeNext}}</code> upcoming code</p>
        <p><code>{{refCodeTime}}</code></p>
        <p>
        	Above and beyond the standard implementation, we can tell the user,
        	<i>the listing you're looking for is marked "[{{enrollment.identifier}}]"</i>
        </p>
      </div>
    </div>
  </div>
</div>

</div>
</template>
