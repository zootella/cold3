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

<p><i><b>hello1</b> at {{helloStore.sticker1}} took {{helloStore.duration1}}ms</i></p>
<p><code>{{helloStore.userTag}}</code> user tag</p>

<p><i><b>hello2</b> at {{helloStore.sticker2}} took {{helloStore.duration2}}ms</i></p>
<p><code>{{helloStore.browserGraphics}}</code> browser graphics</p>
<p><code>{{helloStore.userName}}</code> user name</p>

<p><code>{{helloStore.ipAddress}}</code> ip address</p>
<p><code>{{helloStore.userAgent}}</code> user agent</p>
<p><code>{{helloStore.geography}}</code> geography</p>

<p><code>{{helloStore.hashValue}}</code> hashValue</p>
<p><code>{{helloStore.hashDuration}}</code> hashDuration</p>
<p><code>{{helloStore.codes}}</code> codes</p>

</div>
</template>
