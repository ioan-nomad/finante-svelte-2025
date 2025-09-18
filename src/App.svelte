<script>
  import { onMount } from 'svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Budgete from './components/Budgete.svelte';
  import Obiective from './components/Obiective.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import RecurringPayments from './components/RecurringPayments.svelte';
  import PDFImporter from './components/PDFImporter.svelte';
  import EditModal from './components/EditModal.svelte';
  import RapoarteAvansate from './components/RapoarteAvansate.svelte';
  import GroceryDashboard from './components/GroceryDashboard.svelte';
  import ReceiptParser from './components/ReceiptParser.svelte';

  let activeModule = 'finance';
  let activeTab = 'dashboard';
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

  const financeTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'conturi', label: 'Conturi', icon: '💳' },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸' },
    { id: 'budgete', label: 'Bugete', icon: '🎯' },
    { id: 'obiective', label: 'Obiective', icon: '🏆' },
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅' },
    { id: 'recurring', label: 'Plăți Recurente', icon: '🔄' },
    { id: 'rapoarte', label: 'Rapoarte', icon: '📈' },
    { id: 'import', label: 'Import PDF', icon: '📥' }
  ];
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

  {#if activeModule === 'finance'}
    <nav class='tabs'>
      {#each financeTabs as tab}
        <button
          class:active={activeTab === tab.id}
          on:click={() => activeTab = tab.id}
        >
          {tab.icon} {tab.label}
        </button>
      {/each}
    </nav>

    <main>
      {#if activeTab === 'dashboard'}
        <Dashboard />
      {:else if activeTab === 'conturi'}
        <Conturi />
      {:else if activeTab === 'tranzactii'}
        <Tranzactii />
      {:else if activeTab === 'budgete'}
        <Budgete />
      {:else if activeTab === 'obiective'}
        <Obiective />
      {:else if activeTab === 'reconciliere'}
        <Reconciliere />
      {:else if activeTab === 'recurring'}
        <RecurringPayments />
      {:else if activeTab === 'rapoarte'}
        <RapoarteAvansate />
      {:else if activeTab === 'import'}
        <PDFImporter />
      {/if}
    </main>
  {:else if activeModule === 'pantry'}
    <main>
      <GroceryDashboard />
    </main>
  {:else if activeModule === 'nutrition'}
    <main>
      <ReceiptParser />
    </main>
  {/if}
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

  nav.tabs {
    background: var(--bg-secondary);
    padding: 0 2rem;
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    border-bottom: 1px solid var(--border-color);
  }

  nav.tabs button {
    padding: 1rem;
    background: transparent;
    color: var(--text-secondary);
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  nav.tabs button.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
  }

  main {
    flex: 1;
    padding: 2rem;
    background: var(--bg-primary);
  }
</style>