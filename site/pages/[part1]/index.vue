<script setup>

const route = useRoute()
let part1 = route.params.part1
let request0 = part1?.toLowerCase()

let name1 = "UserName"//imagine these come from the database
let name0 = name1.toLowerCase()

if (part1 == name1) {//exact match
	//render the page below
} else if (request0 == name0) {//working match
	navigateTo(`/${name1}`, {redirectCode: 301})//functional match, but we can correct the case
	//ttd march2025, actually, don't do a redirect here, do that in ./site/middleware/name.global.js
} else {//no match
	throw createError({statusCode: 404, statusMessage: 'Not Found'})
}

</script>
<template>
<div>

you made it to the user page

</div>
</template>
