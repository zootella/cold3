//server side redirect away from the root of the oauth subdomain

import {
originApex,
} from 'icarus'

import {redirect} from '@sveltejs/kit'

export function load() {
	redirect(
		303,//see other
		originApex())//go to cloud or local nuxt site home
}
