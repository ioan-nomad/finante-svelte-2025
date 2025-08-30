<!-- src/App.svelte -->
<script>
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Export from './components/Export.svelte';
  import Budgeturi from './components/Budgeturi.svelte';
  import Obiective from './components/Obiective.svelte';
  import Reconciliere from './components/Reconciliere.svelte';
  import GlobalNotifications from './components/GlobalNotifications.svelte';
  import Toast from './components/Toast.svelte';
  import LazyComponent from './components/LazyComponent.svelte';
  import { totalBalance, fmt, accounts, transactions, addTransaction } from './lib/store.js';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import { onMount } from 'svelte';
  import { preloadComponents } from './lib/lazyLoader.js';

// Dark mode logic
let darkMode = false;

onMount(async () => {
  // Verifică preferința salvată sau preferința sistemului
  darkMode = localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Aplică dark mode
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }
  
  // Preload heavy components in background after initial render
  setTimeout(() => {
    preloadComponents(['Dashboard', 'RapoarteAvansate', 'GroceryDashboard', 'PDFImporter', 'ReceiptParser']);
  }, 1000);
});

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

  // Tab management
  let activeTab = 'dashboard';
  let previousTab = 'dashboard';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'conturi', label: 'Conturi', icon: '💳' },
  { id: 'tranzactii', label: 'Tranzacții', icon: '💸' },
  { id: 'budgeturi', label: 'Bugete', icon: '🎯' },
  { id: 'obiective', label: 'Obiective', icon: '🏆' },
  { id: 'reconciliere', label: 'Reconciliere', icon: '✅' },
  { id: 'rapoarte', label: 'Rapoarte', icon: '📈' },
  { id: 'grocery', label: 'Stoc Alimente', icon: '🛒' },
  { id: 'import', label: 'Import', icon: '📥' },
  { id: 'export', label: 'Export', icon: '📤' }
];
  
  // PDF Importer
  let showPDFImporter = false;
  
  // Receipt Parser
  let showReceiptParser = false;

// Ordinea tab-urilor pentru direcția animației
const tabOrder = ['dashboard', 'conturi', 'tranzactii', 'budgeturi', 'obiective', 'reconciliere', 'rapoarte', 'grocery', 'import', 'export'];
$: direction = tabOrder.indexOf(activeTab) > tabOrder.indexOf(previousTab) ? 1 : -1;

  function switchTab(tab) {
  if (tab !== activeTab) {
    previousTab = activeTab;
    activeTab = tab;
  }
}

function handlePDFImport(event) {
  const importedTransactions = event.detail;
  
  // Adaugă tranzacțiile importate în lista existentă
  importedTransactions.forEach(t => {
    const newTransaction = {
      ...t,
      person: 'Comun',
      fromAccount: $accounts[0]?.id,
      toAccount: $accounts[0]?.id,
      createdAt: new Date().toISOString()
    };
    addTransaction(newTransaction);
  });
  
  showPDFImporter = false;
  showNotification(`✅ ${importedTransactions.length} tranzacții importate cu succes!`, 'success');
}

// Enhanced notification system
function showNotification(message, type = 'success') {
  // Creează element de notificare
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Arial;
    font-weight: 500;
    max-width: 350px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(notification);
  
  // Remove după 3 secunde
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
</script>

<div class="container">
  <header>
    <div class="header-left">
      <h1>💰 Finanțe Complete</h1>
    </div>
    
    <div class="balance-display">
      <div class="balance-total">{fmt($totalBalance.mainBalance)} RON</div>
      <div class="balance-detail">
        {#if $totalBalance.bankBalances['RON']}
          <span class="balance-item">🏦 Bănci: {fmt($totalBalance.bankBalances['RON'])} RON</span>
        {/if}
        {#if $totalBalance.cashBalances['RON']}
          <span class="balance-item">💵 Cash: {fmt($totalBalance.cashBalances['RON'])} RON</span>
        {/if}
        {#each Object.entries($totalBalance.balances) as [currency, amount]}
          {#if currency !== 'RON' && amount !== 0}
            <span class="balance-item">{fmt(amount)} {currency}</span>
          {/if}
        {/each}
      </div>
    </div>
    
    <div class="header-right">
      <GlobalNotifications />
      <button 
        class="dark-mode-toggle"
        on:click={toggleDarkMode}
        aria-label="Toggle dark mode"
        type="button"
      >
        {#if darkMode}
          ☀️
        {:else}
          🌙
        {/if}
      </button>
      <span class="badge no-print">🔒 100% local</span>
    </div>
  </header>

  <div class="tabs no-print">
  {#each tabs as tab}
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
  </div>

  <!-- Conținutul pentru fiecare tab -->
  <div class="content-wrapper">
  {#key activeTab}
    <div 
      class="tab-content"
      in:fly={{ x: 50 * direction, duration: 300, delay: 100, easing: quintOut }}
      out:fade={{ duration: 200 }}
    >
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
      {:else if activeTab === 'rapoarte'}
        <LazyComponent componentName="RapoarteAvansate" />
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

<style>
  :global(:root) {
    --bg: #0f1220;
    --panel: #171a2b;
    --panel2: #0b0e1a;
    --ink: #e6e9ff;
    --muted: #9aa3b2;
    --acc: #80b8ff;
    --ok: #7bd88f;
    --warn: #ffd479;
    --err: #ff6b6b;
  }

  :global(body) {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, Arial;
    background: var(--bg);
    color: var(--ink);
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 16px;
    align-items: center;
    background: var(--panel);
    padding: 16px 18px;
    border-radius: 14px;
    margin-bottom: 16px;
    position: relative;
  }
  
  .header-left {
    justify-self: start;
  }
  
  .header-right {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--acc);
  }

  .badge {
    background: var(--ok);
    color: #08131a;
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 800;
  }

  .balance-display {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .balance-total {
    font-size: 1.6rem;
    font-weight: 900;
    color: var(--ok);
  }

  .balance-detail {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .balance-item {
    background: var(--panel2);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 14px 0;
  }

  .tab {
    background: var(--panel);
    padding: 10px 14px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab:hover {
    background: #1f2444;
  }

  .tab.active {
    outline: 2px solid var(--acc);
    background: #1f2444;
  }


  @media print {
    .no-print {
      display: none !important;
    }
  }
/* ===== ANIMAȚII TABS ===== */
.tabs {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
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


/* Responsive pentru mobile */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .tabs {
    gap: 4px;
    padding: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .tabs::-webkit-scrollbar {
    display: none;
  }
  
  .tab {
    padding: 12px 16px;
    font-size: 13px;
    min-width: 60px;
    flex-shrink: 0;
  }
  
  .tab-icon {
    font-size: 18px;
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
/* ===== DARK MODE STYLES ===== */
.dark-mode-toggle {
  position: fixed;
  top: 10px;
  right: 90px; /* mărit de la 10px la 90px pentru a nu acoperi indicatorul 100% */
  z-index: 999; /* redus din 1000 pentru a fi sub modal-uri */
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

/* Dark mode variables */
:global(html.dark) {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.5);
}

:global(html.dark body) {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: var(--text-primary);
}

:global(html.dark .container) {
  background: var(--bg-secondary);
  box-shadow: 0 10px 40px var(--shadow);
}

:global(html.dark header) {
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  color: var(--text-primary);
  border-bottom-color: var(--border-color);
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

:global(html.dark .balance-display) {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
}

:global(html.dark input),
:global(html.dark select),
:global(html.dark textarea) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

:global(html.dark button:not(.dark-mode-toggle):not(.tab)) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

:global(html.dark .card),
:global(html.dark .form-group) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

:global(html.dark table) {
  background: var(--bg-secondary);
}

:global(html.dark th) {
  background: #1a1a1a;
  color: var(--text-primary);
}

:global(html.dark td) {
  color: var(--text-primary);
  border-color: var(--border-color);
}

:global(html.dark .placeholder) {
  color: var(--text-secondary);
}

/* Animație pentru tranziție */
:global(body),
:global(.container),
:global(header),
:global(.tabs),
:global(.tab),
:global(input),
:global(select),
:global(textarea),
:global(table) {
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.import-section {
  padding: 40px;
  text-align: center;
}

.btn-import-pdf {
  background: #4CAF50;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  margin-bottom: 30px;
}

.btn-import-pdf:hover {
  background: #45a049;
}

.import-info {
  max-width: 500px;
  margin: 0 auto;
  text-align: left;
}

.import-info h3 {
  color: #333;
  margin-bottom: 15px;
}

.import-info ul {
  list-style: none;
  padding: 0;
}

.import-info li {
  padding: 8px 0;
  padding-left: 25px;
  position: relative;
}

.import-info li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #4CAF50;
}

.grocery-tab {
  padding: 20px;
}

.grocery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--panel);
  border-radius: 12px;
}

.grocery-header h2 {
  margin: 0;
  color: var(--acc);
  font-size: 1.5rem;
}

.btn-receipt-parser {
  background: var(--acc);
  color: #08131a;
  border: 0;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-receipt-parser:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .grocery-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .btn-receipt-parser {
    width: 100%;
  }
}

/* Notification animations */
@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
</style>