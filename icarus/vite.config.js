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
	optimizeDeps: {//you don't understand why, but you have to explicitly include your installed modules here
		include: [
			'rfc4648',
			'joi',
			'credit-card-type',
			'libphonenumber-js'
		]
	}
})
