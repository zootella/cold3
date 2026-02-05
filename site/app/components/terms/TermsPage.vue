<script setup>

</script>
<template>

<div class="myTop">
	<p class="myText">
		By accessing or using this site, you agree to the <TermsAnchors /> and any other terms, policies, and notices listed below.
	</p>
</div>

<div class="myMiddleOuter">
	<div class="myMiddleInner">
		<TermsDocument />
	</div>
</div>

<div class="myBottom">
	<p class="myText"><a href="#">Top</a> <NuxtLink to="/">Home</NuxtLink></p>
</div>

</template>
<style scoped>

.myText {
	@apply text-gray-700 decoration-gray-500;
}
.myText a {
	@apply text-gray-700 decoration-gray-500; /* ttd july2025, should not need to repeat, but necessary to overwrite style.css a, you think */
}
.myTop {
	@apply max-w-3xl mx-auto px-2 py-8;
}
.myBottom {
	@apply max-w-3xl mx-auto px-2 pt-8 pb-24;
}
.myMiddleOuter {
	@apply
		border-t border-b border-gray-200 bg-gray-100 /* gray band with a subtle edge */
	;
}
.myMiddleInner {
  @apply
    w-full    /* make the container span 100% of its parent’s width */
    max-w-3xl /* but never exceed 768 pixels for readability */
    mx-auto   /* center it horizontally when it’s narrower than the parent */
    px-2 py-4 /* add a small left/right gutter (0.5rem) and moderate top/bottom padding (1rem) */
  ;
}

</style>
