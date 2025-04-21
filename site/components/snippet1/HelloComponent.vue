<script setup>

const helloStore = useHelloStore()

onMounted(async () => {
	await helloStore.hello1()
})

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p>hello1 at {{helloStore.sticker1}} took {{helloStore.duration1}}ms</p>
<p>user:</p><pre>{{helloStore.user}}</pre>

</div>
</template>
