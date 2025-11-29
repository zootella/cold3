//./src/auth.js ~ on the oauth trail, Auth.js configuration and handlers

import {
defined, toss, log, look, Now,
isCloud, Key, decryptKeys,
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
	let sources = []//collect possible sources of environment variables; there are a lot of them 😓
	if (defined(typeof process) && process.env) {
		sources.push({note: 'b10', environment: process.env})
	}//seeing b10 cloud only
	if (event?.platform?.env) {
		sources.push({note: 'b20', environment: event?.platform?.env})
	}//seeing b20 both local and cloud
	await decryptKeys('auth', sources)

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

				//seal up all the details about the user's completed oauth flow in an encrypted envelope only our servers can open
				let symmetric = encryptSymmetric(Key('envelope, secret'))
				let envelope = await symmetric.encryptObject({
					action: 'OauthDone.',
					expiration: Now() + Limit.handoffWorker,
					account, profile, user,
				})

				let url = `${originApex()}/oauth-done?envelope=${envelope}`
				log('Auth.js signIn() handler', look({account, profile, user, url}), `url length ${url.length}`)//claude thinks no provider will give us objects that get close to cloudflare's url length limit of 16,000 characters, which is great; see how big google and others are, ttd november
				return url
			},
			async redirect({url, baseUrl}) {//url is what we composed above, baseUrl is the root of this site
				return url//this looks like it doesn't do anything, but is us telling Auth yes, really go to url, even to a different subdomain
			},
		},
		session: {
			maxAge: 60,//seconds; intending us to identify our user with this cookie, Auth's default is 30 days
			updateAge: 0,//tell Auth.js to never refresh this cookie; it will expire naturally shortly
		},
		secret: Key('oauth, auth, secret'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}
	return authOptions
})
