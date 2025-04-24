<script setup>

const {data, refresh} = useFetch(
	host23() + '/rpl',
	{
		method: 'POST',
		body: {
			name: 'r4'
		}
	}
)



</script>
<template>

<div>
r4 post to lambda, block
<button class="pushy" @click="refresh">Refresh</button><pre>{{ look(data) }}</pre>
</div>

</template>
