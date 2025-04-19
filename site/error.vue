<script setup>//./error.vue

function rootReload() { window.location.replace('/') }//outside of Nuxt routing, same as the browser's Reload button, and to the domain root

</script>
<template>//./error.vue
<div class="page-container text-center">

<p>error.vue</p>

<p><NavigateButton to="/error2">Report Error</NavigateButton></p>

<p><Button @click="rootReload">Reload Site</Button></p>

</div>
</template>
