<!-- src/App.svelte - VERSIUNEA CORECTĂ FINALĂ -->
<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Core Components
  import Dashboard from './components/Dashboard.svelte';
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Budgeturi from './components/Budgeturi.svelte';
  import Obiective from './components/Obiective.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import RecurringPayments from './components/RecurringPayments.svelte';
  import Export from './components/Export.svelte';
  
  // PDF Import - IMPORTANT!
  import PDFImporter from './components/PDFImporter.svelte';
  
  // Pantry & Nutrition
  import ShoppingList from './components/ShoppingList.svelte';
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  
  // Notifications
  import Toast from './components/Toast.svelte';
  
  // Stores
  import { accounts, transactions, totalBalance, calculateTotalBalance } from './modules/finance/stores/financeStore.js';
  import { APP_CONFIG } from './shared/config.js';
  
  // State
  let activeTab = 'dashboard';
  let showPDFImporter = false;
  let isDarkMode = false;
  let showMobileMenu = false;
  let devMode = false; // Pentru test components
  
  // Navigation tabs
  const navigationTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', module: 'finance' },
    { id: 'conturi', label: 'Conturi', icon: '🏦', module: 'finance' },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸', module: 'finance' },
    { id: 'budgeturi', label: 'Bugete', icon: '📈', module: 'finance' },
    { id: 'obiective', label: 'Obiective', icon: '🎯', module: 'finance' },
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅', module: 'finance' },
    { id: 'recurring', label: 'Recurente', icon: '🔄', module: 'finance' },
    { id: 'pantry', label: 'Pantry', icon: '🛒', module: 'pantry' },
    { id: 'nutrition', label: 'Nutriție', icon: '🍽️', module: 'nutrition' },
    { id: 'export', label: 'Export', icon: '📤', module: 'shared' }
  ];
  
  $: availableTabs = navigationTabs.filter(tab => {
    if (tab.module === 'shared') return true;
    return APP_CONFIG.modules[tab.module];
  });
  
  // Dark mode toggle
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
  }
  
  // PDF Import handler
  function handlePDFImport(event) {
    const importedTransactions = event.detail;
    console.log('📥 Importing', importedTransactions.length, 'transactions');
    
    importedTransactions.forEach(tx => {
      transactions.update(t => [...t, tx]);
    });
    
    showPDFImporter = false;
    
    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        message: `✅ ${importedTransactions.length} tranzacții importate!`,
        type: 'success'
      }
    }));
  }
  
  onMount(() => {
    isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) document.body.classList.add('dark-mode');
    calculateTotalBalance();
    
    // Dev mode from URL param
    const params = new URLSearchParams(window.location.search);
    devMode = params.get('dev') === 'true';
  });
</script>

<div class="app-container" class:dark-mode={isDarkMode}>
  <!-- Professional Header -->
  <header class="app-header">
    <div class="header-content">
      <!-- Logo -->
      <div class="logo-section">
        <span class="logo-icon">💰</span>
        <h1 class="app-title">N-OMAD Suite</h1>
        <span class="version">v0.2.2</span>
      </div>
      
      <!-- Desktop Navigation -->
      <nav class="desktop-nav">
        {#each availableTabs as tab}
          <button 
            class="nav-btn {activeTab === tab.id ? 'active' : ''}"
            on:click={() => activeTab = tab.id}
          >
            <span>{tab.icon}</span>
            <span class="nav-label">{tab.label}</span>
          </button>
        {/each}
      </nav>
      
      <!-- Header Actions -->
      <div class="header-actions">
        <button 
          class="action-btn import-btn"
          on:click={() => showPDFImporter = true}
        >
          📄 Import PDF
        </button>
        
        <button 
          class="action-btn dark-toggle"
          on:click={toggleDarkMode}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        <!-- Mobile menu -->
        <button 
          class="mobile-menu-btn"
          on:click={() => showMobileMenu = !showMobileMenu}
        >
          ☰
        </button>
      </div>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="main-content">
    {#if activeTab === 'dashboard'}
      <Dashboard />
    {:else if activeTab === 'conturi'}
      <Conturi />
    {:else if activeTab === 'tranzactii'}
      <Tranzactii />
    {:else if activeTab === 'budgeturi'}
      <Budgeturi />
    {:else if activeTab === 'obiective'}
      <Obiective />
    {:else if activeTab === 'reconciliere'}
      <Reconciliere />
    {:else if activeTab === 'recurring'}
      <RecurringPayments />
    {:else if activeTab === 'pantry'}
      <ShoppingList />
    {:else if activeTab === 'nutrition'}
      <NutritionModule />
    {:else if activeTab === 'export'}
      <Export />
    {/if}
  </main>
  
  <!-- PDF Importer Modal -->
  {#if showPDFImporter}
    <PDFImporter 
      on:import={handlePDFImport}
      on:close={() => showPDFImporter = false}
    />
  {/if}
  
  <!-- Dev Tools (only in dev mode) -->
  {#if devMode}
    <div class="dev-tools">
      <button on:click={() => window.location.href = '?dev=false'}>
        Hide Dev Tools
      </button>
    </div>
  {/if}
  
  <Toast />
</div>

<style>
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --border-color: #dee2e6;
    --color-primary: #0d6efd;
    --color-success: #198754;
  }
  
  :global(.dark-mode) {
    --bg-primary: #1a1d23;
    --bg-secondary: #22262e;
    --text-primary: #e9ecef;
    --text-secondary: #adb5bd;
    --border-color: #495057;
  }
  
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  /* Header */
  .app-header {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }
  
  .app-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  .version {
    background: var(--color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
  }
  
  /* Navigation */
  .desktop-nav {
    display: flex;
    gap: 0.5rem;
  }
  
  .nav-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
  }
  
  .nav-btn.active {
    background: var(--color-primary);
    color: white;
  }
  
  .nav-label {
    display: none;
  }
  
  @media (min-width: 1024px) {
    .nav-label {
      display: inline;
    }
  }
  
  /* Actions */
  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .import-btn {
    background: var(--color-success);
    color: white;
    border: none;
  }
  
  .import-btn:hover {
    background: #157347;
    transform: translateY(-1px);
  }
  
  .dark-toggle {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    font-size: 1.25rem;
    border-radius: 50%;
  }
  
  .mobile-menu-btn {
    display: none;
    background: transparent;
    border: 1px solid var(--border-color);
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 1.25rem;
    cursor: pointer;
  }
  
  @media (max-width: 768px) {
    .desktop-nav {
      display: none;
    }
    .mobile-menu-btn {
      display: block;
    }
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
  
  /* Dev Tools */
  .dev-tools {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    padding: 0.5rem;
    background: rgba(0,0,0,0.8);
    border-radius: 0.5rem;
  }
  
  .dev-tools button {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
</style>