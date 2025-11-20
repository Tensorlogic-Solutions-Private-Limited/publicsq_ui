import { setUserInfo } from "$lib/stores/authStore.js";

export async function load({ locals }) {
  //  return the session data from locals that was set in hooks.server.js
  return {
    session: locals?.sessionData || {}
  };
}