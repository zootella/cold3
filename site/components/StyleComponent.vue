<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'

/*
ttd march
took a day to play around with styling components in tailwind

## goals

visually simple--like you drew it all with a thick crayon
flat--as opposed to shadows, bubbles, shine, any z dimensional cues, accomplish things without those!
completely communicative--the user knows where the focus is, which fields are valid, what the button can do and is doing
does not depend upon color--you could use it all with just gray and pink, for instance
understandably common--boxes have a border all the way around so everyone's mom understands they're a box. unlike Android in the teens!

oh wait--if you accomplish these goals with chat and tailwind, does that mean you don't use a prepackaged component library? or you do, but just to get the slider-style checkbox, or something? don't those comonent libraries already come with a password box? so maybe you shouldn't be doing this here yourself, at all!

## factoring

should styles be here? no, lots of duplication. okay, so then there are two directions you can factgor them:

upwards:
all the way up to tailwind/main.css,
where you either style all input boxes?
or make a class name you can mention wehre you want it?

downwards:
making your own low level granular vue comonents like <TextBox /> <NumberBox /> <PasswordBox /> and <ParagraphBox />
then, there's some duplication between those three, but that's ok
and this is interesting, because they keep their own state
you pass in a validator function for each, which they use when their text changes, and update their appearance automatically
you'll learn some more vue if you choose this path,
as you still need the larger form using them to know when their text changes, too!
and for the password box, does that include the strength meter? lots to try out and decide here
and on the set password form, how do you get both eye controls connected?

## charm

ok, so here, the charm does not interfere with typing or selecting text
but does draw on top of text, if you get enough text in there so it makes it over to the right of the box
if you tell chat3 to get it under the text, it goes on a very advanced path of dynamically creating a background image for the box
using data urls like url('data:image/svg+xml,%3Csvg xmlns...
which is impressive, but
in practice, you might either
1 move the charm to the upper right corner, so it's still on top, but really doesn't get in the way
2 not use the charm at all, instead picking some background wallpaper that changes from - to x and v
3 not use the charm at all, instead showing the validation status entirely in the 
right now, you'd pick 1, as you may not color the border

or maybe this is too fancy and too difficult in situations where you've got several and they start to depend upon one another
and remember that the whole finished product actually won't have that many different forms or fields!

## button

another thing to do here now is style a button alongside these boxes
and work on the button's animated state, which probably has an ellipsis that blinks ., .., ...
and maybe also a gently swimming wallpaper background

## more notes

remember that most users won't ever encounter the password box
as passwords are out of style because they're hard for users to do, and frequently not at all secure
so keep time, code, and complexity pretty encapsulated on that

if you do <Box /> <ParagraphBox /> and <PasswordBox /> would you also do
<NumberBox />
<PhoneBox />
<EmailBox />
<NameBox /> which can be username, phone, or email?
not sure how the factoring works around these, either--is it a simple box that the form knows the very specific contents of,
or is it a very particular box which knows that, itself
you kinda like the simpler factorization, but there should still be <NumberBox /> because it brings up the number pad on mobile

some of these styles, like mt-4 and max-w-xs are really about layout, and should go to divs higher in the tree

the dashed border looks weird and bad in firefox, maybe try a dotted border?
remember to deploy to see what this looks like on mobile, both ios and android!









*/

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

</template>
