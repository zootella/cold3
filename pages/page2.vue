<script setup>

import { ref } from 'vue';

let dynamicValue = ref('dynamic value') // This makes dynamicValue a reactive reference
let staticValue = 'static value' // This remains a non-reactive constant
//and the third one, below, is just regular html

</script>
<template>

<NavigationComponent note="on page2" />
<SnippetComponent
	:dynamicProperty="dynamicValue"
	:staticProperty="staticValue"
	regularProperty="regular value"
/>

</template>
