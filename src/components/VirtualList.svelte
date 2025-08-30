<!-- src/components/VirtualList.svelte -->
<script>
  import { onMount } from 'svelte';
  import { throttle } from '../lib/utils.js';
  
  export let items = [];
  export let itemHeight = 50;
  export let viewportHeight = 400;
  export let bufferSize = 5;
  export let estimatedItemHeight = itemHeight;
  
  let scrollTop = 0;
  let viewport;
  let mounted = false;
  
  $: visibleStart = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - bufferSize);
  $: visibleEnd = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / estimatedItemHeight) + bufferSize);
  $: visibleItems = items.slice(visibleStart, visibleEnd);
  $: offsetY = visibleStart * estimatedItemHeight;
  $: totalHeight = items.length * estimatedItemHeight;
  
  // Throttled scroll handler for better performance
  const throttledHandleScroll = throttle(() => {
    if (viewport) {
      scrollTop = viewport.scrollTop;
    }
  }, 16); // ~60fps
  
  function handleScroll() {
    throttledHandleScroll();
  }
  
  // Scroll to specific item
  export function scrollToItem(index) {
    if (viewport && index >= 0 && index < items.length) {
      const targetScrollTop = index * estimatedItemHeight;
      viewport.scrollTop = targetScrollTop;
      scrollTop = targetScrollTop;
    }
  }
  
  // Get current scroll info
  export function getScrollInfo() {
    return {
      scrollTop,
      visibleStart,
      visibleEnd,
      totalItems: items.length
    };
  }
  
  onMount(() => {
    mounted = true;
    
    // Observer for dynamic height adjustment
    if (viewport) {
      const resizeObserver = new ResizeObserver(() => {
        // Recalculate visible items on resize
        handleScroll();
      });
      
      resizeObserver.observe(viewport);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  });
</script>

<div 
  class="viewport" 
  bind:this={viewport}
  on:scroll={handleScroll}
  style="height: {viewportHeight}px"
  role="grid"
  aria-label="Virtual scrollable list"
>
  <div class="spacer" style="height: {totalHeight}px">
    <div class="content" style="transform: translateY({offsetY}px)">
      {#each visibleItems as item, i (item.id || visibleStart + i)}
        <div 
          class="item" 
          style="height: {itemHeight}px"
          role="gridcell"
          aria-rowindex={visibleStart + i + 1}
        >
          <slot {item} index={visibleStart + i} />
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Loading indicator for dynamic content -->
  {#if !mounted}
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading items...</span>
    </div>
  {/if}
  
  <!-- Empty state -->
  {#if mounted && items.length === 0}
    <div class="empty-state">
      <slot name="empty">
        <p>No items to display</p>
      </slot>
    </div>
  {/if}
</div>

<style>
  .viewport {
    overflow-y: auto;
    position: relative;
    scrollbar-width: thin;
    scrollbar-color: #ccc transparent;
  }
  
  .viewport::-webkit-scrollbar {
    width: 8px;
  }
  
  .viewport::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .viewport::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  
  .viewport::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
  
  .spacer {
    position: relative;
  }
  
  .content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }
  
  .item {
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }
  
  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 10px;
    color: #666;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #999;
  }
  
  .empty-state p {
    margin: 0;
    font-style: italic;
  }
  
  /* Dark mode support */
  :global(html.dark) .item {
    border-bottom-color: #404040;
  }
  
  :global(html.dark) .viewport::-webkit-scrollbar-thumb {
    background: #666;
  }
  
  :global(html.dark) .viewport::-webkit-scrollbar-thumb:hover {
    background: #888;
  }
  
  :global(html.dark) .loading {
    color: #a0a0a0;
  }
  
  :global(html.dark) .empty-state {
    color: #666;
  }
  
  /* Smooth scrolling */
  .viewport {
    scroll-behavior: smooth;
  }
  
  /* Performance optimizations */
  .content {
    will-change: transform;
  }
  
  .item {
    contain: layout style paint;
  }
</style>