<!-- src/components/LazyComponent.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import { lazyLoadWithCache } from '../lib/lazyLoader.js';

  export let componentName;
  export let props = {};
  
  let component = null;
  let loading = true;
  let error = null;
  
  const dispatch = createEventDispatcher();

  onMount(async () => {
    try {
      loading = true;
      error = null;
      component = await lazyLoadWithCache(componentName);
      loading = false;
    } catch (err) {
      error = err.message;
      loading = false;
      console.error(`Failed to load ${componentName}:`, err);
    }
  });

  // Forward events from the lazy-loaded component
  function handleEvent(event) {
    dispatch(event.type, event.detail);
  }
</script>

{#if loading}
  <div class="lazy-loading">
    <div class="spinner"></div>
    <p>Loading {componentName}...</p>
  </div>
{:else if error}
  <div class="lazy-error">
    <h3>⚠️ Error Loading Component</h3>
    <p>Failed to load {componentName}: {error}</p>
    <button on:click={() => window.location.reload()}>Refresh Page</button>
  </div>
{:else if component}
  <svelte:component 
    this={component} 
    {...props} 
    on:import={handleEvent}
    on:close={handleEvent}
    on:productsAdded={handleEvent}
  />
{/if}

<style>
  .lazy-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .lazy-loading p {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .lazy-error {
    padding: 40px;
    text-align: center;
    background: #ffeaa7;
    border: 1px solid #fdcb6e;
    border-radius: 8px;
    margin: 20px;
  }

  .lazy-error h3 {
    color: #d63031;
    margin-top: 0;
  }

  .lazy-error p {
    color: #2d3436;
    margin: 15px 0;
  }

  .lazy-error button {
    background: #0984e3;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }

  .lazy-error button:hover {
    background: #74b9ff;
  }

  /* Dark mode support */
  :global(html.dark) .lazy-loading p {
    color: #a0a0a0;
  }

  :global(html.dark) .lazy-error {
    background: #2d2d2d;
    border-color: #404040;
  }

  :global(html.dark) .lazy-error h3 {
    color: #ff6b6b;
  }

  :global(html.dark) .lazy-error p {
    color: #e0e0e0;
  }
</style>