<script setup>//search tag: errorfile

/*
error.vue is Nuxt's default error page
when you call showError, Nuxt makes the whole page just this error component, keeping the current route

don't post error details here; it's a good idea to keep this page really simple
and don't automatically redirect away; if the target repeats the error, you'll be in an infinite loop
*/

function hardReplace() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

</script>
<template>
<div class="page-container text-center space-y-2">

<p>error.vue</p>

<p><NavigateButton to="/error2">Try to report the error...</NavigateButton></p>

<p><Button :click="hardReplace">Reload Site</Button></p>

</div>
</template>
