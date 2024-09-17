<script setup>

import { ref } from 'vue';

// Define reactive variables
const inputValue = ref('');
const outputText = ref('');

// Called with every character typed
function myFunction1() {
	console.log('Text changed:', inputValue.value);
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




const salt1 = 'KYDVVYTN3OV6R2RJXEPOHAM2BA'//16 random bytes is 26 base32 characters

//most of this will be in library0:


async function setOrCheckPassword(salt, passwordText) {
	const encoder = new TextEncoder();

	// PBKDF2 parameters
	const iterations = 100000;  // Number of iterations, should take around 100ms
	const keyLength = 32;       // Length of the derived key (256 bits)
	const hashAlgorithm = 'SHA-256'; // Hash function

	// Import the password as key material for PBKDF2
	const keyMaterial = await crypto.subtle.importKey(
		"raw",                          // Import the password as raw key material
		encoder.encode(passwordText),    // Encode the password as Uint8Array
		{ name: "PBKDF2" },              // Algorithm name
		false,                           // Not extractable
		["deriveBits", "deriveKey"]      // Usages
	);

	// Derive the key using PBKDF2 with the provided salt and iterations
	const key = await crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt,                    // Salt provided as Uint8Array
			iterations: iterations,        // Number of iterations (work factor)
			hash: hashAlgorithm            // Hashing algorithm
		},
		keyMaterial,
		{ name: "AES-GCM", length: keyLength * 8 }, // Derive a 256-bit key
		true,                          // Extractable
		["encrypt", "decrypt"]          // Usages
	);

	// Export the derived key as raw bytes (Uint8Array)
	return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}


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

*/


</script>
<template>

<div>
	<input type="text" v-model="inputValue" @input="myFunction1" placeholder="Type something..." />
	<button @click="myFunction2">Submit</button>
	<p>{{ outputText }}</p>
</div>

</template>
