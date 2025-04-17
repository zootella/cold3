<script setup>

// For the simple text input control
const textValue = ref("")
const borderClass = ref("border-gray-400") // default: gray border when empty
const isFocused = ref(false)
const textStatus = ref("empty") // "empty", "invalid", or "valid"

//same set for the password box
const eye = ref(false)//true when eye is open and password is visible
const passwordValue = ref("")
const passwordBorderClass = ref("border-gray-400") // default: gray border when empty
const passwordIsFocused = ref(false)

// Validation function: empty -> gray, <5 characters -> red, >=5 characters -> green
function validateInput(e) {
	textValue.value = e.target.value
	if (textValue.value === "") {
		borderClass.value = "border-gray-400"
		textStatus.value = "empty"
	} else if (textValue.value.length < 5) {
		borderClass.value = "border-red-400"
		textStatus.value = "invalid"
	} else {
		borderClass.value = "border-green-400"
		textStatus.value = "valid"
	}
}

// Validation function for password: empty -> gray, <5 characters -> red, >=5 characters -> green
function validatePassword(e) {
	passwordValue.value = e.target.value
	if (passwordValue.value == "") {
		passwordBorderClass.value = "border-gray-400"
	} else if (passwordValue.value.length < 5) {
		passwordBorderClass.value = "border-red-400"
	} else {
		passwordBorderClass.value = "border-green-400"
	}
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>StyleComponent</i></p>

<!-- single line text input box with charm indicator -->
<div class="relative w-full max-w-xs mt-4">
	<input
		type="text"
		placeholder="Enter text here"
		:value="textValue"
		@input="validateInput"
		@focus="isFocused = true"
		@blur="isFocused = false"
		:class="[
			'block w-full px-4 py-2 border-4 rounded-lg focus:outline-none',
			borderClass,
			isFocused ? 'border-dashed' : 'border-solid'
		]"
	/>
	<!-- Charm indicator (non-clickable) -->
	<div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
		<!-- When empty: Arrow (pointing left) -->
		<svg
			v-if="textStatus === 'empty'"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			class="h-5 w-5 text-gray-400"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		<!-- When invalid: X icon -->
		<svg
			v-else-if="textStatus === 'invalid'"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			class="h-5 w-5 text-red-400"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
		<!-- When valid: Checkmark -->
		<svg
			v-else-if="textStatus === 'valid'"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			class="h-5 w-5 text-green-400"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
		</svg>
	</div>
</div>

<!-- password box with eye -->
<div class="relative w-full max-w-xs mt-4"><!-- relative for stuff inside, full width to stuff outside, limited to xs width -->

	<!-- password input, changes type between text and password to show or hide the user's text -->
	<input
		placeholder="Enter your password"
		:type="eye ? 'text' : 'password'"
		:value="passwordValue"
		@input="validatePassword"
		@focus="passwordIsFocused = true"
		@blur="passwordIsFocused = false"
		:class="[
			'block w-full px-4 py-2 border-4 rounded-lg focus:outline-none',
			passwordBorderClass,
			passwordIsFocused ? 'border-dashed' : 'border-solid'
		]"
	/>

	<!-- eye button above the end of the box -->
	<button type="button" @click="eye = !eye" class="absolute inset-y-0 right-0 flex items-center pr-3">

		<!-- eye closed -->
		<svg v-if="!eye" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 text-gray-500">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.05 10.05 0 012.641-4.24M9.878 9.878a3 3 0 104.243 4.243M15 12a3 3 0 01-4.243-4.243M3 3l18 18" />
			<!-- ttd march, this is all from chat, there's a second pupil arc in this you should find and omit -->
		</svg>

		<!-- eye open -->
		<svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 text-gray-500">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
		</svg>
	</button>
</div>

</div>
</template>
