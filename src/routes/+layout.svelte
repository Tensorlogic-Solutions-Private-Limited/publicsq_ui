<script>
  import "../app.css";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { page } from "$app/stores";
  import { authStore } from "$lib/stores/authStore";
  import Sidebar from "$lib/components/reusable/Sidebar.svelte";
  import Header2 from "$lib/components/reusable/Header2.svelte";
  import { afterNavigate } from "$app/navigation";
  import { hideOrganizationNotification } from "./(protected)/organizations/organizationStore.js";
  import BreadCrumbs from "$lib/components/reusable/BreadCrumbs.svelte";
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
    School,
    Landmark,
    Building2,
  } from "@lucide/svelte";
  import { PUBLIC_APP_NAME } from "$env/static/public";
  import { checkSidebarRules } from "$lib/utils/helper.js";

  export let data;

  $: isAuthenticated = data?.session?.isAuthenticated;

  let title;

  const staticRouteTitles = {
    "/home": "Dashboard",
    "/organizations": "Organizations",
    "/regions": "Regions",
    "/schools": "Schools",
    "/users": "Users",
    // "/quiz": "Quizzes",
    "/exams": "Exams",
    "/questions": "Questions",
    "/uploadHistory": "Upload History",
  };

  $: {
    const path = $page.url.pathname;
    if (Object.keys(staticRouteTitles).includes(path)) {
      title = `Smart Quiz | ${staticRouteTitles[path] || ""}`;
    } else if ($page.data.pageTitle) {
      // title = $page.data.pageTitle;
      title = `Smart Quiz | ${$page.data.pageTitle || ""}`;
    }
  }

  // Developer only defines simple rules here:
  const sidebarHideRules = [
    { route: "/" },
    { route: "/quiz/:exam_code/attempt" },
    { route: "/exams/:exam_code/attempt" },
    // Add more rules as needed
    // format is as below. if query params are present, add as below
    // { route: '/quiz/:exam_code/attempt', query: { step: 'running' } },
  ];

  

  // Routes where padding should be removed
  const noPaddingRoutes = ["/quiz/:exam_code/attempt","/exams/:exam_code/attempt"];

  // Routes where breadcrumbs should be hidden
  const hideBreadcrumbsRoutes = ["/quiz/:exam_code/attempt", "/exams/:exam_code/attempt"];

  function checkNoPaddingRules(routes, currentUrl) {
    const currentPath = currentUrl.pathname;

    return routes.some((route) => {
      // Convert route pattern to regex
      const pattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    });
  }

  function checkHideBreadcrumbsRules(routes, currentUrl) {
    const currentPath = currentUrl.pathname;

    return routes.some((route) => {
      // Convert route pattern to regex
      const pattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    });
  }
  
  $: hidesidebar = checkSidebarRules(sidebarHideRules, $page.url);

  $: removePadding = checkNoPaddingRules(noPaddingRoutes, $page.url);

  $: hideBreadcrumbs = checkHideBreadcrumbsRules(hideBreadcrumbsRoutes, $page.url);

  let sidebarList = [
    { name: "Dashboard", link: "/home", key: "DASHBOARD", icon: Home },
    {
      name: "Organizations",
      link: "/organizations",
      key: "ORGANIZATIONS",
      icon: Landmark,
    },
    {
      name: "Regions",
      link: "/regions",
      key: "REGIONS",
      icon: Building2,
    },
    {
      name: "Schools",
      link: "/schools",
      key: "SCHOOLS",
      icon: School,
    },
    { name: "Users", link: "/users", key: "USERS", icon: Users },

    {
      name: "Questions",
      link: "/questions",
      key: "QUESTIONS",
      icon: HelpCircle,
    },
    // { name: "Quizzes", link: "/quiz", key: "QUIZ", icon: FileText },
    { name: "Exams", link: "/exams", key: "EXAM", icon: FileText },
    {
      name: "Upload History",
      link: "/uploadHistory",
      key: "UPLOAD_HISTORY",
      icon: History,
    },
    {
      name: "Create Paper",
      link: "/create-paper",
      key: "CREATE_PAPER",
      icon: FilePlus,
    },

    { name: "View Papers", link: "/search", key: "VIEW_PAPERS", icon: Search },

    // {
    //   name: "My Profile",
    //   link: "/user-profile",
    //   key: "PROFILE",
    //   icon: User,
    // },
  ];

  const excludedRoutes = ["/search", "/create-paper"];

  $: filteredSidebarList = (() => {
    if (PUBLIC_APP_NAME) {
      return sidebarList.filter((item) => !excludedRoutes.includes(item.link));
    } else {
      return sidebarList;
    }
  })();
</script>

<svelte:head>
  <title>{title ?? "Smart Quiz"}</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <div class="md:hidden">
    <Header2 sidebarList={filteredSidebarList} isLoggedIn={isAuthenticated} />
  </div>

  <div class="flex-1 flex flex-row min-h-0">
    {#if !hidesidebar}
      <Sidebar sidebarList={filteredSidebarList} />
    {/if}
    <main
      class={removePadding
        ? "flex-1 min-w-0 bg-gray-50 min-h-screen"
        : "flex-1 min-w-0 bg-gray-50 p-4 pt-20 md:pt-4 px-8 min-h-screen"}
    >
    {#if !hideBreadcrumbs}
      <div class="mb-4 md:mb-8">
        <BreadCrumbs
          route={$page.route.id}
          params={$page.params}
          searchParams={$page.url.searchParams.toString()}
        />
      </div>
    {/if}
      <slot></slot>
    </main>
  </div>
  <!-- <div class="flex-shrink-0">
  </div> -->
  <Footer />
</div>
