<script setup>

import {
} from 'icarus'

const credentialStore = useCredentialStore()

onMounted(async () => {
	await credentialStore.load()
})

/*
this is the "credential panel" component
a signed in user can navigate to their account dashboard to see and control information about their account
as part of that long scrolling page, this credential panel is a box that will tell the user information
like their name, and that they have set a password
this is also where controls exist that let the signed in user change these credentials, for instance they might
change their user name, or
change their password

what's a first thing you could write in the credential panel?
your browserHash, which you always have

and right after that?
if you're signed in at this browserHash, then your userTag
and a button to sign out

ok so Claude, you can see that we already have stuff about user names in name_table
and stuff about browsers and users linked in browser_table
to code this new design here, we're going to leave that all as-is
and just make a new system all within credential_table that manages signed-in browsers
and soon after user names and passwords
we won't tear out the older stuff in browser_table and name_table at this point, i think we can just ignore it
i think we can get a working system here with credential_table
and then once we've got that smoke tested and working as well as older stuff which calls down to those two older tables, we'll remove them
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialPanel</i></p>

<p class="text-sm font-mono break-all">Browser: {{ credentialStore.browserHash }}</p>

</div>
</template>
