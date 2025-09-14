<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  // Core Components
  import Dashboard from './components/Dashboard.svelte';
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Budgeturi from './components/Budgeturi.svelte';
  import Obiective from './components/Obiective.svelte';
  import PDFImportSimple from './components/PDFImportSimple.svelte';
  import Toast from './components/Toast.svelte';
  
  // Advanced Components
  import RapoarteAvansate from './components/RapoarteAvansate.svelte';
  import RecurringPayments from './components/RecurringPayments.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import Export from './components/Export.svelte';
  import ShoppingList from './components/ShoppingList.svelte';
  import NutritionModule from './modules/nutrition/NutritionModule.svelte';
  import TestRecipe from './components/TestRecipe.svelte';
  
  // State
  let activeTab = 'dashboard';
  let showPDFImporter = false;
  let isDarkMode = false;
  let showMoreMenu = false;
  
  // Primary tabs (always visible)
  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'conturi', label: 'Conturi', icon: '🏦' },
    { id: 'tranzactii', label: 'Tranzacții', icon: '💸' },
    { id: 'budgeturi', label: 'Bugete', icon: '📈' },
    { id: 'obiective', label: 'Obiective', icon: '🎯' }
  ];
  
  // Secondary tabs (in dropdown)
  const secondaryTabs = [
    { id: 'reconciliere', label: 'Reconciliere', icon: '✅' },
    { id: 'recurente', label: 'Recurente', icon: '🔄' },
    { id: 'rapoarte', label: 'Rapoarte', icon: '📑' },
    { id: 'pantry', label: 'Pantry', icon: '🛒' },
    { id: 'nutritie', label: 'Nutriție', icon: '🍽️' },
    { id: 'test-recipe', label: 'Test Recipe', icon: '🧪' },
    { id: 'export', label: 'Export', icon: '📤' }
  ];
  
  function handlePDFImport(event) {
    const transactions = event.detail;
    console.log(`Importing ${transactions.length} transactions`);
    showPDFImporter = false;
    // Show success message
  }
  
  onMount(() => {
    isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) document.body.classList.add('dark-mode');
  });
  
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
  }
</script>

<div class="app">
  <!-- Clean Header -->
  <header class="header">
    <div class="header-left">
      <span class="logo">💰</span>
      <h1 class="title">FinanceTracker</h1>
      <span class="version">PRO</span>
    </div>
    
    <nav class="nav">
      {#each primaryTabs as tab}
        <button 
          class="tab {activeTab === tab.id ? 'active' : ''}"
          on:click={() => activeTab = tab.id}
        >
          <span class="tab-icon">{tab.icon}</span>
          <span class="tab-label">{tab.label}</span>
        </button>
      {/each}
      
      <!-- More dropdown -->
      <div class="dropdown">
        <button 
          class="tab more-btn"
          on:click={() => showMoreMenu = !showMoreMenu}
        >
          <span class="tab-icon">⋯</span>
          <span class="tab-label">Mai mult</span>
        </button>
        
        {#if showMoreMenu}
          <div class="dropdown-menu">
            {#each secondaryTabs as tab}
              <button 
                class="dropdown-item"
                on:click={() => {
                  activeTab = tab.id;
                  showMoreMenu = false;
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </nav>
    
    <div class="header-right">
      <button 
        class="btn-import"
        on:click={() => showPDFImporter = true}
      >
        📄 Import PDF
      </button>
      
      <button 
        class="btn-icon"
        on:click={toggleDarkMode}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="main">
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
    {:else if activeTab === 'recurente'}
      <RecurringPayments />
    {:else if activeTab === 'rapoarte'}
      <RapoarteAvansate />
    {:else if activeTab === 'pantry'}
      <ShoppingList />
    {:else if activeTab === 'nutritie'}
      <NutritionModule />
    {:else if activeTab === 'test-recipe'}
      <TestRecipe />
    {:else if activeTab === 'export'}
      <Export />
    {:else}
      <div class="placeholder">
        <h2>{secondaryTabs.find(t => t.id === activeTab)?.icon} {secondaryTabs.find(t => t.id === activeTab)?.label}</h2>
        <p>Această secțiune este în dezvoltare...</p>
      </div>
    {/if}
  </main>
  
  <!-- PDF Importer Modal -->
  {#if showPDFImporter}
    <PDFImportSimple onClose={() => showPDFImporter = false} />
  {/if}
  
  <Toast />
</div>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  .app {
    min-height: 100vh;
    background: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  
  /* Header */
  .header {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e1e4e8;
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 30px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .logo {
    font-size: 24px;
  }
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #24292e;
  }
  
  .version {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  }
  
  /* Navigation */
  .nav {
    flex: 1;
    display: flex;
    gap: 5px;
  }
  
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #586069;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    font-weight: 500;
  }
  
  .tab:hover {
    background: #f6f8fa;
    color: #24292e;
  }
  
  .tab.active {
    background: #0969da;
    color: white;
  }
  
  .tab-icon {
    font-size: 16px;
  }
  
  /* Dropdown */
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 5px;
    background: white;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    min-width: 180px;
    padding: 5px;
  }
  
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 4px;
    color: #24292e;
    cursor: pointer;
    font-size: 14px;
    text-align: left;
  }
  
  .dropdown-item:hover {
    background: #f6f8fa;
  }
  
  /* Header Right */
  .header-right {
    display: flex;
    gap: 10px;
  }
  
  .btn-import {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #2ea043;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-import:hover {
    background: #2c974b;
  }
  
  .btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-icon:hover {
    background: #f0f0f0;
  }
  
  /* Main */
  .main {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .placeholder {
    background: white;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    border: 1px solid #e1e4e8;
  }
  
  .placeholder h2 {
    margin-bottom: 10px;
    color: #24292e;
  }
  
  .placeholder p {
    color: #586069;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e1e4e8;
  }
  
  .modal-header h2 {
    font-size: 18px;
    color: #24292e;
  }
  
  .modal-header button {
    background: none;
    border: none;
    font-size: 24px;
    color: #586069;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-body p {
    margin-bottom: 10px;
    color: #586069;
    line-height: 1.5;
  }
  
  /* Dark mode */
  :global(.dark-mode) .app {
    background: #0d1117;
  }
  
  :global(.dark-mode) .header {
    background: #161b22;
    border-color: #30363d;
  }
  
  :global(.dark-mode) .title {
    color: #f0f6fc;
  }
  
  :global(.dark-mode) .tab {
    color: #8b949e;
  }
  
  :global(.dark-mode) .tab:hover {
    background: #262c36;
    color: #f0f6fc;
  }
  
  :global(.dark-mode) .dropdown-menu {
    background: #161b22;
    border-color: #30363d;
  }
  
  :global(.dark-mode) .dropdown-item {
    color: #f0f6fc;
  }
  
  :global(.dark-mode) .dropdown-item:hover {
    background: #262c36;
  }
  
  :global(.dark-mode) .btn-icon {
    background: #21262d;
    border-color: #30363d;
  }
  
  :global(.dark-mode) .placeholder {
    background: #161b22;
    border-color: #30363d;
  }
  
  :global(.dark-mode) .placeholder h2 {
    color: #f0f6fc;
  }
  
  :global(.dark-mode) .modal {
    background: #161b22;
  }
  
  :global(.dark-mode) .modal-header {
    border-color: #30363d;
  }
  
  :global(.dark-mode) .modal-header h2 {
    color: #f0f6fc;
  }
  
  /* Mobile */
  @media (max-width: 768px) {
    .tab-label {
      display: none;
    }
    
    .header {
      padding: 0 10px;
      gap: 10px;
    }
    
    .title {
      font-size: 16px;
    }
  }
</style>