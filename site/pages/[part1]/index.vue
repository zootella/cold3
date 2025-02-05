<template>
  <div>
    <h1>Index Dynamic Page</h1>
    <p>The dynamic segment (part1) is: <strong>{{ part1 }}</strong></p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const part1 = route.params.part1
</script>
