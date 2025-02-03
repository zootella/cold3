<script setup>

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'

let {data, pending, error} = useFetch(
	'/api/hit',
	{
		method: 'POST',
		body: {
			action: 'Get.'
		}
	}
)

</script>
<template>
<div>

<p><i>HitComponent</i></p>

<div v-if="pending">Loading hit count...</div>
<div v-else-if="error">Error: {{ error.message }}</div>
<div v-else>{{data.hits}} hits from {{data.sticker}}</div>

</div>
</template>
