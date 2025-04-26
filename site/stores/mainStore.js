//./stores/mainStore.js

import {
} from 'icarus'

export const useMainStore = defineStore('main_store', () => {

const loaded = ref(false)//prevent unnecessary reload on client after hydrated and bridged from server
async function load() { if (loaded.value) return; loaded.value = true

	//and down here we'll fetch from endpoints

}


return {
	loaded, load,//return loaded: server call sets true, true value goes over Nuxt Bridge, client call to .load() is a no-op
}

})
