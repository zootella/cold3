<script setup>

import {ref, reactive, watch, computed} from 'vue'
import 'vidstack/bundle'

</script>
<template>

<h1 class="text-4xl font-bold text-blue-600 mb-4">my component</h1>

<media-player .title="'Sprite Fight'" .src="'https://files.vidstack.io/sprite-fight/720p.mp4'">
	<ClientOnly>
		<media-provider>
		</media-provider>
		<media-plyr-layout .thumbnails="'https://files.vidstack.io/sprite-fight/thumbnails.vtt'">
			<media-controls></media-controls>
		</media-plyr-layout>
	</ClientOnly>
</media-player>

</template>
