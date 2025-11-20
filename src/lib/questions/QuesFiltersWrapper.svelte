<script>
  import { onMount } from "svelte";
  import QuesFiltersSection from "$lib/questions/QuesFiltersSection.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";

  export let handleSearchQns = () => {};

  let subjectsList = [];
  let mediumsList = [];
  let boardsList = [];
  let loading = true;
  let mediumsError = null;
  let boardsError = null;

  async function fetchResource(url, failMsg) {
    const result = { data: null, error: false, errorMsg: "" };
    try {
      const res = await fetch(url);
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

  async function fetchAll() {
    loading = true;
    mediumsError = null;
    boardsError = null;
    const [mediumsRes, boardsRes] = await Promise.all([
      fetchResource("/apis/mediumss", "Failed to fetch mediums"),
      fetchResource("/apis/boards", "Failed to fetch boards"),
    ]);
    console.log("mediumsRes", mediumsRes);
    if (mediumsRes.error) {
      mediumsError = mediumsRes.errorMsg;
      mediumsList = [];
    } else {
      mediumsList = (mediumsRes?.data || []).map((m) => ({
        id: m.medium_code,
        name: m.medium_name,
      }));
    }
    if (boardsRes.error) {
      boardsError = boardsRes.errorMsg;
      boardsList = [];
    } else {
      // Transform to {id, name} if needed
      boardsList = (boardsRes?.data || []).map((b) => ({
        id: b.board_id || b.id,
        name: b.board_name,
      }));
    }
    loading = false;
  }

  async function retryResource(type) {
    loading = true;
    if (type === "mediums") {
      mediumsError = null;
      const res = await fetchResource(
        "/apis/mediums",
        "Failed to fetch mediums"
      );
      if (res.error) {
        mediumsError = res.errorMsg;
        mediumsList = [];
      } else {
        mediumsList = (res.data?.data || []).map((m) => ({
          id: m.medium_code,
          name: m.medium_name,
        }));
      }
    } else if (type === "boards") {
      boardsError = null;
      const res = await fetchResource("/apis/boards", "Failed to fetch boards");
      if (res.error) {
        boardsError = res.errorMsg;
        boardsList = [];
      } else {
        boardsList = (res.data?.data || []).map((b) => ({
          id: b.board_code || b.id,
          name: b.board_name || b.name,
        }));
      }
    }
    loading = false;
  }

  onMount(fetchAll);
</script>

{#if loading}
  <div class="p-8 text-center text-gray-500">Loading filters...</div>
{:else if mediumsError || boardsError}
  <div class="p-8 text-center text-red-600">
    {#if mediumsError}
      <div class="mb-2">
        {mediumsError}
        <button
          class="ml-2 underline text-blue-700"
          on:click={() => retryResource("mediums")}>Retry</button
        >
      </div>
    {/if}
    {#if boardsError}
      <div class="mb-2">
        {boardsError}
        <button
          class="ml-2 underline text-blue-700"
          on:click={() => retryResource("boards")}>Retry</button
        >
      </div>
    {/if}
  </div>
{/if}

  <QuesFiltersSection
    {subjectsList}
    {mediumsList}
    {boardsList}
    {handleSearchQns}
  />

