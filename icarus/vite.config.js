import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		/*
		hot reload works great without this; maybe even better, even
		you kept it, however, so Ctrl+S restarts the log output on the page, rather than growing it
		*/
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
