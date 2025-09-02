<!-- src/App.svelte -->
<script>
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
  
  // Finance store
  import { accounts, transactions, calculateTotalBalance } from './modules/finance/stores/financeStore.js';
  
  // Config
  import { APP_CONFIG } from './shared/config.js';
  
  // Security imports
  import { secureStorage, InputSanitizer, TamperProtection } from './lib/security/crypto.js';
  import { CSPManager } from './lib/security/csp.js';
  
  // Nutrition Module
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  
  let activeTab = 'dashboard';
  let previousTab = 'dashboard';
  let direction = 1;
  let showPDFImporter = false;
  let showReceiptParser = false;
  let isDarkMode = false;

  // Define all tabs with module awareness
  const allTabs = [
    // Finance tabs
    { id: 'dashboard', label: 'Dashboard', icon: '📊', module: 'finance' },
    { id: 'conturi', label: 'Conturi', icon: '🏦', module: 'finance' },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸', module: 'finance' },
    { id: 'budgeturi', label: 'Bugete', icon: '📈', module: 'finance' },
    { id: 'obiective', label: 'Obiective', icon: '🎯', module: 'finance' },
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅', module: 'finance' },
    { id: 'recurring', label: 'Recurente', icon: '🔄', module: 'finance' },
    
    // Pantry tabs
    { id: 'grocery', label: 'Pantry', icon: '🛒', module: 'pantry' },
    { id: 'shopping', label: 'Shopping', icon: '📝', module: 'pantry' },
    
    // Nutrition tabs
    { id: 'nutrition', label: 'Nutriție', icon: '🍽️', module: 'nutrition' },
    { id: 'recipes', label: 'Rețete', icon: '👨‍🍳', module: 'nutrition' },
    { id: 'meals', label: 'Meal Plan', icon: '📅', module: 'nutrition' },
    
    // Shared tabs
    { id: 'import', label: 'Import', icon: '📥', module: 'shared' },
    { id: 'export', label: 'Export', icon: '📤', module: 'shared' },
    { id: 'rapoarte', label: 'Rapoarte', icon: '📑', module: 'finance' }
  ];

  // Filter tabs based on active modules
  $: availableTabs = allTabs.filter(tab => {
    if (tab.module === 'shared') return true;
    if (tab.module === 'finance') return APP_CONFIG.modules.finance;
    if (tab.module === 'pantry') return APP_CONFIG.modules.pantry;
    if (tab.module === 'nutrition') return APP_CONFIG.modules.nutrition;
    return false;
  });

  // Tab switching with animation direction
  function switchTab(newTab) {
    const currentIndex = availableTabs.findIndex(t => t.id === activeTab);
    const newIndex = availableTabs.findIndex(t => t.id === newTab);
    direction = newIndex > currentIndex ? 1 : -1;
    previousTab = activeTab;
    activeTab = newTab;
  }

  // Dark mode toggle
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode.toString());
  }

  // Show notification helper
  function showNotification(message, type = 'success') {
    const event = new CustomEvent('show-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }

  // Handle PDF import
  function handlePDFImport(event) {
    const importedTransactions = event.detail;
    if (importedTransactions && importedTransactions.length > 0) {
      transactions.update(trans => [...trans, ...importedTransactions]);
      showNotification(`✅ ${importedTransactions.length} tranzacții importate cu succes!`);
      activeTab = 'tranzactii';
    }
    showPDFImporter = false;
  }

  // Initialize dark mode
  onMount(() => {
    // Initialize security on mount
    // Apply CSP
    CSPManager.apply();
    
    // Initialize tamper protection
    TamperProtection.init();
    
    // Setup auto-lock after 15 minutes inactivity
    secureStorage.setupAutoLock(15);
    
    // Existing dark mode code...
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }
  });

  // Calculate total balance reactively
  $: totalBalance = calculateTotalBalance($accounts);
</script>

<div class="container">
  <header>
    <h1>💰 N-OMAD Suite</h1>
    <div class="balance-display">
      <div class="balance-total">
        Total: {totalBalance.toLocaleString('ro-RO', {
          style: 'currency',
          currency: 'RON'
        })}
      </div>
      <div class="balance-detail">
        {#each $accounts as account}
          <span class="balance-item">
            {account.name}: {account.balance.toLocaleString('ro-RO', {
              style: 'currency',
              currency: account.currency
            })}
          </span>
        {/each}
      </div>
    </div>
  </header>

  <button 
    class="dark-mode-toggle" 
    on:click={toggleDarkMode}
    aria-label="Toggle dark mode"
  >
    {isDarkMode ? '☀️' : '🌙'}
  </button>

  <div class="tabs">
    {#each availableTabs as tab}
      <button 
        class="tab {activeTab === tab.id ? 'active' : ''}"
        on:click={() => switchTab(tab.id)}
        type="button"
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
        {#if activeTab === tab.id}
          <span class="tab-indicator" transition:slide={{ duration: 300, easing: quintOut }}></span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Content wrapper -->
  <div class="content-wrapper">
    {#key activeTab}
      <div 
        class="tab-content"
        in:fly={{ x: 50 * direction, duration: 300, delay: 100, easing: quintOut }}
        out:fade={{ duration: 200 }}
      >
        <!-- Finance Module -->
        {#if activeTab === 'dashboard'}
          <LazyComponent componentName="Dashboard" />
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
        {:else if activeTab === 'rapoarte'}
          <LazyComponent componentName="RapoarteAvansate" />
          
        <!-- Pantry Module -->
        {:else if activeTab === 'grocery'}
          <div class="grocery-tab">
            <div class="grocery-header">
              <h2>🛒 Smart Pantry Tracker</h2>
              <button 
                class="btn-receipt-parser" 
                on:click={() => showReceiptParser = true}
              >
                📄 Importă Bon Fiscal
              </button>
            </div>
            <LazyComponent componentName="GroceryDashboard" />
          </div>
        {:else if activeTab === 'shopping'}
          <ShoppingList />
          
        <!-- Nutrition Module -->
        {:else if activeTab === 'nutrition'}
          <NutritionModule activeTab="dashboard" />
        {:else if activeTab === 'recipes'}
          <NutritionModule activeTab="recipes" />
        {:else if activeTab === 'meals'}
          <NutritionModule activeTab="meals" />
          
        <!-- Shared Functions -->
        {:else if activeTab === 'import'}
          <div class="import-section">
            <button 
              class="btn-import-pdf"
              on:click={() => showPDFImporter = true}
            >
              📄 Deschide Import PDF
            </button>
            
            <div class="import-info">
              <h3>ℹ️ Instrucțiuni Import PDF</h3>
              <ul>
                <li>Suportă extrase de la: BT, BCR, ING, Raiffeisen, UniCredit</li>
                <li>Detectează automat tranzacțiile</li>
                <li>Categorizează automat după comerciant</li>
                <li>Verifică duplicatele înainte de import</li>
              </ul>
            </div>
          </div>
        {:else if activeTab === 'export'}
          <Export />
        {/if}
      </div>
    {/key}
  </div>

  <!-- Toast notifications -->
  <Toast />

  <!-- Modals -->
  {#if showPDFImporter}
    <LazyComponent 
      componentName="PDFImporter"
      on:import={handlePDFImport}
      on:close={() => showPDFImporter = false}
    />
  {/if}

  {#if showReceiptParser}
    <LazyComponent 
      componentName="ReceiptParser" 
      props={{ isOpen: showReceiptParser }}
      on:productsAdded={() => {
        showNotification('🛒 Produse adăugate cu succes în inventar!', 'success');
        showReceiptParser = false;
      }}
      on:close={() => showReceiptParser = false}
    />
  {/if}
</div>

<style>
  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .balance-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    background: rgba(255, 255, 255, 0.15);
    padding: 12px 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
  }

  .balance-total {
    font-size: 1.8rem;
    font-weight: bold;
  }

  .balance-detail {
    display: flex;
    gap: 15px;
    font-size: 0.9rem;
    opacity: 0.95;
  }

  .balance-item {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 15px;
    white-space: nowrap;
  }

  /* Tabs styling */
  .tabs {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
  }

  .tabs::-webkit-scrollbar {
    height: 6px;
  }

  .tabs::-webkit-scrollbar-track {
    background: transparent;
  }

  .tabs::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
  }

  .tab {
    position: relative;
    padding: 12px 20px;
    background: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    white-space: nowrap;
  }

  .tab:hover:not(.active) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  }

  .tab.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transform: scale(1.05);
  }

  .tab-icon {
    font-size: 18px;
    transition: transform 0.3s ease;
  }

  .tab:hover .tab-icon {
    transform: rotate(10deg) scale(1.1);
  }

  .tab.active .tab-icon {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: white;
    border-radius: 3px 3px 0 0;
  }

  .content-wrapper {
    position: relative;
    min-height: 500px;
    overflow: hidden;
  }

  .tab-content {
    position: relative;
  }

  /* Import section */
  .import-section {
    padding: 30px;
    text-align: center;
  }

  .btn-import-pdf {
    padding: 15px 30px;
    font-size: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 30px;
  }

  .btn-import-pdf:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  .import-info {
    max-width: 500px;
    margin: 0 auto;
    text-align: left;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .import-info h3 {
    margin-top: 0;
  }

  .import-info ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  /* Grocery tab */
  .grocery-tab {
    padding: 20px;
  }

  .grocery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .btn-receipt-parser {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-receipt-parser:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  /* Dark mode toggle */
  .dark-mode-toggle {
    position: fixed;
    top: 10px;
    right: 90px;
    z-index: 999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
  }

  .dark-mode-toggle:hover {
    transform: scale(1.1) rotate(180deg);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  /* Dark mode styles */
  :global(html.dark) {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --border-color: #404040;
    --shadow: rgba(0, 0, 0, 0.5);
  }

  :global(html.dark .container) {
    background: var(--bg-secondary);
    box-shadow: 0 10px 40px var(--shadow);
  }

  :global(html.dark header) {
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
    color: var(--text-primary);
  }

  :global(html.dark .tabs) {
    background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%);
  }

  :global(html.dark .tab:not(.active)) {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  :global(html.dark .tab:hover:not(.active)) {
    background: linear-gradient(135deg, #3d3d3d 0%, #4d4d4d 100%);
    color: var(--text-primary);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .container {
      padding: 10px;
      border-radius: 0;
    }
    
    .tabs {
      gap: 4px;
      padding: 8px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    
    .tabs::-webkit-scrollbar {
      display: none;
    }
    
    .tab {
      padding: 10px 14px;
      font-size: 13px;
      min-width: 60px;
      flex-shrink: 0;
    }
    
    .tab-icon {
      font-size: 16px;
    }
    
    .tab-label {
      display: none;
    }
    
    .tab.active .tab-label {
      display: inline;
      margin-left: 4px;
    }
    
    .balance-display {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .balance-detail {
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .balance-item {
      font-size: 0.8rem;
      padding: 4px 8px;
    }
    
    .balance-total {
      font-size: 1.4rem;
    }
    
    header {
      flex-wrap: wrap;
      padding: 12px 16px;
    }
    
    h1 {
      font-size: 1.2rem;
    }
    
    .dark-mode-toggle {
      position: relative;
      top: auto;
      right: auto;
      width: 40px;
      height: 40px;
      font-size: 20px;
    }
  }
</style>