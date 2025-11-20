<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/utils/apiClient.js";
  import DataTable from "$lib/components/reusable/DataTable.svelte";
  import DatatableSkeleton from "$lib/components/reusable/DatatableSkeleton.svelte";
  import Eye from "@lucide/svelte/icons/eye";

  let exams = [];
  let isLoading = true;
  let apiError = null;

  // Table configuration
  const tableHeaders = [
    { key: "exam_name", name: "Title" },
    { key: "standard", name: "Class", width: "10%" },
    { key: "subjects", name: "Subject" },
    { key: "created_at", name: "Created", width: "25%" },
  ];

  const actionConfigObject = [
    {
      actionName: "View",
      icon: Eye,
      modal: false,
      size: 18,
    },
  ];

  const customRenderers = {
    standard: (data) => {
      const standard = data?.standard || "-";
      const division = data?.division ? data?.division : "";
      return `<span>${standard} ${division}</span>`;
    },
  };

  // ------------------ Table Related Functions ----------------------------------

  function formatTableData(examData) {
    if (!examData || !Array.isArray(examData)) return [];

    return examData.map((exam) => ({
      ...exam,
      subjects: Array.isArray(exam.subjects)
        ? exam.subjects.join(", ")
        : exam.subjects || "N/A",
      created_at: exam?.created_at
        ? new Date(
            exam.created_at.endsWith("Z")
              ? exam.created_at
              : exam.created_at + "Z"
          ).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata", // Convert to IST
          })
        : "-",
    }));
  }

  function handleTableAction(event) {
    const { actionName, actionData } = event.detail;
    const action = actionName?.toLowerCase()?.trim();

    if (action === "view") {
      goto(`/exams/${actionData?.exam_code}/details`);
    }
  }

  onMount(async () => {
    try {
      // Fetch only recently conducted exams (closed status)
      const response = await apiClient(
        "/apis/v2/exams?status=completed&page=1&page_size=10"
      );
      if (!response || !response.ok) {
        throw new Error(
          `API response error: ${response?.status || "Unknown error"}`
        );
      }
      const data = await response.json();

      exams = formatTableData(data?.data || []);
    } catch (error) {
      console.error("Failed to fetch recent exams:", error);
      apiError = "Failed to load recent exams";
      exams = [];
    } finally {
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <DatatableSkeleton />
{:else}
  <DataTable
    tableData={exams}
    tableHeadersDisplay={tableHeaders}
    {actionConfigObject}
    entriesPerPage={10}
    showPagination={false}
    tableStyle="primary"
    notFoundMessage={apiError || "No conducted exams found"}
    headerColour={"bg-gradient-to-r from-blue-50 to-indigo-50"}
    bulkSelect={false}
    {customRenderers}
    serverSidePagination={false}
    on:tableActionClick={handleTableAction}
  />
{/if}

<!-- Footer with count -->
{#if !isLoading && exams.length > 0}
  <div class="mt-4 pt-3 border-t border-gray-200">
    <p class="text-xs text-gray-500 text-center">
      Showing {exams.length} recent conducted exams
    </p>
  </div>
{/if}
