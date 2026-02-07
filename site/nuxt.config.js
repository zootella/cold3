
import {
Time, Key, log, look,
} from 'icarus'//local Node runs this file on $ nuxt dev, build, generate; we can use icarus helpers here
import {vite as vidstack} from 'vidstack/plugins'
import tailwindcss from '@tailwindcss/vite'

/*
$ cloudflare create
scaffolded file linked
https://nuxt.com/docs/api/configuration/nuxt-config

configuration object we'll populate, submit, and export the result
replaced common declarative structure with this imperitive pattern
to be able to group subject areas together and comment them out individually for testing
*/
const configuration = {
	modules: [],
	vue: {compilerOptions: {}},
	vite: {plugins: []},
	app: {head: {link: []}},
}

//for Nuxt and Nitro
configuration.compatibilityDate = '2025-07-15'//⌚ 2026feb3 set date from fresh scaffolding; pin Nitro and other Nuxt modules to this date of behavior to avoid breaking changes from Nuxt ecosystem updates
configuration.devtools = {enabled: true}//enable the Nuxt devtools extension in the browser when running locally

//for build analysis and visualization
configuration.build = {
	analyze: {//enable Nuxt’s built-in analyzer, which uses Rollup Plugin Visualizer under the hood
		template: 'treemap',//try out "treemap", "sunburst", "network", "raw-data", or "list"; note these only affect client.html
		brotliSize: true,//current browsers downloading from Cloudflare will use Brotli compression
	},
}
configuration.analyzeDir = 'size'//put the report files in a folder named "size" rather than .nuxt/analyze

//for Cloudflare Workers
//scaffolding may have come with configuration.modules.push('nitro-cloudflare-dev') but we removed it; Nitro >=2.12 runs a local miniflare instance to emulate Cloudflare bindings natively during dev
configuration.nitro = {
	preset: 'cloudflare_module',//tell Nitro to build for Cloudflare Workers
	cloudflare: {
		deployConfig: true,//tell Nitro to generate Wrangler settings from its defaults and our wrangler.jsonc file
		nodeCompat: true,//bundle in compatability polyfills for core Node modules; this is about Node compatability at *build* time
	},
}

//added to solve error on npm run build about ES2019 not including BigInt literals
configuration.nitro.esbuild = {
	options: {target: 'esnext'},
}

//added so we a template can find <SomeComponent /> with SomeComponent.vue organized into a subfolder of the components folder
configuration.components = {
	dirs: [{path: '~/components', pathPrefix: false}],
}

//for tailwind
configuration.css = ['./app/assets/css/style.css']
configuration.vite.plugins.push(tailwindcss())

//for google fonts
configuration.app.head.link.push({
	rel: 'stylesheet',
	href: 'https://fonts.googleapis.com/css2?' + (
					'family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700' +
		'&family=Noto+Sans+Mono:ital,wght@0,400;0,700;1,400;1,700' +
						'&family=Roboto:ital,wght@0,400;0,500;1,400;1,500' +//note 500, tailwind semibold
		'&display=swap')//CSS2 API does unicode-range subsetting automatically
})

//for pinia
configuration.modules.push('@pinia/nuxt')

//for nuxt-og-image
configuration.modules.push('nuxt-og-image')
configuration.site = {
	name: Key('domain, public'),
	url: 'https://'+Key('domain, public'),//needs site's deployed domain to link the cards in the page meta tags with absolute URLs
}
configuration.ogImage = {
	defaults: {
		cacheMaxAgeSeconds: 20*Time.minutesInSeconds//default if omitted is 3 days
	},
	runtimeCacheStorage: {
		driver: 'cloudflare-kv-binding',
		binding: 'OG_IMAGE_CACHE',
	},
}

//for vidstack
configuration.vue.compilerOptions.isCustomElement = (tag) => tag.startsWith('media-')
configuration.vite.plugins.push(vidstack())

export default defineNuxtConfig(configuration)
