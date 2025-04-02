<script setup>

import {
log, look, Now, Time, Limit, validateName,
Sticker, isCloud_new,
} from 'icarus'
import {ref, watch, onMounted} from 'vue'

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>MeComponent</i></p>

This is the 'me' component, for things like account and settings.

The first thing that will go here is your list of addresses, with things like
validate if not validated already,
remove,
and add a new one.

This is also where the [Log Out] button lives.

ttd march.

</div>
</template>
