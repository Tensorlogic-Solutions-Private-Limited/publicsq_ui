<script>
  import { authStore } from "$lib/stores/authStore";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import { PUBLIC_APP_NAME } from "$env/static/public";

  // Use the store value directly
  $: isAuthenticated = $authStore.isAuthenticated;
  $: currentPath = $page.url.pathname;

  // Better detection for quiz running mode
  let isQuizRunning = false;
  let checkInterval;

  // Check if we're in quiz running mode more reliably
  function checkQuizRunningStatus() {
    if (!browser) return false;

    // Check for quiz fullscreen element
    const quizFullscreen = document.querySelector(".quiz-fullscreen");

    // Check for quiz runner component
    const quizRunner = document.querySelector('[data-quiz-runner="true"]');

    // Check current URL path
    const isQuizPath =
      currentPath === "/quiz" || currentPath.startsWith("/quiz/");

    // Check for specific quiz running indicators in the DOM
    const hasQuizTimer = document.querySelector("[data-quiz-timer]");
    const hasQuestionNavigation = document.querySelector(
      "[data-question-navigation]"
    );

    return !!(
      quizFullscreen ||
      quizRunner ||
      (isQuizPath && (hasQuizTimer || hasQuestionNavigation))
    );
  }

  onMount(() => {
    if (browser) {
      // Initial check
      isQuizRunning = checkQuizRunningStatus();

      // This is checkup added for autosave feature in quiz setup. They will not use
      // Set up periodic checking -
      checkInterval = setInterval(() => {
        const newStatus = checkQuizRunningStatus();
        if (newStatus !== isQuizRunning) {
          isQuizRunning = newStatus;
        }
      }, 500); // Check every 500ms
    }
  });

  onDestroy(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

  // Update when path changes
  $: if (currentPath) {
    if (browser) {
      setTimeout(() => {
        isQuizRunning = checkQuizRunningStatus();
      }, 100);
    }
  }

  $: hideHeader = isQuizRunning || currentPath.includes("/quiz/running");

  async function handleLogout() {
    try {
      const res = await fetch("/apis/logout", { method: "POST" });
      if (res.ok) {
        // TO BE REMOVED AFTER DEMO
     
        authStore.set({});
        await goto("/");
      } else {
        alert("Logout failed.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed.");
    }
  }

  // Check if a route is active
  function isActiveRoute(route) {
  if (!browser) return false;
  
  // Special case for home route
  if (route === '/home' && currentPath === '/') {
    return true;
  }

  // Handle exact matches
  if (route === currentPath) {
    return true;
  }

  // Handle nested routes
  if (route !== '/' && currentPath.startsWith(route)) {
    // Ensure we don't match partial paths (e.g. /user shouldn't match /users)
    const nextChar = currentPath.charAt(route.length);
    return nextChar === '' || nextChar === '/';
  }

  return false;
}

// Add these reactive statements near your other reactive declarations
$: {
  // Force route check when path changes
  if (browser && currentPath) {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const links = document.querySelectorAll('nav a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && isActiveRoute(href)) {
          link.classList.add('active-route');
        } else {
          link.classList.remove('active-route');
        }
      });
    }, 0);
  }
}
</script>



<!-- Only show header if not in quiz running mode -->
{#if isAuthenticated && !hideHeader}
  <!-- Vertical Sidebar -->
  <aside
    class="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white shadow-xl z-50"
  >
    <!-- Header/Logo Section -->
    <div class="p-6 border-b border-slate-700">
      <a href="/home" class="flex items-center space-x-3">
        <div
          class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <div class="text-xl font-bold text-white">SmartQP</div>
          <div class="text-xs text-slate-400">Question Paper System</div>
        </div>
      </a>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4">
      <ul class="space-y-2">
        <!-- Dashboard -->
        <li>
          <a
            href="/home"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/home'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z"
              />
            </svg>
            <span class="font-medium">Dashboard</span>
          </a>
        </li>

        {#if PUBLIC_APP_NAME !== "quiz_generator"}
          <!-- Create Paper -->
          <li>
            <a
              href="/create-paper"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
                '/create-paper'
              )
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span class="font-medium">Create Paper</span>
            </a>
          </li>
        {/if}

        <!-- Create Quiz -->
        <li>
          <a
            href="/quiz"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/quiz'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-medium">Create Quiz</span>
          </a>
        </li>

        {#if PUBLIC_APP_NAME !== "quiz_generator"}
          <!-- View Papers -->
          <li>
            <a
              href="/search"
              class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
                '/search'
              )
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m-5-8h8m-8 4h8m-7-8h8m-8 8h8M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
              </svg>
              <span class="font-medium">View Papers</span>
            </a>
          </li>
        {/if}

        <!-- Users/Admin -->
        <li>
          <a
            href="/users"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/users'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <span class="font-medium">Users</span>
          </a>
        </li>

        <!-- Profile -->
        <li>
          <a
            href="/updateProfile/[id]"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/updateProfile'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="font-medium">Profile</span>
          </a>
        </li>
        <li>
          <a
            href="/questions"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/questions'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <!-- <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg> -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-file-question-mark-icon lucide-file-question-mark"
              ><path d="M12 17h.01" /><path
                d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"
              /><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" /></svg
            >
            <span class="font-medium">Questions</span>
          </a>
        </li>
        <li>
          <a
            href="/uploadHistory"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/uploadHistory'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="font-medium">Upload History</span>
          </a>
        </li>
        <!-- Organizations -->
        <li>
          <a
            href="/organizations"
            class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {isActiveRoute(
              '/organizations'
            )
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="font-medium">Organizations</span>
          </a>
        </li>
      </ul>
    </nav>

    <!-- User Section at Bottom -->
    <div class="p-4 border-t border-slate-700">
      <div class="flex items-center space-x-3 px-4 py-3">
        <img
          src="https://ui-avatars.com/api/?name=User&background=6366f1&color=ffffff"
          alt="User Avatar"
          class="h-10 w-10 rounded-full ring-2 ring-slate-600"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate">
            {$authStore.username}
          </div>
          <!-- <div class="text-xs text-slate-400 truncate">user@example.com</div> -->
        </div>
      </div>

      <!-- Logout Button -->
      <button
        on:click={handleLogout}
        class="w-full flex items-center space-x-3 px-4 py-2 mt-2 text-slate-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span class="font-medium">Sign Out</span>
      </button>
    </div>
  </aside>

  <!-- Main Content Spacer - only when header is visible -->
  <div class="ml-64">
    <!-- This div pushes main content to the right of the sidebar -->
  </div>
{:else if !isAuthenticated}
  <!-- Public Header (for non-authenticated users) -->
  <header class="bg-white border-b shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <a href="/" class="flex items-center">
            <div class="text-2xl font-bold text-indigo-600">SmartQP</div>
          </a>
        </div>

        <!-- Public Right Section -->
        <div class="flex items-center space-x-4">
          <a
            href="/"
            class="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
          >
            Login
          </a>
          <a
            href="/register"
            class="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 px-4 py-2 rounded-md"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  </header>
{/if}
