<script setup>//./components/TermsComponent2.vue - component designed to let the user side scroll through terms

const refAccepted = ref(false)

</script>
<template>

<div class="myTop myText">
	<p>
		Please review our terms, policies, and notices. You'll need to accept them to create your account.
	</p>
</div>

<div class="myMiddleOuter">
	<div class="myMiddleInner">
		<TermsDocument />

		<!-- very hacky, but the only way I can find to get the edge of the second column to peak in on phones -->
		<p class="text-gray-100 text-sm font-roboto py-10">
			The numerals below are used only for spacing:
			1234567890123456789012345678901234567890
		</p>
	</div>
</div>

<!-- bottom outer container: horizontal flex, align items at the top -->
<div class="myBottom flex items-start">

	<!-- on the left is the checkbox only -->
	<div class="flex-none">
		<input
			type="checkbox"
			v-model="refAccepted"
			class="form-checkbox
				h-9 w-9 mt-1 cursor-pointer
				border-2 border-gray-500
				bg-white text-[#f0f]
				focus:ring-2 focus:ring-offset-2 focus:ring-[#f0f]"
		/>
	</div>

	<!-- on the right, take remaining space, vertical stack, align at top -->
	<div class="ml-3 flex-1 flex flex-col items-start">
		<div class="myText">

I confirm that I'm at least 18 years old
and accept the <TermsAnchors /> and any other terms, policies, and notices.
I understand that if these are updated,
my continued use of the service means I accept the new version,
and that I can read the current terms, policies, and notices at any time at https://example.com/terms

		</div>
		<button
			type="button"
			:disabled="!refAccepted"
			@click="refAccepted = false"
			class="mt-3 px-8 py-2 bg-[#f0f] text-white rounded-lg font-medium disabled:bg-gray-300"
		>Next ➜</button><!-- ttd july2025, change this to the pushy OldButton.vue component, or something else, after you choose a component library -->
	</div>

</div>

</template>
<style scoped>

.myText {
	@apply text-gray-700 decoration-gray-500;
}
.myTop {
	@apply max-w-3xl ml-0 px-6 pt-8 pb-2;
}
.myBottom {
	@apply max-w-3xl ml-0 px-6 pt-2 pb-24;
}
.myMiddleOuter {
	@apply
		h-[600px]         /* height, picked simple h-[600px] over alternatives h-[70svh] and h-[max(70svh,600px)] */
		overflow-x-auto   /* allow only horizontal scrolling */
		overflow-y-hidden /* supress vertical overflow */
		px-2 py-2         /* padding around scroll container */

		border-t border-b border-gray-200 bg-gray-100 /* gray band with a subtle edge */
	;
}
.myMiddleInner {
	@apply
		h-full       /* make this inner div expand to fill the full height of the outer one above */
		inline-block /* shrinkwrap to the needed width for columns */

		columns-2          /* at least two columns, never one, to indicate columns */
		md:columns-[360px] /* on medium desktop and wider, more columns around this width */
		[column-fill:auto] /* fill a column before spilling into the next one */
		gap-x-3            /* horizontal space between columns */
	;
}

</style>
