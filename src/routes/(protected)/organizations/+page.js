import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";

export async function load({ parent }) {
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }
}
  