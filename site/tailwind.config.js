//./tailwind.config.js - our control panel for adjusting and augmenting tailwind's defaults

import defaultTheme from 'tailwindcss/defaultTheme'
//import forms from '@tailwindcss/forms'

export default {

	//tailwind needs to know which files to scan for class names so it can tree-shake unused CSS
	content: [
		'./nuxt.config.{js,ts}',
		'./app.vue',//we don't use tailwind class names in these two files, but listing them here is standard
		'./components/**/*.{vue,js,ts}',
		'./layouts/**/*.{vue,js,ts}',
		'./pages/**/*.{vue,js,ts}',
		'./plugins/**/*.{js,ts}',
	],

	//register custom utilities or extra pseudo-classes
	plugins: [
		forms,//normalize and styles form controls to inherit site typography and match Tailwind defaults
	],

	//default theme customizations and extensions
	theme: {
		extend: {
			fontFamily: {//you can confirm these work by adding 'Papyrus' to the start of any list, lol

				//first, define default overrides; what fonts should show up for existing HTML tags like <p> and <code>
				sans: [
					'"Diatype Rounded"',//packaged font
					'"Noto Sans"',//linked font
					...defaultTheme.fontFamily.sans,//all the default system fallbacks
				],
				mono: [
					'"Noto Sans Mono"',
					...defaultTheme.fontFamily.mono,
				],

				//second, setup named utilities, like "font-name", from the property names below
				roboto:  ['"Roboto"',          ...defaultTheme.fontFamily.sans],
				diatype: ['"Diatype Rounded"', ...defaultTheme.fontFamily.sans],
				lemon:   ['"Lemon Wide"',      ...defaultTheme.fontFamily.sans],
			},
		},
	},
}



//ttd july, also deal with layouts, get that pattern into cold3, even though you haven't found a great or necessary use for them








