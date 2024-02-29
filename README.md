
How quick, simple, and cheap can the web2 stack be in 2024?
Part of the larger experiment organized at [coldstart](https://github.com/zootella/coldstart).

This is 🍺 [cold3.cc](https://cold3.cc/) on [Cloudflare](https://developers.cloudflare.com/) using [Nuxt](https://nuxt.com/).

Notes:

## Make a new site on Cloudflare

```
$ npm create cloudflare@latest
$ cd cold3
```

 * Sign into Cloudflare and keep that browser forward, as the terminal will pop open a tab to authenticate
 * Use a fancy terminal like PowerShell; MING64 can't do the interactive menus
 * Chose *Website or web app*, *Nuxt*; yes, *use Git for version control*, and yes, *Deploy your application to Cloudflare*
 * Previously fixed error during `create` by updating npm with `$ npm install -g npm`

## Check or correct wrangler authentication

```
$ npx wrangler --version
$ npx wrangler whoami
$ npx wrangler login
```

Previously fixed a mess on Windows where wrangler was installed globally, and had an expired or incorrectly permissioned OAuth token.
Wranger should be installed in the project, only.
Deleted `C:\Users\UserName\AppData\Roaming\npm\wrangler.ps1` and `C:\Users\UserName\.wrangler`.
Also deleted `cold3/.wrangler` and `cold3/node_modules` and repeated `npm install`.

## Make a new repo on GitHub

```
$ git remote add origin git@github.com:zootella/cold3.git
$ git branch -M main
$ git push -u origin main
```

GitHub, *Repositories*, *New*.
Type name and description, but start with no readme, gitignore, or license to make a completely blank repository

## Push to GitHub

```
$ git status
$ git add .
$ git commit -a -n -m "note"
$ git push
```

Pushing to GitHub does not start Cloudflare deploy; they're separate and I like that better.

## Run locally and deploy to Cloudflare

```
$ npm run dev
$ npm run pages:dev
$ npm run pages:deploy
```

 * Unlike Amplify, builds locally and pushes static assets, which is faster
 * `dev` runs Vite for Nuxt, while `pages:dev` and `pages:deploy` run Wrangler, which in turn runs Vite for Nuxt
 * `pages:dev` works great everywhere; in React-land, a problem between Wrangler and webpack breaks local development

## Nuxt commands

```
$ npx nuxi add component ColdComponent
$ npx nuxi add page page1
```

Git diff makes it look like these commands aren't adding configuration outside the obvious news folders and files, which is good.

## Domains and DNS

Getting the domain name attached was all about clicking forms in web dashboards.
Registered the domain at a separate registrar, not Cloudflare.

Followed both of these trails in the Cloudflare dashboard:
 * dash top, *Websites*, *Add a site* button
 * dash top, *Workers & Pages*, *Overview*, `cold3`, *Custom domains* tab

Typed just `cold3.cc` even though some examples start `www`.
*Begin DNS transfer* is correct.
Beneath paid options, the *Free* one is fine.
Turned off *Proxied* and instead choose *DNS only*, even though individual records ended up *Proxied* as shown below.

Cloudflare gave you two nameservers, which you pasted into the registrar, there switching from parking *Basic DNS* to third-party *Custom DNS*.

Cloudflare imported existing DNS records from the registrar, which were all about parking and you should discard entirely. Removed `MX` and `TXT` records and edited to have just two like this:

```
AAAA   www       100::            Proxied  Auto
CNAME  cold3.cc  cold3.pages.dev  Proxied  Auto
```

During DNS propegation, Cloudflare had a button *Check nameservers now*, and after, the message *Good news! Cloudflare is now protecting your site*.
Text said wait 24 hours, but things started working in less than 30 minutes.
After that was the *Quick Start Guide*, wizard steps where you configured:

```
Automatic HTTPS Rewrites: ON
Always use HTTPS: ON
Brotli: ON
```

Then in the *Workers & Pages* area, *Custom Domains*, *Set up a custom domain*.
There was a note about changing an `A` record to a `CNAME` record, then *Activate domain*.
A row expanded with more stuff to click, ignored that, in less than a minute the yellow *Verifying* changed to green *Active*.

These steps were enough to get `http://` to redirect to `https://`, but more was necessary to get `www.cold3.cc` to redirect to just `cold3.cc`:
Dash top, left column, *Bulk Redirects*.
One rule will contain one list, and that list will contain one or several redirects.
Make one like this:

```
Source URL     Target URL        Status
www.cold3.cc/  https://cold3.cc  301
```

## Test redirects

Here are some links to test `http -> https` and `www -> (no subdomain)`.
The redirects need to keep the route.

No route:
[plain www](http://www.cold3.cc),
[plain apex](http://cold3.cc), and
[secure www](https://www.cold3.cc) should all redirect to
[secure apex](https://cold3.cc)

Route to `page1`:
[plain www](http://www.cold3.cc/page1),
[plain apex](http://cold3.cc/page1), and
[secure www](https://www.cold3.cc/page1) should all redirect to
[secure apex](https://cold3.cc/page1)

To get this working, you went into another part of the Cloudflare dashboard.
Dash top, *Websites*, `cold3.cc`, *Rules*, *Page Rules*, this uses one of your three free ones.

```
www.cold3.cc/*       url
Forwarding URL       setting
301                  status code
https://cold3.cc/$1  destination
```

## Roster

Stack

* [Vue](https://vuejs.org/)
* [Nuxt](https://nuxt.com/)
* [nuxi](https://nuxt.com/docs/api/commands/add)
* [Vite](https://vitejs.dev/)
* [Nitro](https://nitro.unjs.io/)

Hosting

* [Cloudflare Pages](https://pages.cloudflare.com/)
* [Cloudflare Workers](https://developers.cloudflare.com/workers/)

big areas still to explore, try out, and choose:

* spelunking to a serverless database with pinia, some orm, a proven serverless database provider avoiding vendor lock-in. maybe supabase, prisma, drizzle orm. find []local offline development, []spreadsheet-like visual data editor, and []csv export and import
* pretty components and fonts, maybe nuxt ui which is on tailwindcss, or primevue, vuesax
* authentication, including wallets
* media file upload, resize, encode, download. maybe separate and ec2
* open graph protocol cards
