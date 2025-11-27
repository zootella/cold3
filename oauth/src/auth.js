//./src/auth.js ~ on the oauth trail, Auth.js configuration and handlers

import {
defined, toss, log, look, Now,
Key, decryptKeys,
encryptSymmetric, originApex,
} from 'icarus'

import {SvelteKitAuth} from '@auth/sveltekit'
import googleProvider  from '@auth/sveltekit/providers/google'
import twitterProvider from "@auth/sveltekit/providers/twitter"//𝕏, of course, but Auth.js still calls it twitter
import githubProvider  from '@auth/sveltekit/providers/github'
import discordProvider from '@auth/sveltekit/providers/discord'
import twitchProvider  from '@auth/sveltekit/providers/twitch'
import redditProvider  from '@auth/sveltekit/providers/reddit'

export const {handle, signIn, signOut} = SvelteKitAuth(async (event) => {
	let sources = []
	if (defined(typeof process) && process.env) {
		sources.push({note: '300: process.env', environment: process.env})
	}//seeing 300 cloud, only
	if (event?.platform?.env) {
		sources.push({note: '310: event.platform.env', environment: event?.platform?.env})
	}//seeing 310 both, local and cloud
	await decryptKeys('sveltekit worker', sources)

	let authOptions = {
		providers: [
			googleProvider({clientId:  Key('oauth, google,  id'), clientSecret: Key('oauth, google,  secret')}),
			twitterProvider({clientId: Key('oauth, twitter, id'), clientSecret: Key('oauth, twitter, secret')}),
			githubProvider({clientId:  Key('oauth, github,  id'), clientSecret: Key('oauth, github,  secret')}),
			discordProvider({clientId: Key('oauth, discord, id'), clientSecret: Key('oauth, discord, secret')}),
		],
		trustHost: true,//trust the incoming request's Host and X-Forwarded-Host headers to work with Cloudflare's reverse proxy
		callbacks: {

			async signIn({account, profile, user}) {//Auth calls our signIn() method once when the user and Auth have finished successfully with the third-party provider
				log('hi from auth signIn', look({account, profile, user}))

				//seal up all the details about the user's completed oauth flow
				let symmetric = encryptSymmetric(Key('envelope, secret'))
				let envelope = await symmetric.encryptObject({dated: Now(), action: 'OauthDone.', account, profile, user})
				return `${originApex()}/oauth-done?envelope=${envelope}`//and return them, and the user, to the main site with a GET

				//ok, but in proper and expected use of Auth.js with auth sveltekit, is this the right way to do a concluding redirect?
			},

			async redirect({url, baseUrl}) {//Auth calls after successful sign in

			}
		},
		session: {
			maxAge: 900,//15 minutes in seconds; intending us to identify our user with this cookie, Auth's default is 30 days
			updateAge: 0,//tell Auth.js to never refresh this cookie; it will expire naturally shortly
		},
		secret: Key('oauth, auth, secret'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}
	return authOptions
})
