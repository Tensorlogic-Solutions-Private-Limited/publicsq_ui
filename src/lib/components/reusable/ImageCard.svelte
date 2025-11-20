<script>
  export let images = [];
  export let class_ = "";
  export let imgClass = "";
  export let minHeight = "min-h-[120px]";
  export let emptyText = "No images";
  export let imgAlt = "Image";
  export let link = true;
</script>

<div class={`bg-white rounded-xl border border-dashed border-slate-300 p-3 ${minHeight} flex flex-col justify-center ${class_}`}>
  {#if images && images.length}
    <div class="flex flex-wrap gap-2">
      {#each images as img, i (img + '-' + i)}
        {#if link}
          <a href={img} target="_blank" rel="noopener noreferrer">
            <img
              src={img}
              alt={imgAlt}
              class={`object-contain rounded-lg border border-slate-200 bg-white cursor-pointer ${imgClass ? imgClass : "w-28 h-28"}`}
            />
          </a>
        {:else}
          <img
            src={img}
            alt={imgAlt}
            class={`object-contain rounded-lg border border-slate-200 bg-white ${imgClass ? imgClass : "w-28 h-28"}`}
          />
        {/if}
      {/each}
    </div>
  {:else}
    <div class="flex flex-1 items-center justify-center min-h-[56px]">
      <span class="text-xs text-gray-400 italic">{emptyText}</span>
    </div>
  {/if}
</div>
