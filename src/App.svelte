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
  import { accounts, transactions, calculateTotalBalance } from './modules/finance/stores/financeStore.js';
  
  // Config
  import { APP_CONFIG } from './shared/config.js';
  
  // Security imports - DISABLED for development
  import { secureStorage, InputSanitizer, TamperProtection } from './lib/security/disabled.js';
  import { CSPManager } from './lib/security/disabled.js';
  import { copyrightProtection } from './lib/security/disabled.js';
  
  // Nutrition Module
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  
  let activeTab = 'dashboard';
  let previousTab = 'dashboard';
  let direction = 1;
  let showPDFImporter = false;
  let showReceiptParser = false;
  let isDarkMode = false;

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

  // Tab switching with animation direction
  function switchTab(newTab) {
    const currentIndex = allAvailableTabs.findIndex(t => t.id === activeTab);
    const newIndex = allAvailableTabs.findIndex(t => t.id === newTab);
    direction = newIndex > currentIndex ? 1 : -1;
    previousTab = activeTab;
    activeTab = newTab;
  }

  // Dark mode toggle with secure storage
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    // Use secure storage instead of plain localStorage
    try {
      secureStorage.secureSave('darkMode', { value: isDarkMode });
    } catch (e) {
      console.error('Failed to save dark mode preference:', e);
      // Fallback to localStorage for non-critical data
      localStorage.setItem('darkMode', isDarkMode.toString());
    }
  }

  // Show notification helper with input sanitization
  function showNotification(message, type = 'success') {
    // Sanitize notification inputs to prevent XSS
    const sanitizedMessage = InputSanitizer.sanitizeHTML(message || '');
    const sanitizedType = InputSanitizer.sanitizeString(type, 20);
    
    // Validate type
    const allowedTypes = ['success', 'error', 'warning', 'info'];
    const validType = allowedTypes.includes(sanitizedType) ? sanitizedType : 'info';
    
    const event = new CustomEvent('show-notification', {
      detail: { 
        message: sanitizedMessage, 
        type: validType 
      }
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
    // Localhost verification logs
    console.log('Running on:', window.location.hostname); // TREBUIE să fie "localhost"
    console.log('Protocol:', window.location.protocol);   // TREBUIE să fie "http:"
    console.log('No trackers:', !window.ga && !window.gtag); // TREBUIE true
    
    // Initialize security on mount
    // Apply CSP
    CSPManager.apply();
    
    // Initialize tamper protection
    TamperProtection.init();
    
    // Initialize copyright protection (auto-initializes on import, but ensure it's active)
    if (typeof window !== 'undefined') {
      console.log('🔒 Copyright protection active');
    }
    
    // Setup auto-lock after 15 minutes inactivity
    secureStorage.setupAutoLock(15);
    
    // Initialize dark mode with secure storage
    const loadDarkMode = async () => {
      try {
        const secureData = await secureStorage.secureLoad('darkMode');
        if (secureData && secureData.value === true) {
          isDarkMode = true;
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        // Fallback to localStorage for migration
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
          isDarkMode = true;
          document.documentElement.classList.add('dark');
          // Migrate to secure storage
          try {
            await secureStorage.secureSave('darkMode', { value: true });
            localStorage.removeItem('darkMode');
          } catch (migrationError) {
            console.warn('Failed to migrate dark mode to secure storage');
          }
        }
      }
    };
    
    loadDarkMode();
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

  <!-- System Testing Component -->
  <SystemTester />
  
  <!-- PDF Learning Testing Component -->
  <TestPDFLearning />
  
  <!-- ML Engine Testing Component -->
  <TestML />

  <!-- Main Navigation Grid 2x5 -->
  <nav class="main-navigation">
    {#each availableMainTabs as tab}
      <button 
        class="tab-button {activeTab === tab.id ? 'active' : ''}"
        on:click={() => switchTab(tab.id)}
        type="button"
        data-row={tab.row}
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
  /* Using system fonts for better performance and privacy */

  /* CSS Variables for modern animations and effects */
  :root {
    --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-secondary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-monospace: 'SF Mono', Monaco, Inconsolata, 'Liberation Mono', 'Courier New', monospace;
    
    /* Animation variables */
    --transition-fast: 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
    --transition-normal: 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    --transition-slow: 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
    --transition-bounce: 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    
    /* Modern gradients */
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --gradient-warm: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    --gradient-cool: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    
    /* Modern shadows */
    --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    
    /* Glassmorphism */
    --glass-bg: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-backdrop: blur(20px);
    
    /* Border radius scale */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
  }

  /* Enhanced button animations */
  @keyframes buttonPulse {
    0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
    100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideInDown {
    from { transform: translateY(-100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes fadeInScale {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  /* Modern card animations */
  @keyframes cardHover {
    0% { transform: translateY(0) scale(1); }
    100% { transform: translateY(-8px) scale(1.02); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  /* Responsive breakpoints as CSS custom properties */
  @media (max-width: 640px) {
    :root { --breakpoint: 'sm'; }
  }
  @media (max-width: 768px) and (min-width: 641px) {
    :root { --breakpoint: 'md'; }
  }
  @media (max-width: 1024px) and (min-width: 769px) {
    :root { --breakpoint: 'lg'; }
  }
  @media (max-width: 1280px) and (min-width: 1025px) {
    :root { --breakpoint: 'xl'; }
  }
  @media (min-width: 1281px) {
    :root { --breakpoint: '2xl'; }
  }

  /* Global font application */
  * {
    font-family: var(--font-primary);
    scroll-behavior: smooth;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xl);
    animation: fadeInScale 0.6s var(--transition-normal);
    font-family: var(--font-primary);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: var(--gradient-primary);
    color: white;
    border-radius: var(--radius-xl);
    margin-bottom: 20px;
    box-shadow: var(--shadow-lg);
    animation: slideInDown 0.8s var(--transition-normal);
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    font-family: var(--font-secondary);
    letter-spacing: -0.025em;
  }

  .balance-display {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    background: var(--glass-bg);
    padding: 12px 20px;
    border-radius: var(--radius-lg);
    backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--glass-border);
    animation: slideInUp 0.8s var(--transition-normal);
    transition: all var(--transition-normal);
  }

  .balance-display:hover {
    transform: scale(1.02);
    background: rgba(255, 255, 255, 0.2);
  }

  .balance-total {
    font-size: 1.8rem;
    font-weight: bold;
    font-family: var(--font-monospace);
    letter-spacing: -0.02em;
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

  /* Modern Grid Navigation - 2x5 Layout */
  .main-navigation {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    margin: 16px 0;
    box-shadow: var(--shadow-xl);
    animation: slideInUp 0.8s var(--transition-normal);
  }

  .tab-button {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 6px;
    padding: 12px 8px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    color: white;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 70px;
    position: relative;
    overflow: hidden;
    font-family: var(--font-primary);
  }

  .tab-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s;
  }

  .tab-button:hover::before {
    left: 100%;
  }

  .tab-button:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .tab-button.active {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
    transform: scale(1.05);
    font-weight: 600;
    animation: pulse 2s ease-in-out infinite;
  }

  .tab-button.active::before {
    display: none;
  }

  .tab-icon {
    font-size: 24px;
    transition: transform 0.3s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .tab-button:hover .tab-icon {
    transform: rotate(5deg) scale(1.1);
  }

  .tab-button.active .tab-icon {
    transform: scale(1.15);
    animation: bounce 1s ease-in-out;
  }

  .tab-label {
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: scale(1.15) translateY(0);
    }
    40%, 43% {
      transform: scale(1.2) translateY(-8px);
    }
    70% {
      transform: scale(1.18) translateY(-4px);
    }
  }

  /* Secondary Navigation */
  .secondary-navigation {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    margin: 10px 0;
    box-shadow: var(--shadow-sm);
  }

  .secondary-label {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    margin-right: 8px;
    font-family: var(--font-secondary);
  }

  .secondary-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    color: #666;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-primary);
  }

  .secondary-tab:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .secondary-tab.active {
    background: #f5576c;
    color: white;
    border-color: #f5576c;
    box-shadow: var(--shadow-md);
  }

  .secondary-icon {
    font-size: 14px;
  }

  .secondary-text {
    white-space: nowrap;
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
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
    margin-bottom: 30px;
    font-family: var(--font-primary);
    font-weight: 500;
    letter-spacing: 0.025em;
    box-shadow: var(--shadow-md);
  }

  .btn-import-pdf:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    animation: buttonPulse 1s infinite;
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
    background: var(--gradient-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-family: var(--font-primary);
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }

  .btn-receipt-parser:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    animation: buttonPulse 1s infinite;
  }

  /* Dark mode toggle */
  .dark-mode-toggle {
    position: fixed;
    top: 10px;
    right: 90px;
    z-index: 999;
    background: var(--gradient-primary);
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-bounce);
    animation: float 4s ease-in-out infinite;
  }

  .dark-mode-toggle:hover {
    transform: scale(1.1) rotate(180deg);
    box-shadow: var(--shadow-2xl);
    animation: buttonPulse 1s infinite;
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

  /* Responsive design for Grid Navigation */
  @media (max-width: 768px) {
    .container {
      padding: 8px;
      border-radius: 0;
    }
    
    /* Switch to 3x4 grid on mobile */
    .main-navigation {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 8px;
      padding: 12px;
      margin: 8px 0;
    }
    
    .tab-button {
      min-height: 60px;
      padding: 8px 6px;
      gap: 4px;
    }
    
    .tab-icon {
      font-size: 20px;
    }
    
    .tab-label {
      font-size: 10px;
    }
    
    /* Simplify secondary navigation on mobile */
    .secondary-navigation {
      padding: 8px 12px;
      margin: 6px 0;
    }
    
    .secondary-tab {
      padding: 4px 8px;
      font-size: 11px;
    }
    
    .secondary-icon {
      font-size: 12px;
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