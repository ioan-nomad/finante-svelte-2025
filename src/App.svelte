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
    <div class="tab {activeTab === 'dashboard' ? 'active' : ''}" on:click={() => switchTab('dashboard')}>
      📊 Dashboard
    </div>
    <div class="tab {activeTab === 'conturi' ? 'active' : ''}" on:click={() => switchTab('conturi')}>
      🗂️ Conturi
    </div>
    <div class="tab {activeTab === 'tranzactii' ? 'active' : ''}" on:click={() => switchTab('tranzactii')}>
      📋 Tranzacții
    </div>
    <div class="tab {activeTab === 'rapoarte' ? 'active' : ''}" on:click={() => switchTab('rapoarte')}>
      📈 Rapoarte Avansate
    </div>
    <div class="tab {activeTab === 'import' ? 'active' : ''}" on:click={() => switchTab('import')}>
      📄 Import PDF
    </div>
    <div class="tab {activeTab === 'export' ? 'active' : ''}" on:click={() => switchTab('export')}>
      💾 Export
    </div>
  </div>

  <!-- Conținutul pentru fiecare tab -->
  {#if activeTab === 'dashboard'}
    <section>
      <Dashboard />
    </section>
  {:else if activeTab === 'conturi'}
    <section>
      <Conturi />
    </section>
  {:else if activeTab === 'tranzactii'}
    <section>
      <Tranzactii />
    </section>
  {:else if activeTab === 'rapoarte'}
    <section>
      <div class="card">
        <h2>🚧 Rapoarte - În construcție</h2>
        <p class="meta">Rapoartele avansate vor fi adăugate ulterior.</p>
      </div>
    </section>
  {:else if activeTab === 'import'}
    <section>
      <ImportPDF />
    </section>
  {:else if activeTab === 'export'}
    <section>
      <Export />
    </section>
  {/if}
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
</style>