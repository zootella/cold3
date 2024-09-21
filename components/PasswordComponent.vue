<script setup>

//yes, this is a factory preset, correctly in the page, which gets sent to the client, where the user can see it
const ACCESS_PASSWORD_HASHING_SALT_CHOICE_1 = 'KYDVVYTN3OV6R2RJXEPOHAM2BA'//16 random bytes is 26 base32 characters
const ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1 = 100//100 thousand

import { ref } from 'vue';

// Define reactive variables
const inputValue = ref('');
const outputText = ref('');

// Called with every character typed
function myFunction1() {
	//console log('Text changed:', inputValue.value);
}

// Called when the submit button is clicked
function myFunction2() {
	outputText.value = `You typed: ${inputValue.value}`;
}

/*
draft password design:

hash on the client; make the attacker spend the processor cycles
require 6 characters, encourage upper/lower/number/symbol with green checks, but don't require
if hashing takes 10ms you calculated it would take 18 years to guess all the 6 character upper/lower/number
and you'll probabl use 100,000 cycles, which may take 100ms

there's one factory preset seed, called seed1, hard coded in the client component
this means that an attacker would have to make a new rainbow table
and if that becomes a problem, switch to one seed per set password by adding that to the database

this darkpenny approach is in addition to the site-wide rate limiter
which protects separate and addition to this system
which is also strong alone!

most users won't authenticate with passwords at all, also

standard practice is to hash on the server side, because client code isn't trusted
but on the server we'll pay for the attacker's computational work, not make them do so!
also, imagine the server is compromised, or somehow, the connection is snooped
hashing on the client, the user's password never leaves the client
*/







/*
this example is all on the client
as the user types show checks for upper/lower/digit/special
too short, and password not the same (to set, two boxes, that pattern)

and then on submit, show the hash, and say how long 10, 50, 100, 250k iterations took
and then try that on current and old phones and laptops
chat's guess is that 100k is 100ms, which is fine

oh, you have that really crappy android tablet, try it there, too


*/



/*
no form tag below
button works, but enter doesn't press button
what are different ways to make enter also work? or is the best way the form tag

oh, also, you need to do the eyelid control
it'll be interesting to see what that is, and how you get it inside the text box

*/

/*
instead of failing or warning on caps lock on, why not try it boht ways?
*/



/*
note about how, to begin, these are public constants
and that's very strong and totall fine
but in the future, it won't be hard to change to more iterations
or even a separate salt for each password set
*/
/*
let's say the attacker knows a user's password is 6 letters and numbers
and he's got fast computers, which can do 100k loops for a password in 10ms
how much processor time will it take him to crack it?

26 + 26 + 10 = 62 possible digits
62 ^ 6 = 56800235584 possible passwords
56800235584 * 10 = 568002355840 milliseconds compute time to hash them all
568002355840 / Time.year = 17.9989 years!
*/


</script>
<template>


<div>
	<input type="text" v-model="inputValue" @input="myFunction1" placeholder="Type something..." />
	<button @click="myFunction2">Submit</button>
	<p>{{ outputText }}</p>
</div>

</template>
<style scoped>


</style>
