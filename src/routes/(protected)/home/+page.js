import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { apiClient } from "$lib/utils/apiClient.js";
import { handleRedirection } from "$lib/utils/helper.js";

export async function load({ parent, url }) {
  let userDetails = null;
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
    const userId = session?.userId || session?.user_id;
    if (userId) {
      try {
        const res = await fetch(`/apis/users/${userId}`);
        if (!res || !res.ok) {
          if (res?.status === 401 || res?.status === 403) {
            await handleRedirection(res.status, url.pathname, url.search);
            return { userDetails: null };
          }
          throw new Error("Failed to fetch user details");
        }
        userDetails = await res.json();
      } catch (err) {
        userDetails = { error: err.message };
      }
    } else {
      userDetails = { error: "User ID not found in session" };
    }
  }

  return {
    userDetails,
  };
}
