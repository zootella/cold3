<script setup>

import {
log, look, Now, sayTick, newline, Data, Tag, hasText,
getBrowserTag, isLocal,
} from 'icarus'
import {ref, reactive, onMounted} from 'vue'
import {useHelloStore} from '~/stores/helloStore'

const helloStore = useHelloStore()

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>HelloComponent</i></p>

<p><code>{{helloStore.browserTag}}</code> browser tag</p>

<p>~ hello1 took {{helloStore.duration1}}ms at {{helloStore.sticker1}}</p>
<p><code>{{helloStore.userTag}}</code> user tag</p>

<p>~ hello2 took {{helloStore.duration2}}ms at {{helloStore.sticker2}}</p>
<p><code>{{helloStore.browserGraphics}}</code> browser graphics</p>
<p><code>{{helloStore.userName}}</code> user name</p>

</div>
</template>
