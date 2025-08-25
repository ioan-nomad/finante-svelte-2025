<!-- src/App.svelte -->
<script>
  import Conturi from './components/Conturi.svelte';
  import Tranzactii from './components/Tranzactii.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import ImportPDF from './components/ImportPDF.svelte';
  import Export from './components/Export.svelte';
  import Toast from './components/Toast.svelte';
  import { totalBalance, fmt } from './lib/store.js';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import { onMount } from 'svelte';

// Dark mode logic
let darkMode = false;

onMount(() => {
  // Verifică preferința salvată sau preferința sistemului
  darkMode = localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Aplică dark mode
  if (darkMode) {
    document.documentElement.classList.add('dark');
  }
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

// Ordinea tab-urilor pentru direcția animației
const tabOrder = ['dashboard', 'conturi', 'tranzactii', 'rapoarte', 'import', 'export'];
$: direction = tabOrder.indexOf(activeTab) > tabOrder.indexOf(previousTab) ? 1 : -1;

  function switchTab(tab) {
  if (tab !== activeTab) {
    previousTab = activeTab;
    activeTab = tab;
  }
}
</script>

<div class="container">
  <header>
    <h1>💰 Finanțe Complete</h1>
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
    <span class="badge no-print">🔒 100% local</span>
  </header>

  <div class="tabs no-print">
  {#each [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'conturi', icon: '🗂️', label: 'Conturi' },
    { id: 'tranzactii', icon: '📋', label: 'Tranzacții' },
    { id: 'rapoarte', icon: '📈', label: 'Rapoarte Avansate' },
    { id: 'import', icon: '📄', label: 'Import PDF' },
    { id: 'export', icon: '💾', label: 'Export' }
  ] as tab}
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
        <Dashboard />
      {:else if activeTab === 'conturi'}
        <Conturi />
      {:else if activeTab === 'tranzactii'}
        <Tranzactii />
      {:else if activeTab === 'rapoarte'}
        <div class="placeholder">
          <h2>📈 Rapoarte Avansate</h2>
          <p>În dezvoltare...</p>
        </div>
      {:else if activeTab === 'import'}
        <ImportPDF />
      {:else if activeTab === 'export'}
        <Export />
      {/if}
    </div>
  {/key}
</div>

<!-- Toast notifications -->
<Toast />

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
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    background: var(--panel);
    padding: 16px 18px;
    border-radius: 14px;
    margin-bottom: 16px;
    flex-wrap: wrap;
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

  section {
    margin-top: 20px;
  }

  .card {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
  }

  .card h2 {
    margin: 0 0 12px;
    color: var(--acc);
    font-size: 1.1rem;
  }

  .meta {
    color: var(--muted);
    font-size: .86rem;
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

/* Placeholder pentru tab-uri în dezvoltare */
.placeholder {
  padding: 40px;
  text-align: center;
  color: #666;
}

.placeholder h2 {
  margin-bottom: 10px;
}

/* Responsive pentru mobile */
@media (max-width: 768px) {
  .tabs {
    gap: 4px;
    padding: 8px;
  }
  
  .tab {
    padding: 10px 12px;
    font-size: 12px;
  }
  
  .tab-icon {
    font-size: 16px;
  }
  
  .tab-label {
    display: none;
  }
  
  .tab.active .tab-label {
    display: inline;
  }
}
</style>