
## fresh-today

Modern full-stack JavaScript has several top-level dependencies the team is responsible for: cloud provider, package manager, web framework, their associated tooling, and framework modules. These compete for authority—Nuxt, Cloudflare's CLI, and pnpm each assume they're the starting point and everything else will follow their conventions. Each releases major versions, and their ecosystems of modules follow. When Nuxt 4 ships, Pinia updates, Tailwind updates, Wrangler updates its integration with Nuxt—and each brings its own dependency tree and peer dependency requirements.

This creates a difficult reality where a team must deal with ecosystem migrations more than once a year. Upgrading in place is treacherous: you change one thing, peer dependencies conflict, you chase errors through a maze of transitive dependencies, and you're never sure if a problem is your code, your config, or dependency hell.

So, an alternative. Here, we can quickly scaffold fresh. Spin up a new project with today's CLI tools, see what versions and configs you get out of the box, and compare that to your current setup. Diffs tell you exactly what's changed. You can then port your code into the fresh scaffold, or selectively update your existing project with confidence about what the "known good" state today looks like.
These notes capture that scaffolding process so it's repeatable without thinking.

```
  steps to quickly scaffold the cloudflare nuxt stack and modules, 2026feb3
  these are designed to be easy to paste in one line at a time rather than typing or this being a script
  start in ~/Documents/code/temp

rm -rf fresh1
pnpm create cloudflare@latest
  type name fresh1, framework starter, nuxt, no official modules, no git, no deploy)
cd fresh1
git init
git add . && git commit -m "1nuxt"

pnpm dlx nuxi@latest module add pinia
git diff > 2pinia.diff && git add . && git commit -m "2pinia"

pnpm dlx nuxi@latest module add og-image
git diff > 3ogimage.diff && git add . && git commit -m "3ogimage"

pnpm dlx nuxi@latest module add tailwindcss
pnpm why tailwindcss > 4tailwind.txt
git diff > 4tailwind.diff && git add . && git commit -m "4tailwind"

pnpm add vidstack@next
git diff > 5vidstack.diff && git add . && git commit -m "5vidstack"

rm -rf .git .nuxt .output .vscode .wrangler node_modules
cd ../..
rm -rf cold3/fresh1
mv temp/fresh1 cold3/fresh1

  fresh1 will be an inert folder in the monorepo, alongside named workspace folders
  and you and claude can examine
  you can also $ cp -r fresh1 fresh2 to boil down fresh2 as you update or decline granular differences
```
