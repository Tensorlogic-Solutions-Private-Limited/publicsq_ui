import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { apiClient } from "$lib/utils/apiClient.js";

export async function load({ fetch, params, parent }) {
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }

  const getSchool = async () => {
    let res;
    try {
      res = await fetch(`/apis/schools/${params?.id}`);

      if (!res || !res.ok) {
        throw new Error("Failed to fetch school details");
      }

      return await res.json();
    } catch (err) {
      return { error: err?.message, status: res?.status };
    }
  };

  return {
    school: await getSchool(),
    pageTitle: "Schools - Details",
  };
}
