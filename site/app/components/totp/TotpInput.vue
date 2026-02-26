<script setup>

//short input box for the user to enter a RFC-6238 TOTP code like "123456"
const model = defineModel()

</script>
<template>

<Input v-model="model" type="text" inputmode="numeric" :maxlength="Limit.input" class="font-mono w-32" />

</template>
