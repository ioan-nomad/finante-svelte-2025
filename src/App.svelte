<!-- src/App.svelte - VERSIUNEA COMPLETĂ REPARATĂ -->
<script>
  console.log('✅ App.svelte loaded successfully');
  
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Core components
  import Dashboard from './components/Dashboard.svelte';
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Budgeturi from './components/Budgeturi.svelte';
  import Obiective from './components/Obiective.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import RecurringPayments from './components/RecurringPayments.svelte';
  import Export from './components/Export.svelte';
  import ShoppingList from './components/ShoppingList.svelte';
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  import Toast from './components/Toast.svelte';
  
  // Test components
  import SystemTester from './components/SystemTester.svelte';
  import TestPDFLearning from './components/TestPDFLearning.svelte';
  import TestML from './components/TestML.svelte';
  
  // Stores and config
  import { accounts, totalBalance } from './modules/finance/stores/financeStore.js';
  import { APP_CONFIG } from './shared/config.js';
  import { secureStorage } from './lib/security/crypto.js';

  // State variables
  let activeModule = 'finance';
  let activeTab = 'dashboard';
  let isDarkMode = false;

  // Main navigation tabs (2x5 grid)
  const mainTabs = [
    // Top row
    { id: 'dashboard', label: 'Dashboard', icon: '📊', module: 'finance', row: 1 },
    { id: 'conturi', label: 'Conturi', icon: '🏦', module: 'finance', row: 1 },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸', module: 'finance', row: 1 },
    { id: 'budgeturi', label: 'Bugete', icon: '📈', module: 'finance', row: 1 },
    { id: 'obiective', label: 'Obiective', icon: '🎯', module: 'finance', row: 1 },
    
    // Bottom row
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅', module: 'finance', row: 2 },
    { id: 'recurring', label: 'Recurente', icon: '🔄', module: 'finance', row: 2 },
    { id: 'grocery', label: 'Pantry', icon: '🛒', module: 'pantry', row: 2 },
    { id: 'shopping', label: 'Shopping', icon: '📝', module: 'pantry', row: 2 },
    { id: 'nutrition', label: 'Nutriție', icon: '🍽️', module: 'nutrition', row: 2 }
  ];

  // Filter tabs based on enabled modules
  $: availableTabs = mainTabs.filter(tab => {
    if (tab.module === 'finance') return APP_CONFIG.modules.finance;
    if (tab.module === 'pantry') return APP_CONFIG.modules.pantry;
    if (tab.module === 'nutrition') return APP_CONFIG.modules.nutrition;
    return true;
  });

  // Tab switching
  function switchTab(newTab) {
    console.log(`🔄 Switching to ${newTab}`);
    const tabData = availableTabs.find(t => t.id === newTab);
    if (tabData) {
      activeTab = newTab;
      activeModule = tabData.module;
    }
  }

  // Dark mode toggle
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
    
    try {
      secureStorage.secureSave('darkMode', { value: isDarkMode });
    } catch (e) {
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }

  // Load preferences on mount
  onMount(async () => {
    console.log('🚀 App initialization');
    
    try {
      const saved = await secureStorage.secureLoad('darkMode');
      isDarkMode = saved?.value || false;
    } catch (e) {
      isDarkMode = localStorage.getItem('darkMode') === 'true';
    }
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }
    
    console.log('✅ App initialized');
  });
</script>

<svelte:head>
  <title>N-OMAD Suite v{APP_CONFIG.version}</title>
</svelte:head>

<div class="app-container" class:dark-mode={isDarkMode}>
  <!-- Header -->
  <header class="app-header">
    <div class="header-content">
      <div class="app-logo">
        <span class="logo-icon">🏛️</span>
        <div class="logo-text">
          <h1>N-OMAD Suite</h1>
          <span class="version">v{APP_CONFIG.version}</span>
        </div>
      </div>
      
      <div class="balance-summary">
        <span class="balance-label">Total Balance</span>
        <span class="balance-amount">
          {new Intl.NumberFormat('ro-RO', { 
            style: 'currency', 
            currency: 'RON' 
          }).format($totalBalance)}
        </span>
      </div>
    </div>
  </header>

  <!-- Controls -->
  <div class="header-controls">
    <button class="dark-mode-toggle" on:click={toggleDarkMode}>
      {isDarkMode ? '☀️' : '🌙'}
    </button>
    
    <div class="test-controls">
      <SystemTester />
      <TestPDFLearning />
      <TestML />
    </div>
  </div>

  <!-- Navigation -->
  <nav class="main-navigation">
    {#each availableTabs as tab}
      <button 
        class="nav-tab {activeTab === tab.id ? 'active' : ''}"
        on:click={() => switchTab(tab.id)}
        data-row={tab.row}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Main Content -->
  <main class="main-content">
    {#if activeModule === 'finance'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
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
        {:else if activeTab === 'export'}
          <Export />
        {/if}
      </div>
    {/if}

    {#if activeModule === 'pantry'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        {#if activeTab === 'grocery'}
          <div class="pantry-content">
            <h2>🛒 Pantry Management</h2>
            <p>Ingredient inventory coming soon...</p>
          </div>
        {:else if activeTab === 'shopping'}
          <ShoppingList />
        {/if}
      </div>
    {/if}

    {#if activeModule === 'nutrition'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        <NutritionModule />
      </div>
    {/if}
  </main>
</div>

<Toast />

<style>
  /* CSS Variables */
  :global(:root) {
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --color-primary: #3b82f6;
    --color-success: #10b981;
    --gradient-primary: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  }

  :global(.dark-mode) {
    --bg-primary: #0f1220 !important;
    --bg-secondary: #1a1b2e !important;
    --text-primary: #e0e0e0 !important;
    --text-secondary: #a0a0a0 !important;
    --border-color: #2a2b3e !important;
  }

  :global(body.dark-mode) {
    background: var(--bg-primary) !important;
    color: var(--text-primary) !important;
  }

  /* App Container */
  .app-container {
    min-height: 100vh;
    padding-top: 80px;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all 0.3s ease;
  }

  /* Header */
  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    padding: 0 24px;
  }

  .app-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 28px;
  }

  .logo-text h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .version {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .balance-summary {
    text-align: center;
  }

  .balance-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .balance-amount {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-success);
  }

  /* Controls */
  .header-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1100;
  }

  .dark-mode-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gradient-primary);
    border: none;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: transform 0.2s;
  }

  .dark-mode-toggle:hover {
    transform: scale(1.1);
  }

  .test-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Navigation */
  .main-navigation {
    position: fixed;
    top: 90px;
    left: 50%;
    transform: translateX(-50%);
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    padding: 20px;
    background: var(--bg-secondary);
    border-radius: 20px;
    box-shadow: var(--shadow-lg);
    z-index: 900;
    border: 1px solid var(--border-color);
    max-width: 800px;
  }

  .nav-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 80px;
  }

  .nav-tab:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .nav-tab.active {
    background: var(--gradient-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .tab-icon {
    font-size: 24px;
  }

  .tab-label {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }

  /* Content */
  .main-content {
    padding-top: 280px;
    padding-bottom: 40px;
    padding-left: 24px;
    padding-right: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .content-panel {
    background: var(--bg-secondary);
    border-radius: 20px;
    padding: 32px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
  }

  .pantry-content h2 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }

  /* Dark Mode Overrides */
  :global(.dark-mode .nav-tab) {
    background: #2a2a2a !important;
    color: #e0e0e0 !important;
    border-color: #404040 !important;
  }

  :global(.dark-mode .nav-tab.active) {
    background: var(--color-primary) !important;
    color: white !important;
  }

  :global(.dark-mode .content-panel) {
    background: #252525 !important;
    border-color: #404040 !important;
  }

  /* Test Controls Styling */
  :global(.test-controls button) {
    padding: 6px 10px !important;
    font-size: 11px !important;
    min-height: 28px !important;
    border-radius: 12px !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
    box-shadow: var(--shadow) !important;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .main-navigation {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 8px;
      padding: 16px;
    }

    .nav-tab {
      min-height: 60px;
      padding: 12px 8px;
    }

    .tab-icon {
      font-size: 18px;
    }

    .tab-label {
      font-size: 10px;
    }

    .header-controls {
      position: relative;
      top: auto;
      right: auto;
      flex-direction: row;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px;
    }

    .test-controls {
      flex-direction: row;
      gap: 4px;
    }
  }
</style>