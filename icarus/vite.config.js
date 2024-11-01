import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		//added this so Ctrl+S in a library file resets the on page log output, rather than growing it
		{
			name: 'force-full-reload',
			handleHotUpdate({ file, server }) {
				if (file.endsWith('.js')) {
					server.ws.send({
						type: 'full-reload',
						path: '*'
					});
					return []//prevent any other hot module replacement handling for this update
				}
			}
		}
	]
})
