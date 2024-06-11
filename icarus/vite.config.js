import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		{
			name: 'force-full-reload',
			handleHotUpdate({ file, server }) {
				if (file.endsWith('.js')) {
					server.ws.send({
						type: 'full-reload',
						path: '*'
					});
					return []; // Prevents any other HMR handling for this update
				}
			}
		}
	],
	optimizeDeps: {
		include: [
			'libphonenumber-js',
			'joi'
		]
	}
})
