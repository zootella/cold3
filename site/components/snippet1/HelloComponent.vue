<script setup>

const mainStore = useMainStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>server render took {{mainStore.serverDuration}}ms within {{mainStore.pageDuration != -1 ? mainStore.pageDuration : ''}}ms total time navigation to mounted</p>
<p>user:</p><pre>{{mainStore.user}}</pre>

</div>
</template>
