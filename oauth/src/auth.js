//in the [oauth.cold3.cc] [SvelteKit] workspace using [@auth/sveltekit], this is the file ./src/auth.js

import {

//manual icarus import block for sveltekit
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt, commas,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,
safefill, deindent,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

Key, accessKey, canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,

//additional imports we need here that aren't part of the repeated block above
decryptKeys,

} from 'icarus'

/*
//ttd november, researched but not tested, how to inject a secret into the sveltekit server bundle
import {SECRET_KEY_S1}  from '$env/static/private'//read static value built into server bundle when we deployed to cloudflare
import {env} from '$env/dynamic/private'//read dynamic value from .env when running locally
*/

import {SvelteKitAuth} from '@auth/sveltekit'
import googleProvider  from '@auth/sveltekit/providers/google'
import twitterProvider from "@auth/sveltekit/providers/twitter"//𝕏, of course, but Auth.js still calls it twitter
import githubProvider  from '@auth/sveltekit/providers/github'
import discordProvider from '@auth/sveltekit/providers/discord'
import twitchProvider  from '@auth/sveltekit/providers/twitch'
import redditProvider  from '@auth/sveltekit/providers/reddit'

export const {handle, signIn, signOut} = SvelteKitAuth(async (event) => {
	const access = await getAccess(event.platform.env)//give getAccess() the environment variable object like process.env
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: '300: process.env', environment: process.env})
	}//seeing 300 cloud, only
	if (event?.platform?.env) {
		sources.push({note: '310: event.platform.env', environment: event?.platform?.env})
	}//seeing 310 both, local and cloud
	/*
	//ttd november, additional possible key sources from above
	if (hasText(SECRET_KEY_S1)) {
		sources.push({note: '320: $env/static/private', environment: {SECRET_KEY_S1}})//wrap it back into an object
	}
	if (env) {
		sources.push({note: '330: $env/dynamic/private', environment: env})
	}
	*/
	await decryptKeys('sveltekit worker', sources)

	let authOptions = {
		providers: [
			googleProvider({clientId:  access.get('ACCESS_AUTH_GOOGLE_ID'),  clientSecret: access.get('ACCESS_AUTH_GOOGLE_SECRET')}),
			twitterProvider({clientId: access.get('ACCESS_AUTH_TWITTER_ID'), clientSecret: access.get('ACCESS_AUTH_TWITTER_SECRET')}),
			githubProvider({clientId:  access.get('ACCESS_AUTH_GITHUB_ID'),  clientSecret: access.get('ACCESS_AUTH_GITHUB_SECRET')}),
			discordProvider({clientId: access.get('ACCESS_AUTH_DISCORD_ID'), clientSecret: access.get('ACCESS_AUTH_DISCORD_SECRET')}),
		],
		trustHost: true,//trust the incoming request's Host and X-Forwarded-Host headers to work with Cloudflare's reverse proxy
		callbacks: {

			async signIn({account, profile, user}) {//Auth calls our signIn() method once when the user and Auth have finished successfully with the third-party provider

				log('proof has arrived ✉️', look({account, profile, user}))

				return true
				/*
				let proof = ''//ttd june2025, we'll bundle and sign the proof of identity to send it back to the main site, which has the database connection
				return 'https://cold3.cc/oauth-done?proof='+proof//instead of a separate redirect() method alongside signIn(), which should do the same thing
				*/
			},
		},
		session: {
			maxAge: 900,//15 minutes in seconds; intending us to identify our user with this cookie, Auth's default is 30 days
			updateAge: 0,//tell Auth.js to never refresh this cookie; it will expire naturally shortly
		},
		secret: access.get('ACCESS_AUTH_SECRET'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}
	return authOptions
})






/*
ttd june2025
so you don't need any of the below, you do get the raw result in signIn as profile, and the normalized as user!

	//google, https://console.cloud.google.com/apis/credentials
	//also must verify site ownership, https://search.google.com/search-console/ownership
	//and google deletes if no activity for 6 months, https://support.google.com/cloud/answer/15549257#unused-client-deletion
	if (false) googleSettings.profile = (raw) => {//we're replacing Auth.js's response parsing function with our own
		return {
			//1 match Auth.js's profile parsing for google
			id:             raw.sub,//"108691239685192314259"
			name:           raw.name,//"Jane Doe"
			email:          raw.email,//"jane.doe@gmail.com"
			image:          raw.picture,
			email_verified: raw.email_verified,

			//2 augment with our own customizations
			//no handle, google doesn't give users a named public page
			emailVerified: raw.email_verified,

			//3 also include the provider name, for convenience, and the whole response to be able to see it later
			provider: 'google',
			response: raw,
		}
	}

	//X, https://developer.x.com/en/portal/projects-and-apps
	if (false) twitterSettings.profile = (raw) => {
		return {
			id:    raw.data.id,//"2244994945"
			name:  raw.data.name,//"Jane Doe"
			email: undefined,//we could get email with more permissions and another request, though
			image: raw.data.profile_image_url,//matches Auth.js's profile() for twitter

			handle: raw.data.username,//"janedoe_123", the @handle

			provider: 'twitter',
			response: raw,
		}
	}

	//github, github.com, Your Organizations, Settings, left bottom Developer settings, OAuth Apps
	if (false) githubSettings.profile = (raw) => {
		return {
			tomato: '',//see if you can get this to run at all

			id:    String(raw.id),//"9837451" arrives as a number so turn it into text
			name:  raw.name ?? raw.login,//"Jane Doe"
			email: raw.email,//like "9837451+janedoe@users.noreply.github.com" from response.email; often a disposable forwarding address if the user at github has chosen keep my email private; no email verified
			image: raw.avatar_url,

			handle: raw.login,//"janedoe"

			provider: 'github',
			response: raw,
		}
	}

	//discord, https://discord.com/developers/applications
	if (false) discordSettings.profile = (raw) => {
		return {
			id:    raw.id,//"80351110224678912"
			name:  raw.username,//"JaneDoe"
			email: raw.email,//"jane.doe@gmail.com"
			image: raw.avatar ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png` : null,

			handle:        `${raw.username}#${raw.discriminator}`,//like "JaneDoe#8890"
			emailVerified: raw.verified,//true if user has verified email with discord

			provider: 'discord',
			response: raw,
		}
	}
*/










			/*
			ttd june2025, i think we don't need any of this anymore

			//Auth calls this once after the person as the browser is back from the provider, and our server has proof they control a social media account
			async jwt({account, profile, token}) {//token is the current JWT object, empty on first sign-in; profile is the normalized user profile Auth mapped from the raw JSON response from the provider, with our additions above
				try {
					if (profile && account) proofHasArrived(token, profile, account)//check profile and account so our code runs only at the end of successful oauth flow, not on a session check or malicious hit to /api/auth/session
				} catch (e) { console.error(e) }//ttd june2025, hook this into datadog when you have that; here's another entrypoint from framework code to your code that you should isolate and protect in the normal way
				return token//Auth expects our jwt() function to always return the token object it gives us
			},
			//ttd june2025, more common unhappy path is user says no to twitter, just closes the tab; be able to see those unfinished flows in the database as they will go 100% if the provider breaks or turns us off, too!

			//ttd june2025, signIn lets us look at the profile object and return a redirect route; won't need this later, probably

			/* ttd june2025, to get details on the query string, we're using signIn(), and don't need redirect()
			//Auth calls this right afterwards asking us where we should send the user who is finished
			async redirect({
				url,//Auth gives us our callbackUrl from the starting link like "/api/auth/signin/twitter?callbackUrl=/whatever"
				baseUrl,//and the domain of our own site, like "https://oursite.com"
			}) {//return like "/done-page" and Auth will use this in the finishing 302 redirect that exits the user finishing the flow
				return '/oauth-done'
			},
			*/

		/*
		Auth.js uses essential cookies 🍪 to carry necessary state through the different steps of OAuth
		when twitter or whatever provider redirects back to /api/auth/callback,
		Auth.js writes a signed session token into this cookie so that it can confirm,
		here on the server, which user just authenticated

		Auth's intent is that then we'll use this cookie to identify the user long term, but we don't
		so, we set its expiration to 15 minutes, matching the cookies Auth uses just for the handshake
		why not zero? just in case zero might mess something up with some provider now,
		or cause an error later, if a provider changes something on their end
		those kinds of errors can be really hard to identify and diagnose

		by default, Auth.js sets these secure attributes on its cookie
		HttpOnly:  true       prevents JavaScript (including page scripts & extensions) from accessing it
		SameSite:  "lax"      only sent on top‐level navigations (e.g. the OAuth callback redirect), but not on cross-site subrequests
		Secure:    true       only transmitted over HTTPS connections, not HTTP
		Path:      "/"        sent on every request to our domain
		Domain:    (omitted)  defaults to the exact host serving it; third‐party domains cannot read or send it
		*/







/*
what module should we use for oauth?
we want one high level enough that it has pluggable submodules specific to popular providers
and will iron out all the wrinkles between Twitter and Discord,
whether they use oauth v1 or 2, and PKCS, and so on

 _   _            _             _ _   _
| |_| |__   ___  | |_ _ __ __ _(_) | | |__   ___ _ __ ___
| __| '_ \ / _ \ | __| '__/ _` | | | | '_ \ / _ \ '__/ _ \
| |_| | | |  __/ | |_| | | (_| | | | | | | |  __/ | |  __/
 \__|_| |_|\___|  \__|_|  \__,_|_|_| |_| |_|\___|_|  \___|

a long trail led to @auth/core...
(1) there are turnkey identity providers like auth0.com
but a service provider can become slow, unreliable, expensive,
or require immediate developer attention to stay aligned with an update,
or they can go out of business,
or just deplatform you, without warning, cause, reinstatement, or recourse

ok, so how about npm modules
(2) Passport.js is the leader, with 3.5 million weekly downloads,
and with over 500 provider-specific strategies
but, it's Express middleware, intended for a regular server and Node
and we don't have Express, Node, or even a server!

(3) Auth.js, formerly NextAuth, has 1.4 million weekly downloads
https://www.npmjs.com/package/next-auth
but is specific to Next.js, which is React; we are Nuxt and Vue

but Auth's rebrand is about branching out to support all popular frameworks:
https://authjs.dev/getting-started/integrations
(4) and there's one for Nuxt, but it's status is "Open PR",
linking to a github thread with lots of waiting and disappointment:
https://github.com/nextauthjs/next-auth/pull/10684

(5) so our strategy is to use @auth/core, the core of Auth.js
which is lower level than being React or Next or Nuxt-specific
but still at a level where we get modules that know about specific providers

(ttd june2025, and then that didn't work, so we got NextAuth working in Next.js, and then Auth.js for SvelteKit working, and have made a completely separate website with sveltekit at a subdomain and are working on the links there and back)

another thing that made the search difficult is most of these solutions
want to be your whole user identity and user management system
but then they'd make a bunch of cookies that require a warning, or expire users after 30 days
and come in with their own logic and practices for how a user changes how they sign in
and through all that they, not us, own all the users. great for them and bad for us!

we're looking for a way a person at a browser can prove to our server, just once, right now
that they control a third party social media account
and get some information about their identity there, like their id, name, and email

also, none of this search was about web3 or crypto wallets!
that's a whole second world of solutions of all these types that's still on the backlog

in researching this now, also found this similar rant:
https://www.better-auth.com/docs/comparison
*/






/*
 _                      ___    _         _   _                          _
| |__   _____      __  / _ \  / \  _   _| |_| |__   __      _____  _ __| | _____
| '_ \ / _ \ \ /\ / / | | | |/ _ \| | | | __| '_ \  \ \ /\ / / _ \| '__| |/ / __|
| | | | (_) \ V  V /  | |_| / ___ \ |_| | |_| | | |  \ V  V / (_) | |  |   <\__ \
|_| |_|\___/ \_/\_/    \___/_/   \_\__,_|\__|_| |_|   \_/\_/ \___/|_|  |_|\_\___/


(1) user starts out on our page to sign up or sign in
user clicks "Continue with Twitter"
which is a regular link to a route Auth handles

	GET https://oursite.com/api/auth/signin/twitter

(2) Auth returns a response from our server to the browser, setting two cookies
Auth makes a new random CSRF_TOKEN and hashes it with ACCESS_AUTHJS_SIGNING_KEY_SECRET
STATE_NONCE is another random string for this user's trip through the flow,
which Auth both saves in a cookie and sends to Twitter
the response also redirects the browser to Twitter's page

	HTTP/1.1 302 Found
	Set-Cookie: __Host-next-auth.csrf-token=CSRF_TOKEN|HASH_OF_CSRF_TOKEN; Path=/api/auth; HttpOnly; Secure; SameSite=Lax
	Set-Cookie: __Host-next-auth.state=STATE_NONCE; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=900
	Location: https://twitter.com/i/oauth2/authorize?
		client_id=<OUR_CLIENT_ID>& -- stored in server secrets; we got from Twitter's developer dashboards
		redirect_uri=https%3A%2F%2Foursite.com%2Fapi%2Fauth%2Fcallback%2Ftwitter& -- set here and in dashboards
		response_type=code& -- we want an authorization code
		scope=users.read& -- ask your user to give us permission to read their user information
		state=<STATE_NONCE> -- a random nonce to identify this request, and prevent replay

Twitter's page shows the user consent details
the user signs in if they are not signed in already
the user clicks to approve the oauth connection and permissions our site is asking for
POSTs from the Twitter page to Twitter's backend happen as the user does all this, not described here

(3) once Twitter has identified the person as one of their users, and gained consent,
Twitter responds to the browser with a redirect sending them back to our site

	HTTP/1.1 302 Found
	Location: https://oursite.com/api/auth/callback/twitter?
		code=<AUTH_CODE>& -- a short lived code we'll use in a moment
		state=<STATE_NONCE> -- back from Twitter, must match the cookie

navigating to that location, the browser includes the cookies

	GET /api/auth/callback/twitter?code=<AUTH_CODE>&state=STATE_NONCE -- here the page could tamper with this value
	Host: oursite.com
	Cookie:
		__Host-next-auth.csrf-token=CSRF_TOKEN|HASH_OF_CSRF_TOKEN
		__Host-next-auth.state=STATE_NONCE -- here the page can't tamper with this value; only our server could set it

this calls into an Auth route, so Auth runs on our server behind the scenes
Auth uses ACCESS_AUTHJS_SIGNING_KEY_SECRET to compute a matching HASH_OF_CSRF_TOKEN
the STATE_NONCE in the query string and cookie must match,
proving the browser contacting our server now is the same one that started the flow

(4) Auth POSTs to Twitter's backend
note that AUTH_CODE came from Twitter, but was told to our server by our page, which could have tampered with it
so, Auth sends it to Twitter, server to server, to verify it's authentic

	POST https://api.twitter.com/2/oauth2/token
	Content-Type: application/x-www-form-urlencoded
	- - - -
	grant_type=authorization_code&
	client_id=<OUR_CLIENT_ID>&
	client_secret=<OUR_CLIENT_SECRET>& -- as this is server to server, includes our password to Twitter's API
	code=<AUTH_CODE>&
	redirect_uri=https%3A%2F%2Foursite.com%2Fapi%2Fauth%2Fcallback%2Ftwitter

	{
		"token_type": "bearer",
		"access_token": "<ACCESS_TOKEN>", -- Twitter gives Auth a token to use next
		"expires_in": 7200, -- which only lasts 2 hours
		"scope": "users.read"
	}

that POST also uses AUTH_CODE to get ACCESS_TOKEN
a second GET uses ACCESS_TOKEN to get information about the Twitter user

	GET https://api.twitter.com/2/users/me
	Authorization: Bearer <ACCESS_TOKEN>

	{
		"data": {
			"id": "123456789",
			"name": "Jane Doe",
			"username": "janedoe"
		}
	}

After doing all that behind the scenes, Auth calls the jwt() function we wrote,
letting our code associate this browser with our user who we know controls that Twitter account

(5) Auth then calls our redirect() function, which tells Auth where to go when we're all done

	HTTP/1.1 302 Found
	Set-Cookie: __Secure-next-auth.session-token=<JWT_PAYLOAD…>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
	Location: /done

There's more that can happen, like PKCE, but this describes a real, albeit simple, flow
*/
