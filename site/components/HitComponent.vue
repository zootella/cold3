<script setup>
//this file is ./components/HitComponent.vue

import {
log, look, Now, Tag,
getBrowserTag,
} from 'icarus'
import {ref, reactive, onMounted, watch} from 'vue'
import {useStore1} from '~/stores/store1'

const store1 = useStore1()
await store1.getHits()

</script>
<template>
<div>

<p><i>HitComponent</i></p>

<div>{{store1.hits}} hits from {{store1.sticker}} in {{store1.duration}}ms</div>

</div>
</template>
