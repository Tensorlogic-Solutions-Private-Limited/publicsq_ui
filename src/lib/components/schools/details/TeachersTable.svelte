<script>
  import { onDestroy, onMount, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { USER_ROLES } from "$lib/constants.js";
  import { message , showAddAdminBtn, msgType } from "/src/routes/(protected)/schools/schoolStore.js";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import SearchBar from "$lib/components/reusable/SearchBar.svelte";
  import Button from "$lib/components/reusable/Button.svelte";
  import Eye from "@lucide/svelte/icons/eye";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Portal from "$lib/components/reusable/Portal.svelte";
  import TeacherDeletion from "./TeacherDeletion.svelte";
  import { apiClient } from "$lib/utils/apiClient.js";


  export let schoolId;
  export let blockId;
  export let orgId;
  export let schoolName=''

  const dispatch = createEventDispatcher();

  let showDeletionModal = false;
  let selectedTeacher = null;

  let currentPage = 1;
  let pageSize = 10;
  let totalItems = 0;
  let loading = true;

  let tableData = [];
  let searchValue = "";
  let apiError = null;

  let searchTimeout;
  const SEARCH_DEBOUNCE_MS = 500;

  let actionConfigObject = [
    {
      actionName: "View",
      icon: Eye,
      size: 18,
    },
    {
      actionName: "Edit",
      icon: PencilLine,
      size: 18,
    },
    {
      actionName: "Delete",
      icon: Trash2,
      size: 18,
    },
  ];

  const tableHeaders = [
    { key: "username", name: "Username", width: "10%" },
    { key: "full_name", name: "Name", width: "10%" },
    { key: "email", name: "Email", width: "10%" },
    { key: "phone", name: "Phone", width: "10%" },
    { key: "is_active", name: "Status", width: "10%" },
    { key: "updated_at", name: "Updated On", width: "10%" }
  ];

  let customRenderers = {
    is_active: (data) => {
      const status = data?.is_active;
      const base =
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
      const statusClass = {
        true: "bg-green-100 text-green-800 lowercase",
        false: "bg-red-100 text-red-800 lowercase",
      };
      return `<span class="${base} ${statusClass[status] || "bg-gray-100 text-gray-800 lowercase"}">${status === true ? "Active" : "Inactive" || "-"}</span>`;
    },
  };

  // ------------------------------- Table Related Function --------------------------------------

  function formatTableData(teachers) {
    if (!teachers || !Array.isArray(teachers)) return [];
    return teachers.map((teacher) => ({
      ...teacher,
      created_by:
        USER_ROLES[teacher?.created_by]?.role_name ||
        teacher?.created_by ||
        "-",
          updated_at: teacher?.updated_at
        ? new Date(
            teacher.updated_at.endsWith("Z")
              ? teacher.updated_at
              : teacher.updated_at + "Z"
          ).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata",
          })
        : "-",
    }));
  }

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    const action = actionName?.toLowerCase()?.trim();

    if (action === "edit") {
      goto(`/users/edit/${actionData?.uuid}?nt=teacher&from=/schools/${schoolId}/details`);
    } else if (action === "view") {
      goto(`/users/details/${actionData?.uuid}`);
    } else if (action === "delete") {
      selectedTeacher = actionData;
      showDeletionModal = true;
    }
  }

  function handlePageChange({ detail: { page, pageSize: newPageSize } }) {
    if (newPageSize && newPageSize !== pageSize) {
      pageSize = newPageSize;
      currentPage = 1;
      fetchTeachers(1, newPageSize, searchValue, true);
      return;
    }

    if (page !== currentPage) {
      currentPage = page;
      fetchTeachers(page, pageSize, searchValue);
    }
  }

  // --------------------------------- Fetching Teachers Data -----------------------------------
  async function fetchTeachers(
    page = 1,
    size = 10,
    searchValue = "",
    resetPagination = false
  ) {
    if (!browser) return;

    if (resetPagination) {
      page = 1;
      currentPage = 1;
    }

    loading = true;
    apiError = null;

    try {
      const queryParams = [];
      queryParams.push(`page=${page}`);
      queryParams.push(`per_page=${size}`);
      queryParams.push(`role_code=teacher`);
      // queryParams.push(`is_active=false`);
      queryParams.push(`school_uuid=${schoolId}`);

      if (searchValue?.trim()) {
        queryParams.push(`search=${encodeURIComponent(searchValue.trim())}`);
      }

      const response = await apiClient(`/apis/users?${queryParams.join("&")}`);
      if (!response || !response.ok) throw new Error("Failed to fetch teachers");

      const result = await response.json();

      tableData = formatTableData(result?.users || []);
      totalItems = result?.total || 0;

      if (tableData.length === 0 && totalItems === 0) {
        if (searchValue) {
          apiError = "No results found for your criteria.";
        } else {
          apiError = "No teachers available.";
        }
      } else {
        apiError = null;
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      apiError = `Failed to load teachers: ${error.message}`;
      tableData = [];
      totalItems = 0;
      currentPage = 1;
    } finally {
      loading = false;
    }
  }

  // --------------------------------------- Filters -----------------------------------------

  function handleSearchValue(e) {
    const newSearchValue = e?.detail || "";
    searchValue = newSearchValue;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchTeachers(1, pageSize, searchValue, true);
    }, SEARCH_DEBOUNCE_MS);
  }

  // ------------------------------ Add/Edit/Delete Teachers -------------------------

  // function handleAddTeacher() {
  //   const queryParams = new URLSearchParams({
  //     role_code: "teacher",
  //     school_id: schoolId,
  //     block_id: blockId,
  //     organization_id: orgId,
  //   });
  //   goto(`/users/add?${queryParams.toString()}&from=/schools/${schoolId}/details`);
  // }

function handleAddTeacher() {
    const queryParams = new URLSearchParams({
      role: "teacher",
      school_id: schoolId,
      block_id: blockId,
      org_id: orgId,
    });
    goto(
      `/users/add?${queryParams.toString()}&from=/schools/${schoolId}/details&preset=true&nt=teacher`
    )
  } ;
    


  async function handleDeletionSuccess(event) {
    const { message: deleteMessage } = event.detail;
    // await fetchTeachers(currentPage, pageSize, searchValue);

      if (selectedTeacher) {
      tableData = tableData.filter((item) => item.uuid !== selectedTeacher.uuid);
      totalItems -= 1;
      // grandTotal -=1;
    } // Check if the current page is now empty after deletion

    // change this to garndTotal when api supports
    if (tableData.length === 0 && totalItems > 0 && !searchValue && Object.keys(filters)?.length === 0) {
      // If the page is empty, try to get the previous page's data
      // until the user manually navigates or refreshes.
      if(currentPage > 1){
        let targetPage = currentPage - 1
        await fetchTeachers(targetPage, pageSize, searchValue, filters);
      } else{
        apiError = "No more items to display.";
      }
    }

    // Update block store with deletion message
    message.set(deleteMessage);
    showAddAdminBtn.set(false);
    msgType.set("success")

    showDeletionModal = false;
    selectedTeacher = null;
  }

  // ------------------------------ Life Cycle Functions --------------------------
  onMount(() => {
    if (browser) {
      fetchTeachers(currentPage, pageSize, searchValue);
    }
  });

  onDestroy(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
  });
</script>

<div class="px-6">
  <h2 class="text-base font-medium mb-4">
    Teachers in {schoolName || '-'}
    <span class="text-sm">{totalItems ? `(${totalItems})` : ""}</span>
  </h2>

  <!-- Search and Action Bar -->
  <div class="mb-5 flex gap-2 md:flex-nowrap flex-wrap">
    <SearchBar
      on:handleSearchValue={handleSearchValue}
      placeholder={"Search teachers"}
      showSearchButton={false}
    />
    <div class="flex justify-end gap-2">
      <Button
        on:click={handleAddTeacher}
        btnType="primary"
      >
        + Teacher
      </Button>
    </div>
  </div>

  <!-- Teachers Table -->
  <div>
    {#if loading}
      <DatatableSkeleton />
    {:else}
      <DataTable
        {tableData}
        tableHeadersDisplay={tableHeaders}
        {actionConfigObject}
        {searchValue}
        entriesPerPage={pageSize}
        showPagination={true}
        tableStyle="primary"
        notFoundMessage={apiError || "No teachers found."}
        headerColour={"bg-gradient-to-r from-blue-50 to-indigo-50"}
        bulkSelect={false}
        {customRenderers}
        serverSidePagination={true}
        apiCurrentPage={currentPage}
        apiTotalItems={totalItems}
        apiPageSize={pageSize}
        on:pageChange={handlePageChange}
        on:tableActionClick={handleTableAction}
      />
    {/if}
  </div>

  {#if apiError}
    <!-- Refresh Button -->
    <div class="flex justify-center items-center mt-4">
      <Button
        on:click={() => fetchTeachers(currentPage, pageSize, searchValue)}
        disabled={loading}
      >
        <RefreshCw class={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        <span class="text-sm">Refresh</span>
      </Button>
    </div>
  {/if}
</div>

{#if showDeletionModal}
  <Portal>
    <TeacherDeletion
      teacher={selectedTeacher}
      on:cancel={() => {
        showDeletionModal = false;
        selectedTeacher = null;
      }}
      on:success={handleDeletionSuccess}
    />
  </Portal>
{/if}
