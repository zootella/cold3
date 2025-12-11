<script setup>//./components/PasswordBox.vue

import {
} from 'icarus'

/*
hi claude code, ok, to begin here, let's just make this a regular input box
step by step, smoke testing and evaluating factoring choices and exaiming the developer experience step-by-step
we'll grow this into a box meant to take a user's password
either in the context of signing in or setting the password or changing it
with features like preview dots
and the show hide control
*/

/*
also, pasted here but this is for later:

https://lucide.dev/
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-closed-icon lucide-eye-closed"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
```
yes, here's eye closed, and here's open:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
```
ok so i don't need to install anything, i can just copy paste these?
*/

</script>
<template>

<input :maxlength="Limit.input" />

</template>
