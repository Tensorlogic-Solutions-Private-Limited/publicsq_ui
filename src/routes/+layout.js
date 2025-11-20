import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { redirect } from "@sveltejs/kit";
// import { handleRedirection } from '$lib/utils/helper.js';
// import { userDetails } from '/src/routes/store.js'

export async function load({ fetch, url, parent }) {
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }}