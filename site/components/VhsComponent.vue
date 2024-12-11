<script setup>

import {ref, onMounted} from 'vue'

const sauce = ref('')

onMounted(() => {
	sauce.value = 'https://vhs.net23.cc/banner.png?path=%2F&tick=1734391189644&seed=AgmP6a2IHYE9xl8NYlL01&hash=IWI52ffzXAM68x4DtGx9pBYz2kMQij8372a5%2BjQvjbU%3D'
})

</script>
<template>

<img :src="sauce" />

</template>
