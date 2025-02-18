<script setup>

const route = useRoute()
let part1 = route.params.part1
let requestNormal = part1?.toLowerCase()

let nameFormal = "UserName"//imagine these come from the database
let nameNormal = nameFormal.toLowerCase()

if (part1 == nameFormal) {//exact match
	//render the page below
} else if (requestNormal == nameNormal) {//working match
	navigateTo(`/${nameFormal}`, {redirectCode: 301})//functional match, but we can correct the case
} else {//no match
	throw createError({statusCode: 404, statusMessage: 'Not Found'})
}

</script>
<template>
<div>

you made it to the user page

</div>
</template>
