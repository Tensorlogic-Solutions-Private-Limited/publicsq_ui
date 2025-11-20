import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { redirect } from "@sveltejs/kit";
// import { handleRedirection } from '$lib/utils/helper.js';
// import { userDetails } from '/src/routes/store.js'
export async function load({ fetch, url, parent, depends }) {
  depends("states-data");

  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }

  const getStates = async () => {
    let res;
    try {
         
      res = await fetch("/apis/states");

      if (!res.ok) {
        throw new Error("Data not found");
      }

      const data = await res.json();

      // Check if we have data and it's an array
      if (data?.data && Array.isArray(data.data)) {
        if (data?.data?.length === 0 || Object.keys(data?.data)?.length === 0) {
          throw new Error("Data not found");
        }
        return data.data.map((state) => ({
          id: state.id,
          name: state.state_name,
          iso_code: state.iso_code,
        }));
      }

      return { status: res.status, error: "Data not found" };
    } catch (err) {
      console.error("Error fetching states:", err);
      return { status: res.status, error: err.message };
    }
  };

  return {
    states: await getStates(),
  };
}
