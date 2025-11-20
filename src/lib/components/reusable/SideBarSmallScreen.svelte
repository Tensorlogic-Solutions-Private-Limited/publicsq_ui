<script>
  import Button from "$lib/components/reusable/Button.svelte";
  import { handleLogout } from "$lib/components/reusable/Sidebar.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { authStore } from "$lib/stores/authStore";
  import {
    Home,
    FileText,
    HelpCircle,
    Search,
    Users,
    User,
    History,
    FilePlus,
  } from "@lucide/svelte";

  // import { menuItems, rolesWithCentreDetailsLabel, rolesWithStateDetailsLabel } from '$lib/data.js';
  // import { roles } from '$lib/config.js';

  export let burgerMenuOpen;
  export let menuItemClicked;
  export let isLoggedIn = false;
  export let sidebarList = [];

  // let filteredSidebarList = [];

  // let sidebarList = [
  //   { name: "Dashboard", link: "/home", key: "DASHBOARD", icon: Home },
  //   {
  //     name: "Create Paper",
  //     link: "/create-paper",
  //     key: "CREATE_PAPER",
  //     icon: FilePlus,
  //   },
  //   { name: "Create Quiz", link: "/quiz", key: "QUIZ", icon: FileText },
  //   { name: "View Papers", link: "/search", key: "VIEW_PAPERS", icon: Search },
  //   { name: "Users", link: "/admin", key: "USERS", icon: Users },
  //   {
  //     name: "Profile",
  //     link: "/updateProfile/[id]",
  //     key: "PROFILE",
  //     icon: User,
  //   },
  //   {
  //     name: "Questions",
  //     link: "/questions",
  //     key: "QUESTIONS",
  //     icon: HelpCircle,
  //   },
  //   {
  //     name: "Upload History",
  //     link: "/uploadHistory",
  //     key: "UPLOAD_HISTORY",
  //     icon: History,
  //   },
  // ];

  function handleMenuItemClick() {
    menuItemClicked = true;
    burgerMenuOpen = false;
  }

  // function roleBasedAcessSetting() {
  //   filteredSidebarList = sidebarList?.filter(
  //     (item) => !roles[$userDetails?.role]?.restrictedMenuList?.includes(item?.key)
  //   );

  //   if (rolesWithCentreDetailsLabel?.includes(Number($userDetails?.role))) {
  //     filteredSidebarList.forEach((item) => {
  //       if (item?.key === menuItems?.TRAINING_CENTERS) {
  //         item.name = 'Center Details';
  //         item.link = `/trainingCenters/${$userDetails?.rsetiId}/details`;
  //       }
  //     });
  //   }

  //   if (rolesWithStateDetailsLabel?.includes(Number($userDetails?.role))) {
  //     filteredSidebarList.forEach((item) => {
  //       if (item?.key === menuItems?.STATES) {
  //         item.name = 'State Details';
  //         item.link = `/states/${$userDetails?.stateId}/details`;
  //       }
  //     });
  //   }
  // }

  // onMount(() => {
  //   const unsubscribe = userDetails?.subscribe((user) => {
  //     if (user && Object.keys(user)?.length > 0) {
  //       roleBasedAcessSetting(user);
  //     }
  //   });

  //   return () => unsubscribe();
  // });
</script>

{#if isLoggedIn}
  <div
    class="md:hidden mt-16 sm:mt-20 fixed w-72 z-50 h-full bg-slate-50 shadow-lg transition-all ease-in-out duration-500 border-l border-slate-300 overflow-y-auto flow-root
    {burgerMenuOpen ? 'right-0' : '-right-72'}"
  >
    <nav class="divide-y divide-slate-300">
      <div class="p-4">
        {#if $authStore?.username}
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="flex items-center justify-center w-10 h-10 bg-indigo-600 text-slate-50 rounded-full text-base capitalize"
            >
              {$authStore?.username[0]}
            </div>
            <div class="flex flex-col">
              <span class="text-slate-800 font-medium text-sm truncate"
                >{$authStore?.username || "-"}</span
              >
              <!-- <a
              href="/userProfile"
              class="text-xs text-indigo-400 hover:text-indigo-300 underline"
              >View Profile</a
            > -->
            </div>
          </div>
          <Button customClass="w-full mb-4" on:click={handleLogout}
            >Logout</Button
          >
        {/if}
      </div>

      <ul
        on:click={handleMenuItemClick}
        class="space-y-1 p-2 divide-y divide-slate-200"
      >
        {#each sidebarList as item, index (index)}
          <li>
            <a
              href={item.link}
              class="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <svelte:component
                this={item.icon}
                size={18}
                class="shrink-0 text-slate-800"
              />
              <span class="truncate">{item.name}</span>
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
{/if}
