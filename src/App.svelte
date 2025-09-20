<script>
  import { onMount } from 'svelte';
  import FinanceModule from './modules/finance/FinanceModule.svelte';
  import PantryModule from './modules/pantry/PantryModule.svelte';
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  import { populateDemoData } from './lib/demo-data.js';

  let activeModule = 'finance';
  let theme = 'light';

  onMount(() => {
    theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // Populate demo data on first load
    populateDemoData();
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
      {#if typeof NutritionModule !== 'undefined'}
        <NutritionModule />
      {:else}
        <div class="module-error">
          <h2>🍽️ Nutrition Module</h2>
          <p>Nutrition components will initialize when dependencies are available.</p>
        </div>
      {/if}
    {/if}
  </main>
</div>

<style>
  :global(:root) {
    /* Light theme colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --border-light: #f1f5f9;
    --accent-color: #3b82f6;
    --accent-hover: #2563eb;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    --info-color: #8b5cf6;

    /* Card and surface colors */
    --card-bg: #ffffff;
    --card-border: #e2e8f0;
    --card-shadow: rgba(0, 0, 0, 0.1);

    /* Input and form colors */
    --input-bg: #ffffff;
    --input-border: #d1d5db;
    --input-focus: #3b82f6;

    /* Chart and graph colors */
    --chart-grid: rgba(100, 116, 139, 0.1);
    --chart-text: #64748b;
  }

  :global([data-theme='dark']) {
    /* Dark theme colors */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --border-color: #475569;
    --border-light: #334155;
    --accent-color: #60a5fa;
    --accent-hover: #3b82f6;
    --success-color: #22d3ee;
    --warning-color: #fbbf24;
    --error-color: #f87171;
    --info-color: #a78bfa;

    /* Card and surface colors */
    --card-bg: #1e293b;
    --card-border: #475569;
    --card-shadow: rgba(0, 0, 0, 0.3);

    /* Input and form colors */
    --input-bg: #334155;
    --input-border: #475569;
    --input-focus: #60a5fa;

    /* Chart and graph colors */
    --chart-grid: rgba(203, 213, 225, 0.1);
    --chart-text: #cbd5e1;
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

  .module-error {
    text-align: center;
    padding: 3rem;
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--card-border);
    max-width: 600px;
    margin: 2rem auto;
  }

  .module-error h2 {
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .module-error p {
    color: var(--text-secondary);
    margin: 0;
  }
</style>