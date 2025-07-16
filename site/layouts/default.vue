<script setup>//./layouts/default.vue - layout that nuxt uses on a page that forgets to specify one

/*
notes about layouts

you can have script here, but it seems like it's not a common pattern
note that you have to name these kebob, like feed-layout, not feedLayout

ttd february
figure out how layouts can help with, well, laying out different kinds of pages in the site

for instance, some might be:
feed - default, use for as much as you can
brochure - home page for the not signed in user
terms - minimal layout for legal documents
messages - the dm feature probably 

if feed isn't good for everything, then there could be also:
panel - user adjusts their account settings
login - form to sign in
media - focus on image or video gallery

*/

</script>
<template>

<main>
	<slot />
</main>

</template>
