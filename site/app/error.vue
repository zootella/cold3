<script setup>//search tag: errorfile

/*
error.vue is Nuxt's default error page
when you call showError, Nuxt makes the whole page just this error component, keeping the current route

don't post error details here; it's a good idea to keep this page really simple
and don't automatically redirect away; if the target repeats the error, you'll be in an infinite loop

no custom components here; use only framework-provided components (NuxtLink) and plain HTML
anything custom could trip over the same broken state that got us here

note this page is intentionally simple, without any of our own components, without script here or below
*/

</script>
<template>
<div class="page-container text-center space-y-2">

<p>Something went wrong. Sorry about that.</p>

<p><NuxtLink to="/error2" class="my-button ready">Report Error</NuxtLink></p>

<p><a href="/" class="my-button ready">Reload Site</a></p>
<!-- a href slash is the same as window.location.replace('/') but with no JavaScript; full navigation and spa reset same as if the user clicked Reload in the browser toolbar -->

</div>
</template>
