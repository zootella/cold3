<script setup>

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


/*
this is also where you should make a component that is your visible log box
like, make it reusable, and use it here and future places
currently you have a few bespoke versions scattered about
*/

/*
password page backlog
[x]enter shows hash and time
[x]try on devices fast and slow (XXms rtx, 160ms main box, 450ms cheap tablet)
[]hidden password with dots
[]eyelid control to show
[]strength-o-meter
[]second box to confirm
*/


/*
ttd april
evolution of thinking of how/if to use passwords in the system
1 code them normal
2 don't use them at all, they're compromised by both attackers and google/apple fighting to popups over each other to steal users' with the new Passkey web standards
3 include them, but only if the user digs to find them

along those lines, what to do about strength and requirements
as this is buried, ok to be unconventional:
- always show the password, not hidden, no show button
- hash on device, and for a long time, like ten seconds on a recent iphone
- no strength requirements or strength at all


*/


//yes, this is a factory preset, correctly in the page, which gets sent to the client, where the user can see it
const ACCESS_PASSWORD_HASHING_SALT_CHOICE_1_PUBLIC = 'KYDVVYTN3OV6R2RJXEPOHAM2BA'//16 random bytes is 26 base32 characters
const ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1_PUBLIC = 420//thousands, OWASP recommends 100-500
/*
todo remember when comparing *even password hashes* on the server to use your fancy new secureSameText(s1, s2)
otherwise, the attacker won't bother computing hash values on his client at all, and will just guess forward the hash value--he'll never get the password, but will gain access to the account!
*/


import {
hashPassword, Data, sayTick,
} from 'icarus'

// Define reactive variables
const inputValue = ref('')
const outputText = ref('')

// Called with every character typed
function myFunction1() {

	outputText.value = `${inputValue.value.length} charcters`
}

// Called when the submit button is clicked
async function myFunction2() {

	let t = Now()
	let h = await hashPassword(ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1_PUBLIC, Data({base32: ACCESS_PASSWORD_HASHING_SALT_CHOICE_1_PUBLIC}), inputValue.value)
	let duration = Now() - t

	outputText.value = `${h.base32()} hashed from ${ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1_PUBLIC} thousand iterations in ${duration}ms on ${sayTick(t)}`
}

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>PasswordComponent</i></p>

<form @submit.prevent="myFunction2">
	<input type="text" v-model="inputValue" @input="myFunction1" placeholder="Type something..." />{{' '}}
	<button class="pushy" type="submit">Submit</button>
	<p>{{ outputText }}</p>
</form>

</div>
</template>
