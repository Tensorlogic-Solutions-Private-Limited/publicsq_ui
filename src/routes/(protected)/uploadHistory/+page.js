import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { redirect } from "@sveltejs/kit";
import { apiClient } from "$lib/utils/apiClient.js";

// import { handleRedirection } from '$lib/utils/helper.js';
// import { userDetails } from '/src/routes/store.js'

export async function load({ fetch, url, parent }) {
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }

  const getJobs = async () => {
    let res;
    try {
      // res = await fetch(`/apis/jobs?page=0&size=10`);
      res = await fetch(`/apis/jobs`);

      if (!res || !res.ok || res.status !== 200) {
        throw new Error("Data not found");
      }

      const data = await res.json();
      if (data?.length === 0 || Object.keys(data)?.length === 0) {
        throw new Error("Data not found");
      }

      return data;
    } catch (err) {
      // handleRedirection(res.status, url.pathname, url.search);
      return { status: res.status, error: err.message };
    }
  };

  return {
    bulkUploadHistory: await getJobs(),
  };
}
