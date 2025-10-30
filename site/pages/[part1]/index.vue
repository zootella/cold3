<script setup>

const route = useRoute()
let part1 = route.params.part1
let requestNormal = part1?.toLowerCase()

let nameFormal = "UserName"//imagine these come from the database
let name0 = nameFormal.toLowerCase()

if (part1 == nameFormal) {//exact match
	//render the page below
} else if (requestNormal == name0) {//working match
	navigateTo(`/${nameFormal}`, {redirectCode: 301})//functional match, but we can correct the case
	//ttd march, actually, don't do a redirect here, do that in ./site/middleware/name.global.js
} else {//no match
	throw createError({statusCode: 404, statusMessage: 'Not Found'})
}

</script>
<template>
<div>

you made it to the user page

</div>
</template>
