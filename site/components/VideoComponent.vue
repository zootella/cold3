<script setup>

import {
log, look,
} from 'icarus'
import { ref, reactive, watch, computed } from 'vue'
import 'vidstack/bundle'

</script>
<template>

<div>
	<media-player .src="'https://files.vidstack.io/sprite-fight/720p.mp4'">
		<ClientOnly>
			<media-provider></media-provider>
			<media-plyr-layout>
				<media-controls></media-controls>
			</media-plyr-layout>
		</ClientOnly>
	</media-player>
</div>

</template>
