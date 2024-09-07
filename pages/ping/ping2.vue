<script setup>

import { pingTime, pingEnvironment, pingVersion } from '../../library/ping.js'

let message = `${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping2done`

</script>
<template>

<div>
<p>ping2: {{ message }}</p>
</div>

</template>
