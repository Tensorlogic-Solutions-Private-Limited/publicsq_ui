<script>
  import { authStore } from "$lib/stores/authStore.js";
  
  export let card;
  export let selected = false;
  export let onClick = () => {};
  
  // Check if user has permission to see state information
  $: canViewStateInfo = $authStore?.roleCode && 
    ['super_admin', 'admin', 'admin_user'].includes($authStore.roleCode);
</script>

<div
  class="relative border-2 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md {selected ? `${card.selectedBorderColor} ${card.bgColor}` : `${card.borderColor} bg-white hover:${card.bgColor}`}"
  on:click={onClick}
>
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <div class="flex space-x-2 ">
        <span class="text-2xl">{card.icon}</span>
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900 capitalize tracking-wide ">
            Class {card.standard} {card.division ?card.division:''} , {card.subject}
          </div>
          <div class="text-xs text-gray-600 space-y-1">
            <div>({card.medium_name || "Unknown"} medium)</div>
            <div class="flex gap-x-4 gap-y-1 flex-wrap">
              <!-- <span class="font-medium">Div: {card.division || "Unknown"}</span> -->
              <span class="font-medium">Board: {card.board_name || "Unknown"}</span>
              {#if canViewStateInfo}
                <span class="font-medium">State: {card.state_name || "Unknown"}</span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ml-1 flex-shrink-0">
      {#if selected}
        <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      {:else}
        <div class="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
      {/if}
    </div>
  </div>
</div>
