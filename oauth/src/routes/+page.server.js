//./src/routes/+page.server.js ~ server side redirect away from the root of the oauth subdomain

import {
wrapper, Sticker, stickerParts, isLocal, isCloud,
Now, Time, Size, Limit, newline,
defined, toss, log, look,
hasText, checkText,
Tag, hasTag, checkTag, checkTagOrBlank,
Key, decryptKeys, accessKey, canGetAccess, getAccess,

originApex,
} from 'icarus'

import {redirect} from '@sveltejs/kit'

export function load() {
	redirect(
		301,//permanent redirect
		originApex())//go to cloud or local nuxt site home
}
