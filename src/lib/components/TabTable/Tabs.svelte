<script>
    import { setContext } from "svelte";
    import { writable } from "svelte/store";

    // hold the name and id of the tab
    export let active = '' ; 

    const activeTab = writable(active) ; 

    setContext('tabs', {
        active : activeTab,
        setActive: (name) =>{ activeTab.set(name) 
           
        }
    }) ; 
    $: activeTab.set(active) ; 
</script>



<div class = "w-full">
    <slot />
</div>