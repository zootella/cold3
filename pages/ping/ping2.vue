<script setup>

import { pingTime, pingEnvironment, pingVersion } from '../../library/ping.js'

let message = `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping2done`//navigated with a full browser, you can see first the server answer, and then the client revision, and you get the hydration text content mismatch, but that's all fine

</script>
<template>

<div>
<p>ping2: {{ message }}</p>
</div>

</template>
