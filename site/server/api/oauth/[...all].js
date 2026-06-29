//on the oauth trail: prove a user controls a third-party account and link it as a credential

/*
The user clicks "Continue with Discord" (or Google, Twitter, GitHub). This catch-all owns every url under /api/oauth/* —
@auth/core routes on the path internally (/api/oauth/signin/discord, /api/oauth/callback/discord, ...), runs the OAuth
dance with the provider, and when it finishes calls our signIn() callback below. There we write the proof as a credential
row directly, because the database lives in this same worker.

why Auth.js (@auth/core): we wanted one library high-level enough to ship pluggable per-provider modules — each one knows
that provider's quirks (OAuth1 vs OAuth2, PKCE, GitHub's separate /user/emails fetch, Twitter's v2 profile wrapper) and
irons them out for us — so this file stays declarative: a clientId and clientSecret per provider, nothing more.
*/

import {Auth, skipCSRFCheck} from '@auth/core'//skipCSRFCheck tells @auth/core to treat the request's csrf as already verified; the client starts the flow with an empty form POST (no csrf token), so we skip Auth.js's csrf check and rely on browser same-origin protection plus our own checks
import googleProvider  from '@auth/core/providers/google'
import twitterProvider from '@auth/core/providers/twitter'//𝕏, of course, but Auth.js still calls it twitter
import githubProvider  from '@auth/core/providers/github'
import discordProvider from '@auth/core/providers/discord'
//import twitchProvider  from '@auth/core/providers/twitch'
//import redditProvider  from '@auth/core/providers/reddit'//twitch and reddit, ready to go: uncomment these and add them to the providers list below once we have their keys — commented for now so the bundler doesn't warn about unused imports
import {toWebRequest} from 'h3'//converts the nitro event to a web Request; h3 also auto-sends a returned web Response, so the handler is just: return Auth(toWebRequest(event), authOptions)
import {
decryptKeys, hashText, originApex,
credentialBrowserGet, credentialOauthChallenge, credentialOauthParse, credentialOauthSet, oauthProviders,
} from 'icarus'//Key, hasTag, toss, log, look, logAudit, sealEnvelope, Limit, setResponseStatus, defined are auto-globalized in site/server by icarusServerPlugin; these are not, so import them (same pattern as credential.js)

export default defineEventHandler(async (event) => {//the outer membrane around the Auth.js callback we host — same shape as doorWorker: catch anything our own code or Auth.js throws and forward it to error3, rather than letting it escape as a bare 500. (we can't wear doorWorker itself here: it blocks GET, and the oauth flow's responses are redirects, not json tasks)
	try {
		return await runOauth(event)
	} catch (e) {//our own code or Auth.js itself threw (a db write below, a decryptKeys failure, an Auth.js crash) — ours or our infra, not the provider
		try {
			//forward it to error3, which logs it to Datadog and blows up error.vue. we deliberately don't log here: error3 is the single place that does, so both feeders — this membrane and the governance block in runOauth — reach it identically
			let envelope = await sealEnvelope('Error3.', Limit.handoff, {error: e})
			return new Response(null, {status: 303, headers: {location: `/error3?envelope=${envelope}`}})
		} catch (e2) { console.error('[OUTER] oauth', e2, e); setResponseStatus(event, 500); return null }//if the seal itself fails (e.g. keys never decrypted), last-resort console + 500, mirroring doorWorker's nested catch
	}
})

async function runOauth(event) {//the flow itself; the membrane above runs this for every url under /api/oauth/* — Auth.js routes on the path internally (/api/oauth/signin/discord, /api/oauth/callback/discord, ...)

	let sources = []//collect possible sources of environment variables; there are a lot of them 😓
	if (defined(typeof process) && process.env)   sources.push({note: 'a10', environment: process.env})//env built into the worker bundle at deploy
	if (event?.context?.cloudflare?.env)          sources.push({note: 'a20', environment: event.context.cloudflare.env})//the cloudflare runtime env nitro hangs on the request event
	await decryptKeys('oauth', sources)//must run here at the top so Key() works below and the credential functions can reach the database; self-guards with _alreadyDecrypted, so it's a no-op if doorWorker already decrypted in this isolate

	let authError//@auth/core catches its in-flow errors and only hands us a normalized type via the ?error= redirect below — but its logger.error fires with the real error first, so we stash it here to report the underlying cause too
	let authOptions = {
		basePath: '/api/oauth',//Auth.js parses the action and provider from the path under this prefix; the redirect_uri it hands each provider becomes <origin>/api/oauth/callback/<provider>
		trustHost: true,//trust the incoming request's Host and X-Forwarded-Host headers to work with Cloudflare's reverse proxy
		skipCSRFCheck,//the symbol imported above; skips Auth.js's csrf check for the flow's empty form POST
		pages: {//both point at the panel and just carry Auth's ?error=<type>; the governance block after Auth() below reads that type and decides what actually happens (per oauth.md)
			signIn: '/page1',//Auth.js sends cancels and denied sign-ins here (our signIn() returning false, which Auth wraps as AccessDenied)
			error: '/page1',//Auth.js sends thrown-callback errors and misconfigurations here
		},
		providers: [
			googleProvider({clientId:  Key('oauth, google, id'),  clientSecret: Key('oauth, google, secret')}),
			twitterProvider({clientId: Key('oauth, twitter, id'), clientSecret: Key('oauth, twitter, secret')}),
			githubProvider({clientId:  Key('oauth, github, id'),  clientSecret: Key('oauth, github, secret')}),
			discordProvider({clientId: Key('oauth, discord, id'), clientSecret: Key('oauth, discord, secret')}),
		],
		callbacks: {

			async signIn({account, profile, user}) {//Auth calls our signIn() method once when the user and Auth have finished successfully with the third-party provider

				//the middleware reads or makes a browser tag on every request and leaves it in context; it identifies the browser, and through it the user signed in here
				let browserTag = event.context.browserTag
				if (!hasTag(browserTag)) return false//Auth.js treats false as deny sign-in
				let browserHash = await hashText(browserTag)//browser tag is sensitive; hash it immediately

				//oauth is a credential we attach to an existing account, so someone must be signed in at this browser
				let signedIn = await credentialBrowserGet({browserHash})
				if (!signedIn) return false//no one to attach the proof to; deny

				//identify which provider this is against our whitelist (Auth.js may be configured with more providers than our .env.keys list)
				let providerInfo = oauthProviders().find(p => p.name == account?.provider)
				if (!providerInfo) return false//a provider came back that isn't in our list

				//write the credential row: parse the provider-specific fields and store the proof
				let parsed = credentialOauthParse(providerInfo.tag, {account, profile, user})//per-provider field extraction lives in level3; this handler stays dumb
				let result = await credentialOauthSet({userTag: signedIn.userTag, ...parsed})
				logAudit('oauth done', {browserHash, userTag: signedIn.userTag, account, profile, user, outcome: result.outcome})//accumulate real examples of oauth provider responses, which carry lots of provider-specific detail and can be different or broken in unexpected ways at any time
				log('Auth.js signIn() handler', look({account, profile, user, outcome: result.outcome}))//operational visibility in datadog, separate from the audit store above

				//on success the panel shows the freshly-linked row on its next Get, so it needs no message. on a collision we wrote nothing: OauthClaimedElsewhere. owes the user an explanation — they proved control, but another cold3 user already holds this provider identity — so hand back a one-shot ?oauth-done hint the panel reads and strips. OauthAlreadyLinked. is the rare same-account re-prove (a stale tab) and stays silent; the panel just shows it linked
				if (result.outcome == 'OauthClaimedElsewhere.') return '/page1?oauth-done=ClaimedElsewhere'
				return '/page1'//send the browser back to the credential panel; ttd november2025, will change to welcome, home, or dashboard depending on the user's aim proving oauth
			},
			//signIn returns a same-origin path, so Auth.js's default redirect handling is enough — no redirect() callback needed
		},
		session: {//we never read Auth.js's session — our own browserTag identifies the user and signIn writes the row directly — so these just shrink the session cookie Auth.js sets anyway to a brief, unrefreshed life
			maxAge: 60,//seconds; Auth's default is 30 days
			updateAge: 0,//never refresh it; it expires on its own
		},
		secret: Key('auth.js, secret'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
		logger: {error(e) { authError = e }},//capture the real error @auth/core caught before it normalizes to a ?error= type; setLogger only overrides the level we pass, so warn/debug keep their defaults
	}

	//when a flow starts (the signin action) record an audit-trail event-3 row that we're sending this user into the provider — the funnel "started" marker, paired with the "oauth done" completion logged in signIn above
	let [authAction, authProviderName] = (event.path.split('?')[0].split('/api/oauth/')[1] || '').split('/')//the action and provider Auth.js routes on, e.g. signin / discord
	if (authAction == 'signin' && hasTag(event.context.browserTag)) {
		let signedIn = await credentialBrowserGet({browserHash: await hashText(event.context.browserTag)})
		let providerInfo = oauthProviders().find(p => p.name == authProviderName)
		if (signedIn && providerInfo) await credentialOauthChallenge({userTag: signedIn.userTag, provider: providerInfo.tag})
	}

	let response = await Auth(toWebRequest(event), authOptions)//run the flow

	//Auth.js hands a cancel or an error back as a redirect to our pages.* carrying ?error=<type>. read it here (keys are decrypted) and sort it by governance: could only WE have caused this, or could the provider have?
	let errorType = new URL(response.headers.get('location') || '/', originApex()).searchParams.get('error')
	if (errorType == 'Configuration') {//our bug to fix. Configuration is also @auth/core's fallback bucket for any non-client-safe error (a bad secret, a malformed provider, our own signIn callback throwing), so it catches the unexpected too. (add more types here if auth.js surfaces other our-fault ones)
		//@auth/core catches its in-flow errors and hands them back as this ?error= redirect rather than throwing, so the membrane never sees them on its own. bridge them: toss here, and the membrane above catches it and seals Error3. → error3.vue → Datadog + error.vue, the one place that does
		toss('oauth', {errorType, path: event.path, error: authError})
	} else if (errorType) {//a provider changing things on us (loves us monday, hates us tuesday), or a user cancelling at the provider — not ours to fix
		logAudit('oauth sad path', {errorType, path: event.path, error: authError})//don't crash the site; record the provider interaction for the team to analyse — and the underlying error disambiguates the shared OAuthCallbackError type (a user declining vs our own misconfig, like a wrong secret or unregistered redirect uri)
		//the attempt didn't complete — most often the user cancelled at the provider, sometimes startled the provider window even appeared. rather than drop them on a bare /page1 with no idea what happened, hand back a one-shot ?oauth-done hint the panel reads and strips, nudging them to try again
		return new Response(null, {status: 303, headers: {location: '/page1?oauth-done=Cancelled'}})
	}
	return response
}

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

🥾 a long trail led to @auth/core...

(1) there are turnkey identity providers like auth0.com
but a service provider can become slow, unreliable, expensive,
or require immediate developer attention to stay aligned with an update,
or they can go out of business,
or just deplatform you, without warning, cause, reinstatement, or recourse

ok, so how about npm modules?
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

(6) so we got things working at Auth.js on SvelteKit
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

(7) and then, after living on the SvelteKit workspace for a while,
we went back and got step (5) to work
the thing the first @auth/core-in-Nuxt attempt missed was a cross-cut:
use @auth/core *together with* its provider modules,
but *without* any framework adapter at all!

Auth.js is really three layers, and only the bottom two do the work
@auth/core is the engine: one function, Auth(request, config) -> response,
a web Request in and a web Response out, all Web Crypto, no Node,
nothing that knows about an http server

the provider modules (@auth/core/providers/discord, google, ...) are pure config:
a clientId, a clientSecret, and a profile() mapper that normalizes the provider's answer
and the framework adapters (@auth/sveltekit, next-auth) are the thin top layer:
about twenty lines bridging a framework's http idiom to that one Auth() call
the engine and the providers never needed the adapter

And Nuxt already gives us the bridge the adapter would:
h3 (what nitro runs) has toWebRequest(event) to make a web Request from the nitro event,
and it auto-sends a returned web Response — so this whole endpoint is, at heart,
return Auth(toWebRequest(event), authOptions)

the one piece of adapter magic that actually mattered is skipCSRFCheck:
it's a symbol, and @auth/core skips its csrf check only on an identity test against that exact symbol
an adapter sets it for you inside a quiet setEnvDefaults pass
we import the symbol and set it ourselves,
because our client opens the flow with an empty form POST that carries none of Auth's csrf token

the payoff is that the whole cross-origin contraption from (6) evaporates
with the engine running inside the apex worker,
our signIn callback reaches the database directly and writes the credential row right there
the browser's identity comes straight off event.context.browserTag, where the middleware already left it,
instead of a hash sealed at the apex and re-checked across a subdomain
and the two cookies coexist on one response because h3's sendWebResponse appends Set-Cookie instead of clobbering,
so the middleware's browser-tag cookie rides right alongside Auth.js's own

one rule, because the versioning bites: @auth/core is permanently pre-1.0 on purpose:
you pin it to the exact version the maintained adapter was built against
(today ^0.41.2, what @auth/sveltekit blesses), NOT npm's `latest`,
which still tracks next-auth v4 and points at an older line. so we pin to the adapter's pin,
and follow it when it moves

so the trail that wandered all the way out to a separate SvelteKit project on its own subdomain
led back, in the end, to a dozen lines in one Nitro endpoint
layers one and two were always enough;
we just hadn't seen that layer three was a bridge Nuxt already had
*/
