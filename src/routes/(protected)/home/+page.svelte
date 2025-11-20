<script>
  import { goto } from "$app/navigation";
  import RecentTableList from "$lib/components/dashboard/RecentTableList.svelte";
  import { authStore } from "$lib/stores/authStore.js";
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import DetailsHeader from "$lib/components/reusable/DetailsHeader.svelte";

  const dispatch = createEventDispatcher();

  export let data;
  let { userDetails } = data;

  // Get correct data from auth store
  $: isAuthenticatedFromStore = $authStore?.isAuthenticated;
  $: userNameFromStore = $authStore?.username;
  $: roleCodeFromStore = $authStore?.roleCode;
  $: roleFromStore = $authStore?.roleName;
  $: userIdFromStore = $authStore?.userId;

  // Admin check using correct authStore properties
  $: isAdmin = !!(isAuthenticatedFromStore && roleCodeFromStore === "100");

  // Mock stats data for the second widget
  $: stats = [
    { label: "Total Exams", value: "91", icon: "📊" },
    { label: "This Month", value: "12", icon: "📅" },
    { label: "Published", value: "78", icon: "✅" },
    { label: "Draft", value: "13", icon: "📝" },
  ];

  function navigateTo(route) {
    // Additional auth check before navigation
    if (!isAuthenticatedFromStore && route !== "/auth/login") {
      console.warn("Not authenticated, redirecting to login");
      // goto('/auth/login');
      return;
    }

    // Check admin access for admin route
    if (route === "/users" && !isAdmin) {
      console.warn("Not authorized for admin access");
      alert("You do not have permission to access the admin panel.");
      return;
    }

    goto(route);
  }
</script>

<main class="min-h-screen bg-gray-50">
  <!-- Hero Section -->
  <div class="bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
      <div class="text-center">
        <h1
          class="text-xl sm:text-2xl md:text-3xl tracking-tight font-extrabold text-gray-900"
        >
          <p class="leading-tight">
            Welcome back,
            <span class="text-blue-600 block sm:inline">
              {userNameFromStore || "User"}
            </span>
          </p>
        </h1>
        <p
          class="mt-3 max-w-md mx-auto text-sm sm:text-base md:mt-5 text-gray-500"
        >
          Manage your exams with Smart QP
        </p>
      </div>
    </div>
  </div>

  <!-- Dashboard Content -->

  <!-- <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"> -->
  <!-- User Details Header -->

  <!-- Dashboard Stats - Responsive layout -->
  <!-- <div class="mb-6 sm:mb-8"> -->
  <!-- <h2 class="heading-L mb-4 sm:mb-6">
          Dashboard Stats
        </h2>
        <div
          class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        > -->
  <!-- Widget Header -->
  <!-- <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 class="text-sm font-medium text-gray-900">Overview</h3>
          </div> -->
  <!-- </div> -->
  <!-- </div> -->

  {#if !userDetails?.error}
    <div class="mb-8">
      <DetailsHeader
        icon={null}
        heading={userDetails?.full_name || userDetails?.username || "User"}
        code={userDetails?.role?.role_code}
        description={userDetails?.email}
        organizationInfo={userDetails?.organization
          ? {
              label: "Organization",
              value: userDetails.organization.org_name,
            }
          : null}
        blockInfo={userDetails?.block
          ? { label: "Block", value: userDetails.block.block_name }
          : null}
        schoolInfo={userDetails?.school
          ? { label: "School", value: userDetails.school.school_name }
          : null}
        isActive={userDetails?.is_active}
        lastUpdatedOn={userDetails?.updated_at
          ? new Date(userDetails.updated_at).toLocaleString("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            })
          : ""}
      />
    </div>

    <hr class="text-dark-gray mt-2 mb-6" />
  {/if}

  <!-- Recent Exams - Full width to match stats widget -->
  <div class="mb-6 sm:mb-8 mx-2">
    <h2 class="text-base font-medium mb-4">Recent Exams</h2>
    <RecentTableList />
  </div>
  <!-- </div> -->
</main>
