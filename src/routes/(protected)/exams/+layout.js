import { authStore } from "$lib/stores/authStore";
import { browser } from "$app/environment";
import { apiClient } from "$lib/utils/apiClient.js";

export async function load({ parent, fetch, depends ,url }) {
  depends("subject-medium");

  async function fetchResource(urlPath, failMsg) {
    const result = { data: null, error: false, errorMsg: "" };
    try {
      const res = await fetch(urlPath);

      if (!res || !res.ok) {
        result.error = true;
        result.errorMsg = failMsg;
      } else {
        result.data = await res.json();
      }
    } catch (err) {
      result.error = true;
      result.errorMsg = err.message || "Unknown error";
    }
    return result;
  }

  let [subjectsData, mediumsData, boardsData] = await Promise.all([
    fetchResource("/apis/subjects", "Failed to fetch subjects"),
    fetchResource("/apis/mediums", "Failed to fetch mediums"),
    fetchResource("/apis/boards", "Failed to fetch boards"),
  ]);

  mediumsData.data = mediumsData?.data?.map((item) => ({
    id: item.medium_code,
    name: item.medium_name,
  }));
  subjectsData.data = subjectsData?.data?.map((item) => ({
    ...item,
    id: item.subject_code,
    name: `Class ${item.standard}-${item.subject_name}`,
  }));
  
  boardsData.data = boardsData.data?.map((item) => ({
    id: item.board_id,
    name: item.board_name,
  }));

  return {
    subjectsData,
    mediumsData,
    boardsData,
  };
}
