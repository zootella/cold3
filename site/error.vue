<script setup>//.//error.vue

//ttd april, understand errors in nuxt
//can't use layouts in here the same way, hence the navigation bar and div class below

/*
more ideas here
[]a button uses turnstile to POST error information to an error endpoint
[]and then does a full navigation reset to the root, clearing pinia and everything

"there's a mistake that staff needs to fix; but you can try again now to see if you avoid it"
actually maybe just tell them to refresh
*/

const error = useError()
// You now have access to properties such as:
// error.message, error.source, error.error, error.info, etc.



</script>
<template>
<div class="page-container">

<NavigationBar note="on error" />
<p><i>this is the nuxt error component</i></p>

</div>
</template>
