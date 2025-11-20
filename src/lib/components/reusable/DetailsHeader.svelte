<script>
  import { createEventDispatcher } from "svelte";
  import {
    PencilLine,
    Trash2,
    CircleCheck,
    CircleX,
    LockKeyhole
  } from "@lucide/svelte/icons";
  import InfoRow from "$lib/components/reusable/InfoRow.svelte";
  import Button from "./Button.svelte";

  const dispatch = createEventDispatcher();

  // Basic props
  export let icon; // Icon component to be used
  export let heading = ""; // Main heading text
  export let code = ""; // Code to show next to heading
  export let description = ""; // Optional description

  // Action control props
  export let showEdit = false;
  export let showDelete = false;
  export let showPasswordChange = false ; 
  export let showActiveTag = true ;


  // Organization/Block/School info
  export let organizationInfo = null; // { label: "Organization", value: "Org Name" }
  export let blockInfo = null;
  export let schoolInfo = null;
  export let stateInfo = {};

  // Status props
  export let isActive = true;
  export let lastUpdatedOn = "";

  // Custom classes
  export let class_ = ""; // Additional classes for the main container

  function handleEdit() {
    dispatch("edit");
  }

  function handleDelete() {
    dispatch("delete");
  }
  
  function handlePasswordChange() { 
    dispatch("passwordChange") ; 
  }
</script>

<div class="bg-white rounded-lg shadow-sm text-dark-gray {class_}">
  <!-- Header with gradient background -->
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
    <!-- Main content split into left and right containers -->
    <div class="flex flex-wrap sm:flex-nowrap justify-between gap-4">
      <!-- Left Container -->
      <div class=" space-y-1">
        <div class="space-y-1">
          <!-- Title Section -->
          <div class="flex items-center gap-3">
            <svelte:component
              this={icon}
              class="w-5 h-5 text-blue-600"
            />
            <div class="flex items-center gap-3">
              <h2 class="heading-L text-dark-gray">{heading}</h2>
              {#if code}
                <p class="text-xs text-gray-500">( {code} )</p>
              {/if}
              {#if showEdit || showDelete || showPasswordChange}

                <div class="flex gap-2">
                  <!-- Handle password change  -->
                    {#if showPasswordChange}
                    <button
                      class="hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                      on:click={handlePasswordChange}
                      title="Change Password"
                    >
                      <LockKeyhole
                        size={14}
                        class="text-blue-600"
                      />
                    </button>
                  {/if}


                  {#if showEdit}
                    <button
                      class="hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                      on:click={handleEdit}
                      title="Edit"
                    >
                      <PencilLine
                        size={14}
                        class="text-blue-600"
                      />
                    </button>
                  {/if}
                  {#if showDelete}
                    <button
                      class="hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                      on:click={handleDelete}
                      title="Delete"
                    >
                      <Trash2
                        size={14}
                        class="text-red-600"
                      />
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- Description -->
          {#if description}
            <p class="text-sm text-dark-gray">{description}</p>
          {/if}
        </div>

        <!-- Organization/Block/School Info -->
        {#if organizationInfo || blockInfo || schoolInfo}
          <div class="flex items-center gap-4">
            {#if organizationInfo}
              <InfoRow 
                label={organizationInfo.label}
                value={organizationInfo.value}
              />
            {/if}
            {#if stateInfo}
              <InfoRow 
                label={stateInfo.label}
                value={stateInfo.value}
              />
            {/if}
            {#if blockInfo}
              <InfoRow 
                label={blockInfo.label}
                value={blockInfo.value}
              />
            {/if}
            {#if schoolInfo}
              <InfoRow 
                label={schoolInfo.label}
                value={schoolInfo.value}
              />
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right Container: Status and Last Updated -->
       {#if showActiveTag}
      <div class="flex flex-col items-end gap-2">
        <span
          class={`flex items-center gap-1.5 px-3 py-1 w-fit rounded-full text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {#if isActive}
            <CircleCheck class="w-4 h-4" />
          {:else}
            <CircleX class="w-4 h-4" />
          {/if}
          {isActive ? "Active" : "Inactive"}
        </span>
        <!-- Last Updated -->
        {#if lastUpdatedOn}
          <span class="text-xs text-dark-gray"
            >Last updated on: {lastUpdatedOn}</span
          >
        {/if}
      </div>
      {/if}
    </div>
  </div>

  <!-- Optional Content Slot -->
  <slot />
</div>
