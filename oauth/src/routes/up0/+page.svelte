<script>//./src/routes/up0/+page.svelte ~ simple static page for checkly at https://oauth.cold3.cc/up0

import {
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
hasText, checkText,
Tag, hasTag, checkTag, checkTagOrBlank,
Key, decryptKeys, accessKey, canGetAccess, getAccess,
} from 'icarus'

if (false) log(Sticker())//runs ssr and also client as part of sveltekit's universal rendering

</script>

<p><code>{Sticker()}, up0done</code></p>
