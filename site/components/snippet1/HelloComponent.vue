<script setup>

const mainStore = useMainStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>load at {{mainStore.sticker1}} took {{mainStore.duration1}}ms</p>
<p>user:</p><pre>{{mainStore.user}}</pre>

</div>
</template>
