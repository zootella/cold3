
```
 ____________________
| |cold3 @Ster21   | |
|.|________________|H|
| |2026mar03_______| |
| |188_files_______| |
| |1,138,349_chars_| |
| |77%_full________| |
| |________________| |
|                    |
|    ____________    |
|   |   |  _     |   |
|   |   | | |    |   |
|   |   | |_|    | V |
|___|___|________|___|
```

How quick, simple, and cheap can the web2+3 stack be?
[One person](https://world.hey.com/dhh/the-one-person-framework-711e6318)
pouring and curing a tiny
[monolith](https://signalvnoise.com/svn3/the-majestic-monolith/) ⬛🙈

```bash
#monorepo root, a completely serverless web2+3 stack 💾
cd .
pnpm sem #fetch npm registry, compare with installed versions, write sem.yaml
pnpm seal #hash all files into wrapper.txt, generate wrapper.js, run tests
pnpm test #run unit tests, then database tests with pglite

pnpm cors #run CORS and security tests against deployed lambdas
pnpm og #fetch a deployed page, extract og:image, verify fresh render and cache behavior
pnpm xray TERM #confirm locations of settings and secrets across builds

pnpm wash #delete node modules but not lockfile like this is a fresh box
pnpm upgrade-wash #also delete lockfile to install most recent versions in range

#shared isomorphic library, four levels from pure JS up to application logic 🟨
cd ./icarus
pnpm icarus #vite dev server for lightning quick Ctrl+S TDD

#Nuxt website, universal rendering, Cloudflare Workers, Supabase, Tailwind, shadcn/ui 🌍
cd ../site
pnpm local #Nuxt dev server
pnpm build #Nuxt production build
pnpm preview #build and run locally with wrangler dev to test the worker
pnpm cloud #flip wrapper.cloud to true, build, deploy to Cloudflare, flip back, run tests
pnpm size #nuxi analyze, opens rollup visualizer for client and nitro bundles

#Lambda functions for AWS and heavyweight Node modules, Serverless Framework 📚
cd ../net23
pnpm local #serverless offline with hot reload
pnpm build #bundle, package, and measure size
pnpm cloud #bundle, deploy to AWS Lambda, and test
pnpm www #sync static files to S3

#SvelteKit site for Auth.js OAuth authentication, Cloudflare Workers 👥
cd ../oauth
pnpm local #Vite dev server
pnpm build #Vite production build
pnpm cloud #set cloud mode, build, deploy to Cloudflare Workers, restore local mode, test
pnpm preview #build and preview with wrangler dev
```

[Node 22](https://nodejs.org/) and
[pnpm 10](https://pnpm.io/).

Intentionally avoiding
[React](https://react.dev/),
[hooks](https://react.dev/reference/react/hooks),
[Next.js](https://nextjs.org/), and
[webpack](https://webpack.js.org/). 🤮

Input validation with
[Zod](https://zod.dev/packages/mini),
[libphonenumber-js](https://gitlab.com/catamphetamine/libphonenumber-js) from Android, and
[credit-card-type](https://github.com/braintree/credit-card-type) from Braintree.

AWS Lambda functions via
[Serverless Framework 4](https://www.serverless.com/) with
[S3](https://aws.amazon.com/s3/) for storage.
Lambdas run heavyweight Node modules web workers can't.
Messaging with
[SES](https://aws.amazon.com/ses/),
[SNS](https://aws.amazon.com/sns/),
[Twilio](https://www.twilio.com/), and
[SendGrid](https://www.twilio.com/docs/sendgrid).
The build uses Vercel's [NFT](https://github.com/vercel/nft) to trace and include only necessary files,
and packs [Sharp](https://sharp.pixelplumbing.com/) for image manipulation
with native binaries for
[Graviton](https://aws.amazon.com/ec2/graviton/) on
[Amazon Linux 2023](https://aws.amazon.com/linux/amazon-linux-2023/).

Site built with the
[Nuxt 4](https://nuxt.com/) framework on
[Vue 3](https://vuejs.org/) for reactive UI,
[Nitro 2](https://nitro.build/) as the server engine.
Universal rendering with state in
[Pinia 3](https://pinia.vuejs.org/).
Deployed to
[Cloudflare Workers](https://developers.cloudflare.com/workers/) with
[wrangler 4](https://developers.cloudflare.com/workers/wrangler/).
Database on
[Supabase](https://supabase.com/)
[Postgres](https://www.postgresql.org/), tested locally with
[PGlite](https://pglite.dev/).

OAuth via
[Auth.js](https://authjs.dev/) in
[SvelteKit 2](https://svelte.dev/docs/kit/) on
[Svelte 5](https://svelte.dev/), also deploying to Cloudflare Workers.

[Vite 6](https://vite.dev/) for local development across _icarus_, _site_, and _oauth_ workspaces.
[Rollup 4](https://rollupjs.org/) for production bundles,
client and server, in both Nuxt and SvelteKit.

Styles using
[Tailwind 4](https://tailwindcss.com/) with components from
[shadcn-vue](https://www.shadcn-vue.com/) on
[Reka UI](https://reka-ui.com/) primitives,
the Vue path to [shadcn/ui](https://ui.shadcn.com/).
Icons from [Lucide](https://lucide.dev/).
[Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans),
[Noto Sans Mono](https://fonts.google.com/noto/specimen/Noto+Sans+Mono), and
[Roboto](https://fonts.google.com/specimen/Roboto) from Google Fonts, plus
[ABC Diatype Rounded](https://abcdinamo.com/typefaces/diatype-rounded) and
[Lemon Wide](https://rajputrajesh-448.gumroad.com/l/Lemon9) as local _.woff2_ files.

File uploads with
[Uppy](https://uppy.io/) to S3 via presigned URLs.
Video with
[Vidstack](https://vidstack.io/).
Open graph images rendered by (again) Vercel's
[Satori](https://github.com/vercel/satori) within
[nuxt-og-image](https://nuxtseo.com/og-image).

Web3 using
[wagmi](https://wagmi.sh/) and
[viem](https://viem.sh/).
