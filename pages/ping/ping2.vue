<script setup>

import { pingTime, pingEnvironment, pingVersion } from '../../library/ping.js'

let note = `page ${pingTime()}, ${pingEnvironment()}, ${pingVersion()}, ping2done`

</script>
<template>

<div>
<p>ping2: script setup says: {{ note }}</p>
</div>

</template>
