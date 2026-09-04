<script setup>

/*
on the error trail: error3 landing page

a door caught an error on a request that arrived as a browser navigation, with no page and no fetchWorker in the loop to
reach errorPlugin's hooks. today that door is doorWorkerLite under the oauth endpoint. the door logged the error and
redirected the browser here, and this page's one job is to show error.vue the way every other fatal error does.
the browser arrives by redirect, a full navigation the server renders, and on the server showError sets the error state
without firing the plugin's hooks, so nothing logs a second time; the door's log is the record
*/

showError({//put the response into the error.vue state
	statusCode: 500,//the request the browser was on failed on our side
	statusMessage: 'error3',//names the trail stop, not the error, which is in the door's log
})

</script>
<template>
</template>
