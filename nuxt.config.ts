// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',

    //added to solve error on npm run build about es2019 not including bigint literals
    esbuild: { options: { target: 'es2020' } }
  },
  devtools: { enabled: true }
})
