<script setup>//in the workspace "repot4", this is the file ./app.vue

import {

//autoicarus, temporary for Nuxt in repot4
wrapper, Sticker, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
noop, test, ok,

toBoolean, toTextOrBlank,
checkInt, minInt,
intToText, textToInt,
hasText, checkText,
hasTextOrBlank, checkTextOrBlank,
makePlain, makeObject, makeText,

Tag, hasTag, checkTag, checkTagOrBlank,
checkHash,

dog, logAudit, logAlert,
awaitDog, awaitLogAudit, awaitLogAlert,

canGetAccess, getAccess,
doorWorker, doorLambda,
Task, fetchWorker, fetchLambda, fetchProvider,

} from 'icarus'

</script>

<template>
	<div>
		<p>
			hello on repot4, {{Sticker().all}}
		</p>
		<NuxtRouteAnnouncer />
		<NuxtWelcome />
	</div>
</template>
