<script setup>//./components/NavigationBar.vue

defineProps({note: String})

</script>
<template>
<div>

<p>
<NuxtLink to="/">index</NuxtLink>{{' - '}}
<NuxtLink to="/up/up3">test</NuxtLink>{{' '}}
<NuxtLink to="/image">image</NuxtLink>{{' '}}
<NuxtLink to="/video">video</NuxtLink>{{' - '}}
<NuxtLink to="/page1">page1</NuxtLink>{{' '}}
<NuxtLink to="/page2">page2</NuxtLink>{{' '}}
<NuxtLink to="/page3">page3</NuxtLink>{{' '}}
<NuxtLink to="/page4">page4</NuxtLink>{{' - '}}
<NuxtLink to="/pass">pass</NuxtLink>{{' - '}}
<NuxtLink to="/feed">feed</NuxtLink>{{' '}}
<NuxtLink to="/feed2">feed2</NuxtLink>{{' '}}
<NuxtLink to="/post/Fouv7hYGoytFMpU8JF0Fp">post</NuxtLink>{{' '}}
<NuxtLink to="/post/NR0vIdQZAwnEjhCZWe1ca">first</NuxtLink>{{' - '}}
<NuxtLink to="/query">query</NuxtLink>{{' '}}
<NuxtLink to="/authenticate">authenticate</NuxtLink>{{' '}}
<NuxtLink to="/me">me</NuxtLink>{{' '}}
<NuxtLink to="/error2">error2</NuxtLink>{{' '}}
<i>{{ note }}, {{ Sticker().what }}</i>
</p>

</div>
</template>
