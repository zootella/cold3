<script setup>

import {ref, onMounted} from 'vue'

const sauce = ref('')

onMounted(() => {
	sauce.value = 'https://vhs.net23.cc/banner.png?path=%2Ffolder1%2Ffolder2%2F&tick=1733765298051&seed=gFpzqGE3YVZkpazvNC9hQ&hash=ELjTcnY8nJ7%2FSG8vLGuEIwKoCsylq%2FtdZMcCigPu%2Fmc%3D'
})

</script>
<template>

<img :src="sauce" />

</template>
