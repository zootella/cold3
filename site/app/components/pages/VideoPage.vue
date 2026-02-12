<script setup>

import 'vidstack/bundle'
/*
at least with vidstack you don't have to worry about updates breaking anything
and then when video.js v10 comes out for vue, probably 1+ years, you'll likely just rewrite everything
here's a comparison from research done 2026feb

### Vidstack (unpopular, discontinued, but correct choice for now)
https://vidstack.io/
https://www.npmjs.com/package/vidstack
**Adoption:** Niche. 3.3k GitHub stars, 7M lifetime npm downloads. Built at Reddit, praised by developers who found it, but never achieved mainstream adoption.
**Architecture:** Modern. Tree-shakeable (53kB gzipped base), composable headless components, signals-based state management, lazy-loaded providers. Built on web components, which created friction with SSR hydration and framework lifecycle mismatches.
**Modern stack DX:** Good. First-class TypeScript, SSR-friendly, framework bindings for React/Vue/Svelte/Solid, Tailwind integration, Nuxt auto-setup plugin. Widely considered the best DX in the space for its time.
**Status:** Effectively finished. Creator joined Mux; no new npm releases in 2+ years. Architecture and lessons are being channeled into Video.js v10.
vidstack:
  description: Build awesome media experiences on the web.
  from: site
  versions:
    declared: ^1.12.13
    installed: 1.12.13 on 2025feb16 12m old
    current: 1.12.13 on 2025feb16 12m old
    latest: 0.6.15 on 2024apr19 22m old 🩸 Latest tag is behind installed
  downloads:
    weekly: 32,747
    on: 2026feb4.1829.44951

### Video.js v8 (champion, outdated)
https://videojs.org/
https://www.npmjs.com/package/video.js
**Adoption:** Dominant. 38.6k GitHub stars, 900+ contributors, millions of sites, billions of monthly plays. Used at Amazon, LinkedIn, Instagram, Dropbox. Largest plugin ecosystem in the space. Backed by Mux.
**Architecture:** Monolithic. Single bundled export with no tree-shaking — the full ~195kB gzipped payload ships regardless of what features are used. Plugin-based extensibility but fundamentally a widget-era design.
**Modern stack DX:** Poor. Assumes a browser environment, requiring client-only wrappers for SSR frameworks like Nuxt or Next.js. TypeScript types exist but are not first-class. Integrating into a component-driven app means working around the library rather than with it.
**Status:** Stable, production-proven, actively maintained.

### Video.js v10 (theoretical, react only)
https://v10.videojs.org/
**Adoption:** None yet. Technical preview shipped October 2025. Beta targeting March 2026, GA mid-2026, full plugin parity end of 2026.
**Architecture:** Ground-up rewrite. Fully modular with tree-shaking and code splitting (claiming 70–80% bundle reductions). Radix-inspired composable primitives, shadcn-style editable skins, custom compiler translating React + Tailwind into other framework/CSS targets. Absorbs architectural lessons from Vidstack, Plyr, and Media Chrome.
**Modern stack DX:** Promising but unproven. Current preview is React-only (`@videojs/react-preview`). Vue, Svelte, and React Native support are stated goals but not yet available. SSR story not yet documented.
**Status:** Alpha. API subject to change. Backed by Mux with the creators of Vidstack, Plyr, and Media Chrome on the team.
*/

</script>
<template>

<h1 class="text-4xl font-bold text-blue-600 mb-4">my component</h1>

<media-player .title="'Sprite Fight'" .src="'https://files.vidstack.io/sprite-fight/720p.mp4'">
	<ClientOnly>
		<media-provider>
		</media-provider>
		<media-plyr-layout .thumbnails="'https://files.vidstack.io/sprite-fight/thumbnails.vtt'">
			<media-controls></media-controls>
		</media-plyr-layout>
	</ClientOnly>
</media-player>

</template>
