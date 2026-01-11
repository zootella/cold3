<script setup>

import {
} from 'icarus'

const credentialStore = useCredentialStore()
await credentialStore.load()//runs on server render, then no-op on client due to loaded ref

/*
this is the "credential panel" component
a signed in user can navigate to their account dashboard to see and control information about their account
as part of that long scrolling page, this credential panel is a box that will tell the user information
like their name, and that they have set a password
this is also where controls exist that let the signed in user change these credentials, for instance they might
change their user name, or
change their password

the first thing we coded into credential panel was to show the browserHash of this browser
a browser always has a browserHash, and as it's based on a browserTag in a 395 day http only cookie, our hope is it doesn't change
the same browserHash persists per browser, through different users signing in and out

the second thing we coded into credential panel is the userTag of the user who is signed in
if there's a user signed in, credential panel also has a button to sign the user out

ok so what's next for credential panel?
at this early stage, we're requiring users to have names and passwords
(later on, a user might sign up with email and magic link, and have a userTag and email, but no name, and no password, so keep that in mind generally for later on, claude, please)
ok so that means if credential store from credential table shows that this user has a name, then here in credential panel we can show it
and working from there, we can offer controls to let the user change their name (later on there will also be controls to let the user discard their name, to go nameless, essentially, but not now in this early iteration, where names are required)

and at this point we can also detect here that this user has a password (right now all will, soon not all will)
and if they have a password, we can likewise offer controls to let the user change their password

ok so i think the next areas we should tackle are:

[]here in credential panel, show the user their name
[]let them edit their name
[]let them discard their name (meaning, they won't be able to log in, but we'll guard against that later)

[]show the user that they have a password (show for instance the iteration number, this is just for staff coding now, won't be a part of later production ui)
[]let them change their password
[]let them discard their password (meaning, they won't be able to log in, but we'll guard against that later)

and then in CredentialCorner, code a traditional sign up/sign in flow, including
[]sign up or sign in buttons
[]on sign in, ask for user name and password
[]on sign up, controls to choose a new available user name and set a password (we've got these in SignUpSignInDemo)

ok so that ended up being more than i thought it would
we can move forward the fastest and most efficiently by coding small steps forward
writing grid() tests to confirm database state through these user-level flows
and reviewing diff.diff and doing manual smoke testing all along the way
ok so my question for you now Claude is what should we tackle first? what part of this plan is the minimal testable next small step??
*/

</script>
<template>
<div class="border border-gray-300 p-2">
<p class="text-xs text-gray-500 mb-2 text-right m-0 leading-none"><i>CredentialPanel</i></p>

<p>browser hash <code class="break-all">{{credentialStore.browserHash }}</code></p>

<p v-if="credentialStore.userTag">
	user tag <code>{{credentialStore.userTag}}</code> signed in
	<Button v-if="credentialStore.userTag" :click="credentialStore.signOut">Sign Out</Button>
</p>
<p v-else>no user is signed in</p>

<p v-if="credentialStore.name">
	user has name
	f0 <code>{{credentialStore.name.f0}}</code>,
	f1 <code>{{credentialStore.name.f1}}</code>,
	f2 <code>{{credentialStore.name.f2}}</code>
</p>

<p v-if="credentialStore.passwordCycles">
	user has password protected by <code>{{credentialStore.passwordCycles}}</code> cycles
</p>

</div>
</template>
