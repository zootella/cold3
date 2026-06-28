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
import twitchProvider  from '@auth/core/providers/twitch'
import redditProvider  from '@auth/core/providers/reddit'//twitch and reddit are imported in preparation — not in the providers list below until we add their keys
import {toWebRequest} from 'h3'//converts the nitro event to a web Request; h3 also auto-sends a returned web Response, so the handler is just: return Auth(toWebRequest(event), authOptions)
import {
decryptKeys, hashText, originApex,
credentialBrowserGet, credentialOauthChallenge, credentialOauthParse, credentialOauthSet, oauthProviders,
} from 'icarus'//Key, hasTag, log, look, logAudit, sealEnvelope, Limit, setResponseStatus, defined are auto-globalized in site/server by icarusServerPlugin; these are not, so import them (same pattern as credential.js)

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
				logAudit('oauth done letter', {browserHash, userTag: signedIn.userTag, account, profile, user})//accumulate real examples of oauth provider responses, which carry lots of provider-specific detail and can be different or broken in unexpected ways at any time
				log('Auth.js signIn() handler', look({account, profile, user}))//operational visibility in datadog, separate from the audit store above
				//if result.ok is false (OauthAlreadyLinked. or OauthClaimedElsewhere.) we wrote nothing — a safe no-op; the panel reload shows the true state, no custom ui copy

				return '/page1'//send the browser back to the credential panel
			},
			//signIn returns a same-origin path, so Auth.js's default redirect handling is enough — no redirect() callback needed
		},
		session: {
			maxAge: 60,//seconds; intending us to identify our user with this cookie, Auth's default is 30 days
			updateAge: 0,//tell Auth.js to never refresh this cookie; it will expire naturally shortly
		},
		secret: Key('auth.js, secret'),//Auth.js needs a random secret we define to sign things; we don't have to rotate it; generate with $ openssl rand -hex 32
	}

	//when a flow starts (the signin action) record an audit-trail event-3 row that we're sending this user into the provider — the funnel "started" marker, paired with the "oauth done letter" completion logged in signIn above
	let [authAction, authProviderName] = (event.path.split('?')[0].split('/api/oauth/')[1] || '').split('/')//the action and provider Auth.js routes on, e.g. signin / discord
	if (authAction == 'signin' && hasTag(event.context.browserTag)) {
		let signedIn = await credentialBrowserGet({browserHash: await hashText(event.context.browserTag)})
		let providerInfo = oauthProviders().find(p => p.name == authProviderName)
		if (signedIn && providerInfo) await credentialOauthChallenge({userTag: signedIn.userTag, provider: providerInfo.tag})
	}

	let response = await Auth(toWebRequest(event), authOptions)//run the flow

	//Auth.js hands a cancel or an error back as a redirect to our pages.* carrying ?error=<type>. read it here (keys are decrypted) and sort it by governance: could only WE have caused this, or could the provider have?
	let errorType = new URL(response.headers.get('location') || '/', originApex()).searchParams.get('error')
	if (errorType == 'Configuration') {//auth.js erroring because of how we configured or use it — our bug to fix (add more types here if auth.js surfaces other our-fault errors)
		//blow up the page (Datadog + error.vue) through the same error3 surface the rest of the site uses
		let envelope = await sealEnvelope('Error3.', Limit.handoff, {error: {name: 'AuthError', message: `oauth setup error: ${errorType}`, authErrorType: errorType}})
		return new Response(null, {status: 303, headers: {location: `/error3?envelope=${envelope}`}})
	} else if (errorType) {//a provider changing things on us (loves us monday, hates us tuesday), or a user cancelling — not ours to fix
		logAudit('oauth sad path', {errorType, path: event.path})//don't crash the site; record the provider interaction for the team to analyse, and let the user land back at the panel (the /page1 Auth already redirected to)
	}
	return response
}
