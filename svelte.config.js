//import adapter from 'amplify-adapter';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: { entries: ['*'] } 
	},
	preprocess: vitePreprocess()
};
export default config;
