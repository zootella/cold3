// https://nuxt.com/docs/api/configuration/nuxt-config

const customChunks = {
	sticker: [//sticker is small to be fast for ping, but does import wrapper and npm module nanoid
		'library/sticker.js',
		'wrapper.js',
	],
	zero: [//library0 imports only sticker
		'library/library0.js',
	],
	grand: [//the rest of the library centralizes imports through grand, which imports sticker and library0
		'library/grand.js',
		'library/access.js',
		'library/cloud.js',
		'library/cloud2.js',
		'library/database.js',
		'library/door.js',
		'library/door2.js',
		'library/library1.js',
		'library/library2.js',
	]
}

/*
can you still bundle forward without creating a loop?

		'wrapper.js',
		'library/sticker.js',
		'library/library0.js',

		'library/grand1.js',

		'library/access.js',
		'library/cloud.js',
		'library/cloud2.js',
		'library/database.js',
		'library/door.js',
		'library/door2.js',
		'library/library1.js',
		'library/library2.js',

		'library/grand2.js',

hmmm, that doesn't seem easy
still it's a benefit for api and page code to not have to change
so they still import everything from grand
but library files at this level can't import grand, they have to import from each other

*/

export default defineNuxtConfig({
	compatibilityDate: '2024-04-03',//added to remove warning
	nitro: {
		preset: 'cloudflare-pages',
		esbuild: { options: { target: 'esnext' } },//added to solve error on $ npm run build about es2019 not including bigint literals
		bundler: 'rollup',
		rollupConfig: {
			output: {
				inlineDynamicImports: false,
				manualChunks: customChunks//specify manual chunks for building server-side code
			}
		}
	},
	modules: ['nitro-cloudflare-dev'],
	devtools: { enabled: true },
	runtimeConfig: {//nuxt promises these will be available on the server side, and never exposed to a client
		ACCESS_KEY_SECRET: process.env.ACCESS_KEY_SECRET,

		//october, these go away with unified secrets
		ACCESS_TIME_ZONE: process.env.ACCESS_TIME_ZONE,
		ACCESS_PASSWORD_SECRET: process.env.ACCESS_PASSWORD_SECRET,
		ACCESS_NETWORK_23_SECRET: process.env.ACCESS_NETWORK_23_SECRET,

		ACCESS_AMAZON_REGION: process.env.ACCESS_AMAZON_REGION,
		ACCESS_AMAZON_CERTIFICATE: process.env.ACCESS_AMAZON_CERTIFICATE,

		ACCESS_SUPABASE_URL: process.env.ACCESS_SUPABASE_URL,
		ACCESS_SUPABASE_KEY_SECRET: process.env.ACCESS_SUPABASE_KEY_SECRET,

		ACCESS_DATADOG_ENDPOINT: process.env.ACCESS_DATADOG_ENDPOINT,
		ACCESS_DATADOG_API_KEY_SECRET: process.env.ACCESS_DATADOG_API_KEY_SECRET,

		ACCESS_SENDGRID_URL: process.env.ACCESS_SENDGRID_URL,
		ACCESS_SENDGRID_KEY_SECRET: process.env.ACCESS_SENDGRID_KEY_SECRET,

		ACCESS_TWILIO_URL: process.env.ACCESS_TWILIO_URL,
		ACCESS_TWILIO_SID: process.env.ACCESS_TWILIO_SID,
		ACCESS_TWILIO_AUTH_SECRET: process.env.ACCESS_TWILIO_AUTH_SECRET,
		ACCESS_TWILIO_PHONE: process.env.ACCESS_TWILIO_PHONE,

		//october, these go away because naming them ACCESS_..._PUBLIC is great, but just put them in a .vue file
		public: {//and these are intentionally public, used by code that runs on the page

			ACCESS_PASSWORD_HASHING_SALT_CHOICE_1_PUBLIC: process.env.ACCESS_PASSWORD_HASHING_SALT_CHOICE_1_PUBLIC,
			ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1_PUBLIC: process.env.ACCESS_PASSWORD_HASHING_ITERATIONS_CHOICE_1_PUBLIC
		}
	},
	vite: {
		build: {
			rollupOptions: {
				output: {
					manualChunks: customChunks//specify manual chunks for building client-side code
				}
			}
		}
	}
})
