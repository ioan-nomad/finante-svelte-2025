<script>
  import { onMount } from 'svelte';
  import FinanceModule from './modules/finance/FinanceModule.svelte';
  import PantryModule from './modules/pantry/PantryModule.svelte';
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';

  let activeModule = 'finance';
  let theme = 'light';

  onMount(() => {
    theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

</script>

<div class='app'>
  <header>
    <h1>💰 N-OMAD Suite</h1>
    <div class='module-tabs'>
      <button class:active={activeModule === 'finance'} on:click={() => activeModule = 'finance'}>
        💰 Finance
      </button>
      <button class:active={activeModule === 'pantry'} on:click={() => activeModule = 'pantry'}>
        🛒 Pantry
      </button>
      <button class:active={activeModule === 'nutrition'} on:click={() => activeModule = 'nutrition'}>
        🍽️ Nutrition
      </button>
    </div>
    <button class='theme-toggle' on:click={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  </header>

  <main>
    {#if activeModule === 'finance'}
      <FinanceModule />
    {:else if activeModule === 'pantry'}
      <PantryModule />
    {:else if activeModule === 'nutrition'}
      <NutritionModule />
    {/if}
  </main>
</div>

<style>
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f3f4f6;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
    --accent-color: #3b82f6;
  }

  :global([data-theme='dark']) {
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --border-color: #374151;
    --accent-color: #60a5fa;
  }

  :global(body) {
    margin: 0;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    background: var(--bg-secondary);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }

  .module-tabs {
    display: flex;
    gap: 1rem;
  }

  .module-tabs button {
    padding: 0.5rem 1rem;
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .module-tabs button.active {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
  }

  .theme-toggle {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1.2rem;
  }


  main {
    flex: 1;
    padding: 2rem;
    background: var(--bg-primary);
  }
</style>