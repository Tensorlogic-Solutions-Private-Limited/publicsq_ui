<script>
  import { goto } from "$app/navigation";
  import { authStore } from "$lib/stores/authStore.js";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { Eye, EyeOff } from "@lucide/svelte";


  let username = "";
  let password = "";
  let error = null;
  let loading = false;
  let showPassword = false ; 

  // This is crucial - initialize authStore from session on component mount
  export let data;

  onMount(() => {
    // Initialize the auth store from the session data
    if (data?.session) {
      authStore.set({
        isAuthenticated: true,
        token: data.session.token,
        username: data.session.username,
        userId: data.session.userId,
        roleCode: data.session.roleCode,
        roleName: data.session.roleName,
        role: data.session.roleName,
        orgId:data?.session.orgId,
        blockId:data?.session.blockId,
        orgName:data?.session.orgName,
      });
    }
  });

  async function handleSubmit(event) {
    event.preventDefault();
    loading = true;
    error = null;

    try {
      const response = await fetch("/apis/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errMsg = "Login failed";
        try {
          const errData = await response.json();
          errMsg = errData?.detail || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      //  NEED TO BE REMOVED AFTER DEMO
      // localStorage.setItem("token", data.user.access_token);

      // Fetch user details for org/block
      let orgId = null;
      let blockId = null;
      let blockName = null;
      let orgCode= null
      let orgName = null
      try {
        const userDetailsRes = await fetch(`/apis/profile/${data.user.user_uuid}`, {
          headers: {
            Authorization: `Bearer ${data.user.access_token}`,
            "Content-Type": "application/json"
          }
        });
        if (userDetailsRes.ok) {
          const userDetails = await userDetailsRes.json();
          orgId = userDetails?.organization?.uuid ?? null;
          // orgCode=userDetails.organization.org_code ??null;
          orgName=userDetails?.organization?.org_name ?? null;
          blockId = userDetails?.block?.uuid ?? null;
          blockName = userDetails?.block?.block_name ?? null;
        }
      } catch (e) {
        console.error("Failed to fetch user details", e);
      }

      // Update the authStore
      authStore.set({
        isAuthenticated: true,
        token: data.user.access_token,
        username: data.user.username,
        userId: data.user.user_uuid,
        roleCode: data.user.role_code,
        roleName: data.user.role_name,
        role: data.user.role_name,
        organizationId: orgId,
        blockId: blockId,
        blockName: blockName,
        orgName:orgName
      });

      // Check for redirectTo parameter in URL
      const redirectTo = $page.url.searchParams.get('redirectTo');
      const targetUrl = redirectTo || '/home';
      
      console.log('Redirecting to:', targetUrl);
      
      // IMPORTANT: Use goto instead of window.location for SPA navigation
      await goto(targetUrl, { invalidateAll: true });
    } catch (err) {
      error = err.message;
      console.error("Login error:", err);
    } finally {
      loading = false;
    }
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 sm:px-6 lg:px-8"
>
  <div class="w-full max-w-md">
    <!-- Logo/Header Section -->
    <div class="text-center mb-8">
      <div
        class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg"
      >
        <svg
          class="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Glad to see you, Again!
      </h1>
      <!-- <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    <span class="block">Welcome to</span>
                    <span class="block text-blue-600">Smart QP</span>
                </h1> -->
      <!-- <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Please login to access the question paper management system.
                </p> -->
      <p class="text-gray-600">Please sign in to your account</p>
    </div>

    <!-- Login Form -->
    <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <form on:submit={handleSubmit} class="space-y-6">
        {#if error}
          <div class="bg-red-50 border border-red-200 rounded-xl p-4">
            <div class="flex items-center">
              <svg
                class="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="text-sm text-red-700">{error}</span>
            </div>
          </div>
        {/if}

        <!-- Username Input -->
        <div class="space-y-2">
          <label for="username" class="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <svg
                class="h-5 w-5 text-gray-400"
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
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              bind:value={username}
              class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter your username"
            />
          </div>
        </div>

        <!-- Password Input -->
        <div class="space-y-2">
  <label for="password" class="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg
        class="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    </div>
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      required
      bind:value={password}
      class="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
      placeholder="Enter your password"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 pr-3 flex items-center"
      on:click={() => showPassword = !showPassword}
    >
      {#if showPassword}
        <!-- Eye Off Icon -->
        <svg
          class="h-5 w-5 text-gray-400 hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      {:else}
        <!-- Eye Icon -->
        <svg
          class="h-5 w-5 text-gray-400 hover:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      {/if}
    </button>
  </div>
</div>

        <!-- Login Button -->
        <button
          type="submit"
          disabled={loading}
          class="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {#if loading}
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            Signing in...
          {:else}
            Login
          {/if}
        </button>
      </form>

      <!-- Register Link -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600">
          Don't have an account? Please contact admin.
          <!-- <a
            href="/register"
            class="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
          >
            Register Now
          </a> -->
        </p>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="mt-8 text-center">
      <p class="text-xs text-gray-500">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
</div>
