//./server/api/otp.js
import {
} from 'icarus'
import {Secret, TOTP} from 'otpauth'//importing here, not in icarus, as only a nuxt server endpoint needs otpauth, ttd august

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

	let label = 'alice-addams@example.com'//identifies the user and the user's enrollment; use email or username (note for later, what will we use? so we identify users by nanoid, like "jS88ShfXDfZvxrQZJdxhK", we obviously don't show that to the user much, but it's not a secret (they may sometimes see it in urls, for instance), and they can change their email, or have two emails. note to ask about this later. does this show up in the authenticator app? if we used email, and then they changed their email, would they still be able to get in, concerns like this and others. so we want to be simple and standard and secure here--what's the right way to code this flow for a site that identifies users by a UUID??)
	let issuer = 'BobsSiteName'//service identifier that identifies this enrollment in the user's authenticator app; identifies us, the website the user is authenticating to
	//i think this stuff won't come directly from the page, but rather at this point be trusted valid identity the server knows based on the user at the page's existing first-factor authentication. for instance, we know that the cookie their browser sent means that user Alice is signed in on the page right now

	if (action == 'Create1.') {

		let secret = new Secret({//create a new random secret for this user's TOTP enrollment (which will live and be shared between two places, the user's authenticator app, and the server's database)
			size: 20,//20 bytes = 160 bits of entropy for the shared secret (shared by whom? the server and the user's authenticator app, is my guess??) (also, if i make this bigger, does the qr code become more dense?), 32 base32 characters in the otpauth: URL and QR code
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

	log('hi from the worker, also')

	return {
		sticker: Sticker(),
		looked: look({Secret, TOTP}),
	}
}
