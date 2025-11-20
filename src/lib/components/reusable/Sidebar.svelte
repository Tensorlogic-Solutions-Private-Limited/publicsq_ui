<script context="module">
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/authStore";

  export async function handleLogout() {
    try {
      const res = await fetch("/apis/logout", { method: "POST" });
      if (res.ok) {
        // TO BE REMOVED AFTER DEMO
        localStorage.removeItem("token");
        authStore.set({});
        await goto("/", { invalidateAll: true });
      } else {
        alert("Logout failed.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed.");
    }
  }
</script>

<script>
  import {
    Home,
    FileText,
    HelpCircle,
    Search,
    Users,
    User,
    History,
    FilePlus,
    LogOut,
  } from "@lucide/svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { roles } from "$lib/config.js";

  // import { roles } from '$lib/config.js';
  // import { userDetails } from '/src/routes/store.js';
  // import { menuItems, rolesWithCentreDetailsLabel, rolesWithStateDetailsLabel } from '$lib/data.js';
  export let sidebarList = [];
  $: route = $page.url.pathname;

  let filteredSidebarList = [];

  // this function checks which of the side bar is currently active
  function compareRouteBase(route1, route2) {
    // remove '/' from the front
    route1 = route1?.slice(1);
    route2 = route2?.slice(1);

    // separeate all using the '/'
    route1 = route1?.split("/");
    route2 = route2?.split("/");

    // compair the first of each array to check if they are same then base route is same
    if (route1?.[0] == route2?.[0]) {
      return true;
    }
    return false;
  }

  let sidebarOpen = false;
  function toogleMenu() {
    sidebarOpen = !sidebarOpen;
  }

  function handleViewProfile(){
    console.log('view profile')
  }

  // handleLogout is now imported from context=module
  // -------------------{--------------- Role based functions --------------------------------
    function roleBasedAcessSetting() {
      // Filter the sidebar list by checking if the item's key is not in the restrictedMenuList
      filteredSidebarList = sidebarList?.filter((item) => {
        // Only include items that are NOT in the restricted menu list
        return !roles[$authStore?.roleCode]?.restrictedMenuList?.includes(item?.key?.toLowerCase()?.trim());
      });
    }

  onMount(() => {
    const unsubscribe = authStore?.subscribe((user) => {
      if (user && Object.keys(user)?.length > 0) {
        roleBasedAcessSetting(user);
      } else{
        filteredSidebarList=sidebarList
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  });
</script>

<aside
  class="w-1/5 min-w-60 p-4 border-r border-gray-50 md:block hidden bg-slate-800 text-white shadow-xl"
>
  <div class="p-6 border-b border-slate-700">
    <a href="/home" class="flex items-center space-x-3">
      <div
        class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
      >
        <FileText size={20} class="text-white" />
      </div>
      <div>
        <div class="text-xl font-bold text-white">Smart QP</div>
      </div>
    </a>
  </div>

  {#each filteredSidebarList as item, index (index)}
    <div
      aria-current={compareRouteBase(item.link, route) ? "page" : undefined}
      class="p-2 rounded-md font-medium mb-2 text-primary text-sm 2xl:text-base {compareRouteBase(
        item.link,
        route
      )
        ? 'bg-indigo-600 text-white hover:none'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
    >
      <a href={item.link} class="flex items-center gap-3 w-full">
        <svelte:component this={item.icon} size={18} class="shrink-0" />
        <h3 class="text-base leading-none">{item.name}</h3>
      </a>
    </div>
  {/each}

  <div class="p-4 border-t border-slate-700">
    <button on:click={handleViewProfile} class="cursor-pointer">
      <div class="flex items-center space-x-3 px-4 py-3">
        <div
          class="h-10 w-10 rounded-full ring-2 ring-slate-600 bg-slate-700 flex items-center justify-center"
        >
          <User size={20} class="text-indigo-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white truncate">
            {$authStore?.username || "-"}
          </p>
          <span class="text-xs font-medium text-slate-400 truncate"
            >{$authStore?.roleName || "-"}</span
          >
        </div>
      </div>
    </button>

    <button
      on:click={handleLogout}
      class="w-full flex items-center space-x-3 px-4 py-2 mt-2 text-slate-300 hover:bg-red-400 hover:text-white rounded-lg transition-all duration-200"
    >
      <svelte:component this={LogOut} size={18} />
      <span class="font-medium text-sm">Sign Out</span>
    </button>
  </div>
</aside>
