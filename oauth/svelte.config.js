
import adapter from '@sveltejs/adapter-cloudflare'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),//scaffolding puts both adapter-auto and adapter-cloudflare in devDependencies; remove adapter-auto, keep adapter-cloudflare which we import here
	},
}

export default config
