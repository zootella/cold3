<script setup>

import {
log, look, Now, Time, Sticker,
} from 'icarus'
import {ref, onMounted, defineExpose} from 'vue'

async function exposedFunction() {
	return 'hi from the exposed function'
}
defineExpose({exposedFunction})

</script>
<template>

<div>here is the expose component</div>

</template>
