//in the [oauth.cold3.cc] [SvelteKit] workspace using [@auth/sveltekit], this is the file ./src/auth.js

import {SvelteKitAuth} from '@auth/sveltekit'
import googleProvider  from '@auth/sveltekit/providers/google'
import twitterProvider from "@auth/sveltekit/providers/twitter"//𝕏, of course, but Auth.js still calls it twitter
import githubProvider  from '@auth/sveltekit/providers/github'
import discordProvider from '@auth/sveltekit/providers/discord'
import twitchProvider  from '@auth/sveltekit/providers/twitch'
import redditProvider  from '@auth/sveltekit/providers/reddit'

export const {handle, signIn, signOut} = SvelteKitAuth(async (event) => {

	let authOptions = {
		providers: [
			googleProvider({clientId:  event.platform.env.AUTH_GOOGLE_ID,  clientSecret: event.platform.env.AUTH_GOOGLE_SECRET}),
			twitterProvider({clientId: event.platform.env.AUTH_TWITTER_ID, clientSecret: event.platform.env.AUTH_TWITTER_SECRET}),
			githubProvider({clientId:  event.platform.env.AUTH_GITHUB_ID,  clientSecret: event.platform.env.AUTH_GITHUB_SECRET}),
			discordProvider({clientId: event.platform.env.AUTH_DISCORD_ID, clientSecret: event.platform.env.AUTH_DISCORD_SECRET}),
		],
		trustHost: true,//trust the incoming request's Host and X-Forwarded-Host headers to work with Cloudflare's reverse proxy
		callbacks: {

			async signIn({account, profile, user}) {//Auth calls our signIn() method once when the user and Auth have finished successfully with the third-party provider

				console.log('proof has arrived ✉️', JSON.stringify({account, profile, user}, null, 2))//ttd june, stringify to avoid [Object object]

				return true
				/*
				let proof = ''//todo, we'll bundle and sign the proof of identity to send it back to the main site, which has the database connection
				return 'https://cold3.cc/oauth-done?proof='+proof//instead of a separate redirect() method alongside signIn(), which should do the same thing
				*/
			},
		},
		session: {
			maxAge: 900,//15 minutes in seconds; intending us to identify our user with this cookie, Auth's default is 30 days
			updateAge: 0,//tell Auth.js to never refresh this cookie; it will expire naturally shortly
		},
		secret: event.platform.env.AUTH_SECRET,//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}
	return authOptions
})

