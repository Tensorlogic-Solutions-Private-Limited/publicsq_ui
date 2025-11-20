import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { redirect, error } from "@sveltejs/kit";

export async function load({ parent, fetch }) {
  if (browser) {
    const { session } = await parent();
    authStore.set(session);
  }

  // async function fetchResource(url, failMsg) {
  //   const result = { data: null, error: false, errorMsg: "" };
  //   try {
  //     const res = await fetch(url);
  //     if (!res.ok) {
  //       result.error = true;
  //       result.errorMsg = failMsg;
  //     } else {
  //       result.data = await res.json();
  //     }
  //   } catch (err) {
  //     result.error = true;
  //     result.errorMsg = err.message || "Unknown error";
  //   }
  //   return result;
  // }

  // let [subjectsData, mediumsData, boardsData] = await Promise.all([
  //   fetchResource("/apis/subjects", "Failed to fetch subjects"),
  //   fetchResource("/apis/mediums", "Failed to fetch mediums"),
  //   fetchResource("/apis/boards", "Failed to fetch boards"),
  // ]);

  // mediumsData.data = mediumsData?.data?.map((item) => ({
  //   id: item.medium_code,
  //   name: item.medium_name,
  // }));
  // subjectsData.data = subjectsData?.data?.map((item) => ({
  //   ...item,
  //   id: item.subject_code,
  //   name: `Class ${item.standard}-${item.subject_name}`,
  // }));
  // boardsData.data = boardsData.data?.map((item) => ({
  //   id: item.board_id,
  //   name: item.board_name,
  // }));

  return {
    subjectsData:[],
    mediumsData:[],
    boardsData:[],
  };
}
