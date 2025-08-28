//./server/api/otp.js
import {
} from 'icarus'

//  _        _         
// | |_ ___ | |_ _ __  
// | __/ _ \| __| '_ \ 
// | || (_) | |_| |_) |
//  \__\___/ \__| .__/ 
//              |_|    

/*
notes about TOTP, standardized in RFC6238

*/
//ttd august, maybe actually move this to icarus after all

export default defineEventHandler(async (workerEvent) => {
	return await doorWorker('POST', {useTurnstile: true, actions: [
		'Create1.',//first step of enrollment flow, we give the page what it needs to create the second factor
		'Create2.',//second step of enrollment flow, we validate the first code the user generates
		'Validate.',//later, the user is just signing in, we validate the code they entered
		'Remove.'//the user wants to remove their second factor, perhaps because they want to change it or set it up again after that
	], workerEvent, doorHandleBelow})
})
async function doorHandleBelow({door, body, action, browserHash}) {

/*
	let label = 'user@example.com'
	let issuer = 'cold3.cc'
	//label and issuer get into the user's authenticator app through the QR code, but do not get hashed

	if (action == 'Create1.') {

		let secret = new Secret({//create a new random secret for this user's TOTP enrollment
			size: 20,//20 bytes = 160 bits of entropy for the shared secret
		})
		let totp = new TOTP({//compute HMAC-SHA1(secret, counter) and truncate the hash value to ?? bytes
			secret,
			label,
			issuer,
			algorithm: 'SHA1',//HMAC-SHA1 is the RFC 6238 algorithm default, and SHA1 is secure when used with HMAC
			digits: 6,//length of the generated codes
			period: 30,//seconds each code is valid
		})

		/*
		Secret (160 bits) + Current Time → Token

		Specifically:
		1. Counter = floor(current_unix_time / 30)
		2. Hash = HMAC-SHA1(secret, counter)
		3. Truncate hash to 4 bytes using dynamic offset
		4. Convert to 6-digit number (modulo 10^6)
		*/
/*
		let manual = secret.base32//the shared secret in plaintext
		let uri = totp.toString()//same thing in a otpauth:// URL that we'll show on the page just this once, during enrollment, as a QR code
		//these two things we'll send back to the page, i think

		log(look({uri, manual}))
		//stopping here for a smoke test--look good Claude?
	}
/*
		// 2. Create otpauth:// URI for QR code
		const uri = totp.toString() 

		// 3. Store secret TEMPORARILY
		// DON'T save to permanent storage yet!

		// 4. Send to client
		return { 
		uri, 
		manualSecret: secret.base32 // for manual entry fallback
		}



/*
// 1. Server generates secret and provisional TOTP
const secret = Secret.fromRandom()
const totp = new TOTP({ 
  secret, 
  label: 'user@yourapp.com', // user's email/identifier
  issuer: 'YourAppName',
  digits: 6,
  period: 30 
})

// 2. Create otpauth:// URI for QR code
const uri = totp.toString() 
// Returns: otpauth://totp/YourAppName:user@yourapp.com?secret=BASE32SECRET&issuer=YourAppName

// 3. Store secret TEMPORARILY (session/memory)
// DON'T save to permanent storage yet!

// 4. Send URI to client for QR generation
return { uri, secret: secret.base32 } // secret for manual entry fallback

	/*
// Server: Generate secret
const secret = Secret.fromRandom()
const totp = new TOTP({ secret, label: 'user@email', issuer: 'YourApp' })
const uri = totp.toString() // Creates otpauth:// URI

// Server: Verify setup code
const isValid = totp.validate({ token: userEnteredCode, window: 1 })


// Server: Validate login code
const secret = Secret.fromBase32(storedUserSecret)
const totp = new TOTP({ secret })
const isValid = totp.validate({ token: userEnteredCode, window: 1 })

	*/



/*
out of band to do
[] rate limiting, using turnstile and also trail table
[] one time backup codes, going to leave these out for now but make a note about them
[] accepting previous and next codes in case the user's phone clock is a little off
*/












	log('hi from the worker, also')

	return {
		sticker: Sticker(),
	}
}
