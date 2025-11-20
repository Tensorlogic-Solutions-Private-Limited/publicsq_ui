<script>
  import { createEventDispatcher } from "svelte";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import BurgerMenu from "$lib/components/reusable/SideBarSmallScreen.svelte";
  import { FileText, X, Menu } from "@lucide/svelte";

  export let isLoggedIn = false;
  export let sidebarList = [];

  let dispatch = createEventDispatcher();
  let burgerMenuOpen = false;
  let menuItemClicked = false;
  let showProfilePopup = false;
  let profileRef;

  // Dispatcher is created for conditionally hiding the page content when menu is open.(Yet to be implemented)
  function handleClick() {
    menuItemClicked = false;
    burgerMenuOpen = !burgerMenuOpen;
    dispatch("burgerMenuOpen", burgerMenuOpen);
  }

  function handleLogoClick() {
    burgerMenuOpen = false;
  }

  function handleClickOutside(event) {
    if (profileRef && !profileRef.contains(event.target)) {
      showProfilePopup = false;
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
    }
  });
</script>

<header
  class="h-16 fixed  top-0 left-0 right-0 sm:h-20 py-2 px-4 flex justify-between items-center lg:py-2 lg:px-20 bg-ivory text-darkGray shadow-md w-full z-[90] bg-white text-slate-800"
>
  <div class="p-2 border-slate-700" on:click={handleLogoClick}>
    <a href="/home" class="flex items-center space-x-3">
      <div
        class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"
      >
        <FileText size={20} class="text-white" />
      </div>
      <div>
        <div class="text-base sm:text-lg font-bold text-slate-800">
          Smart QP
        </div>
      </div>
    </a>
  </div>

  <!-- Mobile Header Button -->
  {#if isLoggedIn}
    <div class="md:hidden">
      {#if burgerMenuOpen}
        <!-- Button on Menu open state -->

        <button
          type="button"
          class=" rounded-md text-slate-800 absolute right-4 top-5 sm:top-7"
          on:click={handleClick}
        >
          <span class="sr-only">Close menu</span>
          <X size={20} />
        </button>
      {:else}
        <!-- Button on menu closed state -->
        <button
          type="button"
          class=" rounded-md text-slate-800 absolute right-4 top-5 sm:top-7"
          on:click={handleClick}
        >
          <span class="sr-only">Open menu</span>
          <Menu size={20} color="black" />
        </button>
      {/if}
    </div>
  {/if}
</header>

<!-- Mobile Menu Items -->

<BurgerMenu
  {sidebarList}
  bind:burgerMenuOpen
  bind:menuItemClicked
  {isLoggedIn}
/>
