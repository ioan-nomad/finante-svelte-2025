<!-- src/App.svelte -->
<script>
  // Test de încărcare
  console.log('✅ App.svelte loaded successfully');
  window.addEventListener('error', (e) => {
    console.error('❌ Global error:', e.error);
  });

  import { onMount } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Finance components (currently in components dir, will be moved to modules later)
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Budgeturi from './components/Budgeturi.svelte';
  import Obiective from './components/Obiective.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import RecurringPayments from './components/RecurringPayments.svelte';
  import Export from './components/Export.svelte';
  
  // Pantry components (currently in components dir, will be moved to modules later)
  import ShoppingList from './components/ShoppingList.svelte';
  
  // Lazy loaded components
  import LazyComponent from './components/LazyComponent.svelte';
  
  // Toast notifications
  import Toast from './components/Toast.svelte';
  
  // System Testing Component
  import SystemTester from './components/SystemTester.svelte';
  
  // PDF Learning Testing Component
  import TestPDFLearning from './components/TestPDFLearning.svelte';
  
  // ML Engine Testing Component
  import TestML from './components/TestML.svelte';
  
  // Finance store
  import { accounts, transactions, totalBalance, calculateTotalBalance } from './modules/finance/stores/financeStore.js';
  
  // Config
  import { APP_CONFIG } from './shared/config.js';
  
  // Security imports - DISABLED for development
  import { secureStorage, InputSanitizer, TamperProtection } from './lib/security/disabled.js';
  import { CSPManager } from './lib/security/disabled.js';
  import { copyrightProtection } from './lib/security/disabled.js';
  
  // Nutrition Module
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';

  // REACTIVE STATE VARIABLES - FIX pentru tab navigation
  let activeModule = 'finance'; // Modulul activ actual
  let activeTab = 'dashboard'; // Tab-ul activ în cadrul modulului
  let previousTab = 'dashboard';
  let direction = 1;
  let showPDFImporter = false;
  let showReceiptParser = false;
  let isDarkMode = false; // REACTIVE pentru dark mode

  // Define main tabs for 2x5 grid (10 most important)
  const mainTabs = [
    // Top row - Core Finance
    { id: 'dashboard', label: 'Dashboard', icon: '📊', module: 'finance', row: 1 },
    { id: 'conturi', label: 'Conturi', icon: '🏦', module: 'finance', row: 1 },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸', module: 'finance', row: 1 },
    { id: 'budgeturi', label: 'Bugete', icon: '📈', module: 'finance', row: 1 },
    { id: 'obiective', label: 'Obiective', icon: '🎯', module: 'finance', row: 1 },
    
    // Bottom row - Extended Features
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅', module: 'finance', row: 2 },
    { id: 'recurring', label: 'Recurente', icon: '🔄', module: 'finance', row: 2 },
    { id: 'grocery', label: 'Pantry', icon: '🛒', module: 'pantry', row: 2 },
    { id: 'shopping', label: 'Shopping', icon: '📝', module: 'pantry', row: 2 },
    { id: 'nutrition', label: 'Nutriție', icon: '🍽️', module: 'nutrition', row: 2 }
  ];

  // Secondary tabs (accessible via dropdown or separate section)
  const secondaryTabs = [
    { id: 'recipes', label: 'Rețete', icon: '👨‍🍳', module: 'nutrition' },
    { id: 'meals', label: 'Meal Plan', icon: '📅', module: 'nutrition' },
    { id: 'import', label: 'Import', icon: '📥', module: 'shared' },
    { id: 'export', label: 'Export', icon: '📤', module: 'shared' },
    { id: 'rapoarte', label: 'Rapoarte', icon: '📑', module: 'finance' }
  ];

  // Filter main tabs based on active modules
  $: availableMainTabs = mainTabs.filter(tab => {
    if (tab.module === 'shared') return true;
    if (tab.module === 'finance') return APP_CONFIG.modules.finance;
    if (tab.module === 'pantry') return APP_CONFIG.modules.pantry;
    if (tab.module === 'nutrition') return APP_CONFIG.modules.nutrition;
    return false;
  });

  // Filter secondary tabs based on active modules
  $: availableSecondaryTabs = secondaryTabs.filter(tab => {
    if (tab.module === 'shared') return true;
    if (tab.module === 'finance') return APP_CONFIG.modules.finance;
    if (tab.module === 'pantry') return APP_CONFIG.modules.pantry;
    if (tab.module === 'nutrition') return APP_CONFIG.modules.nutrition;
    return false;
  });

  // Combined tabs for navigation logic
  $: allAvailableTabs = [...availableMainTabs, ...availableSecondaryTabs];

  // Tab switching with animation direction - FIX pentru navigation blocking
  function switchTab(newTab) {
    console.log(`🔄 Switching from ${activeTab} to ${newTab}`);
    
    const currentIndex = allAvailableTabs.findIndex(t => t.id === activeTab);
    const newIndex = allAvailableTabs.findIndex(t => t.id === newTab);
    direction = newIndex > currentIndex ? 1 : -1;
    
    // Găsește modulul pentru tab-ul nou
    const newTabData = allAvailableTabs.find(t => t.id === newTab);
    if (newTabData) {
      previousTab = activeTab;
      activeTab = newTab;
      activeModule = newTabData.module;
      console.log(`✅ Switched to module: ${activeModule}, tab: ${activeTab}`);
    } else {
      console.error(`❌ Tab not found: ${newTab}`);
    }
  }

  // Dark mode toggle with COMPLETE CSS class application
  function toggleDarkMode() {
    console.log(`🌓 Toggling dark mode: ${isDarkMode} -> ${!isDarkMode}`);
    isDarkMode = !isDarkMode;
    
    // Apply dark mode to ALL elements
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    // Use secure storage instead of plain localStorage
    try {
      secureStorage.secureSave('darkMode', { value: isDarkMode });
    } catch (e) {
      console.error('Failed to save dark mode preference:', e);
      // Fallback to localStorage for non-critical data
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
    
    console.log(`✅ Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
  }

  // Load dark mode preference on mount
  onMount(async () => {
    console.log('🚀 App initialization started');
    
    try {
      // Load dark mode preference
      let savedMode = false;
      try {
        const saved = await secureStorage.secureLoad('darkMode');
        savedMode = saved?.value || false;
      } catch (e) {
        // Fallback to localStorage
        savedMode = localStorage.getItem('darkMode') === 'true';
      }
      
      if (savedMode) {
        isDarkMode = true;
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
      
      console.log(`✅ Dark mode initialized: ${isDarkMode}`);
      
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
    }
    
    console.log('✅ App initialization completed');
  });
</script>

<svelte:head>
  <title>N-OMAD Suite - Finance & Nutrition AI v{APP_CONFIG.version}</title>
  <meta name="description" content="Advanced personal finance and nutrition management with AI" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- Main App Container -->
<div class="app-container" class:dark-mode={isDarkMode}>

  <!-- App Header -->
  <header class="app-header">
    <div class="header-content">
      <!-- Logo and Title -->
      <div class="header-left">
        <div class="app-logo">
          <span class="logo-icon">🏛️</span>
          <div class="logo-text">
            <h1>N-OMAD Suite</h1>
            <span class="version">v{APP_CONFIG.version}</span>
          </div>
        </div>
      </div>

      <!-- Account Summary -->
      <div class="header-center">
        <div class="balance-summary">
          <span class="balance-label">Total Balance:</span>
          <span class="balance-amount">
            {new Intl.NumberFormat('ro-RO', { 
              style: 'currency', 
              currency: 'RON' 
            }).format($totalBalance)}
          </span>
        </div>
        
        <!-- Quick Status -->
        {#each $accounts.slice(0, 3) as account}
          <span class="account-quick" class:low-balance={account.balance < 1000}>
            {account.name}: {new Intl.NumberFormat('ro-RO', { 
              style: 'currency', 
              currency: 'RON',
              minimumFractionDigits: 0
            }).format(account.balance)}
          </span>
        {/each}
      </div>
    </div>
  </header>

  <!-- Fixed Header Controls - RIGHT POSITIONED -->
  <div class="header-right">
    <!-- Dark Mode Toggle -->
    <button 
      class="dark-mode-toggle" 
      on:click={toggleDarkMode}
      aria-label="Toggle dark mode"
      title={isDarkMode ? 'Comută la modul light' : 'Comută la modul dark'}
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
    
    <!-- System Testing Components - VERTICAL Layout -->
    <div class="system-test-controls">
      <SystemTester />
      <TestPDFLearning />
      <TestML />
    </div>
  </div>

  <!-- Main Navigation Grid 2x5 -->
  <nav class="main-navigation">
    {#each availableMainTabs as tab}
      <button 
        class="tab-button {activeTab === tab.id ? 'active' : ''}"
        on:click={() => switchTab(tab.id)}
        type="button"
        data-row={tab.row}
        data-module={tab.module}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <!-- Secondary Navigation (Show if needed) -->
  {#if availableSecondaryTabs.length > 0}
    <div class="secondary-navigation">
      <div class="secondary-label">Acțiuni avansate:</div>
      {#each availableSecondaryTabs as tab}
        <button 
          class="secondary-tab {activeTab === tab.id ? 'active' : ''}"
          on:click={() => switchTab(tab.id)}
          type="button"
        >
          <span class="secondary-icon">{tab.icon}</span>
          <span class="secondary-text">{tab.label}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Main Content Area -->
  <main class="main-content" class:dark-mode={isDarkMode}>
    <!-- Finance Module Content -->
    {#if activeModule === 'finance'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        {#if activeTab === 'dashboard'}
          <div class="dashboard-content">
            <h2>📊 Dashboard Financiar</h2>
            <LazyComponent>
              <div class="dashboard-cards">
                <!-- Summary Cards -->
                <div class="summary-card">
                  <h3>🏦 Conturi Active</h3>
                  <span class="summary-number">{$accounts.length}</span>
                </div>
                <div class="summary-card">
                  <h3>💸 Tranzacții Luna</h3>
                  <span class="summary-number">{$transactions.filter(t => 
                    new Date(t.date).getMonth() === new Date().getMonth()
                  ).length}</span>
                </div>
                <div class="summary-card">
                  <h3>💰 Sold Total</h3>
                  <span class="summary-number">{new Intl.NumberFormat('ro-RO', { 
                    style: 'currency', 
                    currency: 'RON',
                    maximumFractionDigits: 0 
                  }).format($totalBalance)}</span>
                </div>
              </div>
            </LazyComponent>
          </div>
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

    <!-- Pantry Module Content -->
    {#if activeModule === 'pantry'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        {#if activeTab === 'grocery'}
          <div class="pantry-content">
            <h2>🛒 Pantry Management</h2>
            <p>Ingredient inventory and expiration tracking coming soon...</p>
          </div>
        {:else if activeTab === 'shopping'}
          <ShoppingList />
        {/if}
      </div>
    {/if}

    <!-- Nutrition Module Content -->
    {#if activeModule === 'nutrition'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        <NutritionModule />
      </div>
    {/if}

    <!-- Shared Module Content -->
    {#if activeModule === 'shared'}
      <div class="content-panel" in:fade={{ duration: 300, easing: quintOut }}>
        {#if activeTab === 'import'}
          <div class="import-content">
            <h2>📥 Import Date</h2>
            <p>Import functionality coming soon...</p>
          </div>
        {:else if activeTab === 'export'}
          <Export />
        {/if}
      </div>
    {/if}
  </main>
</div>

<!-- Toast Notifications -->
<Toast />

<style>
  /* GLOBAL VARIABLES - Enhanced for dark mode */
  :global(:root) {
    /* Light mode colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --text-primary: #1e293b;
    --text-secondary: #475569;
    --text-tertiary: #64748b;
    --border-color: #e2e8f0;
    --border-light: #f1f5f9;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

    /* Brand colors */
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;
    --color-accent: #06d6a0;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-success: #10b981;

    /* Gradients */
    --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    --gradient-accent: linear-gradient(135deg, var(--color-accent), var(--color-primary));
    
    /* Typography */
    --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    
    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-bounce: 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  /* DARK MODE VARIABLES */
  :global([data-theme="dark"]) {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --border-color: #475569;
    --border-light: #334155;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.6);
  }

  /* GLOBAL DARK MODE STYLES */
  :global(body.dark-mode) {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  :global(.dark-mode .card) {
    background: var(--bg-secondary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  :global(.dark-mode .tab-button) {
    background: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
  }

  :global(.dark-mode .tab-button.active) {
    background: var(--color-primary) !important;
    color: white !important;
  }

  :global(.dark-mode input) {
    background: var(--bg-tertiary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  :global(.dark-mode select) {
    background: var(--bg-tertiary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  :global(.dark-mode textarea) {
    background: var(--bg-tertiary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  :global(.dark-mode button) {
    background: var(--bg-secondary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  /* APP CONTAINER */
  .app-container {
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: var(--font-primary);
    transition: all var(--transition);
  }

  /* APP HEADER - Fixed positioning */
  .app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    z-index: 900;
    backdrop-filter: blur(10px);
  }

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .app-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 32px;
    animation: float 4s ease-in-out infinite;
  }

  .logo-text h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
  }

  .version {
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 24px;
    flex: 1;
    justify-content: center;
    max-width: 600px;
  }

  .balance-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .balance-label {
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .balance-amount {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-success);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.025em;
    color: white;
  }

  /* HEADER RIGHT CONTROLS - FIXED Layout */
  .header-right {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-end;
    pointer-events: none;
  }

  /* Dark Mode Toggle */
  .dark-mode-toggle {
    background: var(--gradient-primary);
    border: 2px solid var(--border-color);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-bounce);
    pointer-events: all;
    z-index: 1001;
  }

  .dark-mode-toggle:hover {
    transform: scale(1.05) rotate(180deg);
    box-shadow: var(--shadow-2xl);
  }

  /* System Test Controls - VERTICAL Layout */
  .system-test-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    pointer-events: all;
    z-index: 999;
  }

  /* System Test Buttons Styling */
  .system-test-controls :global(button) {
    padding: 6px 12px !important;
    font-size: 11px !important;
    min-height: 28px !important;
    max-width: 140px !important;
    white-space: nowrap !important;
    border-radius: 14px !important;
    margin: 0 !important;
    box-shadow: var(--shadow) !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
  }

  .system-test-controls :global(button:hover) {
    transform: translateY(-1px) !important;
    box-shadow: var(--shadow-lg) !important;
  }

  /* MAIN NAVIGATION */
  .main-navigation {
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 16px;
    padding: 24px;
    background: var(--bg-secondary);
    border-radius: 24px;
    box-shadow: var(--shadow-lg);
    z-index: 800;
    border: 1px solid var(--border-color);
    max-width: 800px;
    width: calc(100vw - 48px);
  }

  .tab-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px 16px;
    background: var(--bg-primary);
    border: 2px solid var(--border-light);
    border-radius: 16px;
    cursor: pointer;
    transition: all var(--transition-bounce);
    color: var(--text-primary);
    font-family: var(--font-primary);
    min-height: 100px;
    position: relative;
    overflow: hidden;
  }

  .tab-button:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }

  .tab-button.active {
    background: var(--gradient-primary);
    border-color: var(--color-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .tab-icon {
    font-size: 28px;
    display: block;
    line-height: 1;
  }

  .tab-label {
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.025em;
  }

  /* MAIN CONTENT */
  .main-content {
    padding-top: 350px;
    padding-bottom: 40px;
    padding-left: 24px;
    padding-right: 24px;
    min-height: 100vh;
    background: var(--bg-primary);
  }

  .content-panel {
    max-width: 1200px;
    margin: 0 auto;
    background: var(--bg-secondary);
    border-radius: 24px;
    padding: 32px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
  }

  /* DASHBOARD CONTENT */
  .dashboard-content h2 {
    margin: 0 0 32px 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .dashboard-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }

  .summary-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    transition: all var(--transition);
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
  }

  .summary-card h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-number {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  /* ANIMATIONS */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes fadeInUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes fadeInScale {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  /* RESPONSIVE DESIGN */
  @media (max-width: 640px) {
    .main-navigation {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 12px;
      padding: 16px;
      top: 90px;
    }
    
    .tab-button {
      min-height: 80px;
      padding: 12px 8px;
    }
    
    .tab-icon {
      font-size: 20px;
    }
    
    .tab-label {
      font-size: 11px;
    }
    
    .header-right {
      position: relative;
      top: auto;
      right: auto;
      flex-direction: row;
      gap: 8px;
      justify-content: flex-end;
      padding: 12px;
    }
    
    .system-test-controls {
      flex-direction: row;
      gap: 4px;
    }
  }

  /* ML ENGINE CARD - Positioned at bottom right */
  :global(.ml-test-card) {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 100 !important;
    max-width: 300px !important;
    max-height: 200px !important;
    overflow: hidden !important;
    border-radius: 12px !important;
    box-shadow: var(--shadow-lg) !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
  }

  /* SECONDARY NAVIGATION */
  .secondary-navigation {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: var(--bg-secondary);
    border-radius: 50px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    z-index: 700;
  }

  .secondary-label {
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 600;
    margin-right: 8px;
  }

  .secondary-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: 20px;
    cursor: pointer;
    transition: all var(--transition);
    font-size: 12px;
    color: var(--text-primary);
  }

  .secondary-tab:hover {
    background: var(--color-primary);
    color: white;
    transform: translateY(-1px);
  }

  .secondary-tab.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  /* ===============================================
     DARK MODE ENHANCED FIXES
     =============================================== */
  
  /* Global Dark Mode Body */
  :global(body.dark-mode) {
    background: #1a1a1a !important;
    color: #e0e0e0 !important;
  }

  /* Dark Mode Tab Buttons */
  :global(.dark-mode .tab-button) {
    background: #2a2a2a !important;
    color: #e0e0e0 !important;
    border-color: #404040 !important;
  }

  :global(.dark-mode .tab-button:hover) {
    background: #363636 !important;
    border-color: #505050 !important;
  }

  :global(.dark-mode .tab-button.active) {
    background: var(--color-primary) !important;
    color: white !important;
  }

  /* Dark Mode Cards */
  :global(.dark-mode .card) {
    background: #252525 !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;
  }

  /* Dark Mode Form Controls */
  :global(.dark-mode input) {
    background: #2a2a2a !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;
  }

  :global(.dark-mode select) {
    background: #2a2a2a !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;
  }

  :global(.dark-mode textarea) {
    background: #2a2a2a !important;
    border-color: #404040 !important;
    color: #e0e0e0 !important;
  }

  /* Dark Mode Buttons */
  :global(.dark-mode .btn) {
    background: #363636 !important;
    border-color: #505050 !important;
    color: #e0e0e0 !important;
  }

  :global(.dark-mode .btn:hover) {
    background: #404040 !important;
  }

  /* ===============================================
     LAYOUT ENHANCED FIXES  
     =============================================== */

  /* Enhanced Header Right - Vertical Layout */
  .header-right {
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    z-index: 1000 !important;
    align-items: flex-end !important;
  }

  /* System Test Controls - Vertical Stack */
  .system-test-controls {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    align-items: stretch !important;
  }

  .system-test-controls .btn {
    width: 160px !important;
    min-height: 36px !important;
    font-size: 11px !important;
    padding: 6px 8px !important;
    white-space: nowrap !important;
    text-align: center !important;
  }

  /* Enhanced ML Test Card - Bottom Right */
  :global(.ml-test-card) {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    max-width: 320px !important;
    max-height: 240px !important;
    z-index: 100 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    overflow: hidden !important;
  }

  /* Dark Mode ML Card */
  :global(.dark-mode .ml-test-card) {
    background: #252525 !important;
    border-color: #404040 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
  }

  /* ===============================================
     RESPONSIVE ENHANCEMENTS
     =============================================== */

  @media (max-width: 768px) {
    .header-right {
      position: relative !important;
      top: auto !important;
      right: auto !important;
      flex-direction: row !important;
      gap: 8px !important;
      justify-content: flex-end !important;
      padding: 12px !important;
      z-index: 900 !important;
    }

    .system-test-controls {
      flex-direction: row !important;
      gap: 4px !important;
    }

    .system-test-controls .btn {
      width: auto !important;
      min-width: 100px !important;
      font-size: 10px !important;
      padding: 4px 6px !important;
    }

    :global(.ml-test-card) {
      position: relative !important;
      bottom: auto !important;
      right: auto !important;
      max-width: 100% !important;
      max-height: 150px !important;
      margin: 10px !important;
    }
  }
</style>