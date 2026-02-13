//on the oauth trail: Auth.js configuration and handlers

import {
defined, toss, log, look, Time, Now, Limit, hasTag,
isCloud, Key, decryptKeys,
sealEnvelope, openEnvelope, hashText,
composeCookieName, composeCookieValue, parseCookieValue, cookieOptions,
originApex,
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
	/*
	note that SvelteKit's pattern for handling secrets is like:
import {SECRET_KEY_S1} from '$env/static/private'  //read static value built into server bundle when we deployed to cloudflare
import {env}           from '$env/dynamic/private' //read dynamic value from .env when running locally
	if (hasText(SECRET_KEY_S1)) {
		sources.push({note: 'b30', environment: {SECRET_KEY_S1}}) //wrap it back into an object to match what decryptKeys expects
	if (env) {
		sources.push({note: 'b40', environment: env})

	About b20: Cloudflare injects secrets from the dashboard (or wrangler.toml) into the request event at runtime, per-request. Not bundled — provided by the platform.

	About b10: The .env file in ./oauth/ gets bundled into the server bundle at build time. We see b10 in cloud only, meaning the build inlines these values into the deployed Worker code. Is this safe? Yes, because SvelteKit builds separate server and client bundles, and auth.js is only imported by hooks.server.js — a server-only entry point. The bundler has no import path to pull this code into the client bundle. But we're relying on import graph analysis, not enforcement.

	To switch to SvelteKit's intended pattern: use $env/static/private (build-time) or $env/dynamic/private (runtime) as shown above, adding sources b30/b40. The additional protection: if anyone accidentally imported auth.js from a .svelte component, SvelteKit would error at build time rather than silently bundling secrets into client code. icarus decryptKeys() works with plain objects, so either approach is compatible — the $env pattern just adds a build-time guardrail we currently get architecturally.

	ttd january, not going to mess with this now, but maybe should later, along with using xray.js to confirm the tracer locations
	*/

	let authOptions = {
		providers: [
			googleProvider({clientId:  Key('oauth, google, id'),  clientSecret: Key('oauth, google, secret')}),
			twitterProvider({clientId: Key('oauth, twitter, id'), clientSecret: Key('oauth, twitter, secret')}),
			githubProvider({clientId:  Key('oauth, github, id'),  clientSecret: Key('oauth, github, secret')}),
			discordProvider({clientId: Key('oauth, discord, id'), clientSecret: Key('oauth, discord, secret')}),
		],
		trustHost: true,//trust the incoming request's Host and X-Forwarded-Host headers to work with Cloudflare's reverse proxy
		callbacks: {

			async signIn({account, profile, user}) {//Auth calls our signIn() method once when the user and Auth have finished successfully with the third-party provider

				//get the browser tag from the cookie the main site gave the browser; envelope proves this browser got the oauth information
				let browserTag = parseCookieValue(event.cookies.get(composeCookieName()))//we can see the cookie here on a subdomain
				if (!hasTag(browserTag)) return false//Auth.js treats false as deny sign-in
				let browserHash = await hashText(browserTag)//browser tag is sensitive; hash it immediately

				//seal up all the details about the user's completed oauth flow in an encrypted envelope only our servers can open
				let envelope = await sealEnvelope('OauthDone.', Limit.handoffWorker, {account, profile, user, browserHash})//oauth envelope [3] seal done

				let url = `${originApex()}/oauth2?envelope=${envelope}`
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
		secret: Key('auth.js, secret'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}
	return authOptions
})

/*
what module should we use for oauth?
we want one high level enough that it has pluggable submodules specific to popular providers
and will iron out all the wrinkles between Twitter and Discord,
whether they use oauth v1 or 2, and PKCS, and so on
 _   _            _             _ _   _                         
| |_| |__   ___  | |_ _ __ __ _(_) | | |__   ___ _ __ ___       
| __| '_ \ / _ \ | __| '__/ _` | | | | '_ \ / _ \ '__/ _ \      
| |_| | | |  __/ | |_| | | (_| | | | | | | |  __/ | |  __/_ _ _ 
 \__|_| |_|\___|  \__|_|  \__,_|_|_| |_| |_|\___|_|  \___(_|_|_)
                                                                
🥾 a long trail led to @auth/sveltekit...
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

(5) so we tried to use @auth/core directly
which is lower level than being React or Next or Nuxt-specific
but still at a level where we get modules that know about specific providers
but couldn't get it working in Nuxt

(6) so we arrived at Auth.js on SvelteKit
choosing SvelteKit instead of Next.js, because React is awful
as Auth.js has currently mainted modules for those two frameworks (but not Nuxt)
we had to create a third serverless workspace, oauth, alongside Nuxt and Lambda
it's SvelteKit, cloudflare workers, oauth.cold3.cc subdomain

getting the SvelteKit through an OAuth flow wasn't too hard
but then everything about secrets
and encrypted envelopes and redirects between Nuxt and SvelteKit was significant
as well as the additional third project, scaffold, framework, workspace, deploy, and website

another thing that made the search difficult is most of these solutions
want to be your whole user identity and user management system
but then they'd make a bunch of cookies that require a warning, or expire users after 30 days
and come in with their own logic and practices for how a user changes how they sign in
and through all that they, not us, own all the users. great for them and bad for us!

we're looking for a way a person at a browser can prove to our server, just once, right now
that they control a third party social media account
and get some information about their identity there, like their id, name, and email

in researching this now, also found this similar rant:
https://www.better-auth.com/docs/comparison
*/
