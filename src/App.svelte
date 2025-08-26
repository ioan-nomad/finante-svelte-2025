<script>
  import { onMount } from 'svelte'
  import { fade, slide } from 'svelte/transition'
  import Dashboard from './components/Dashboard.svelte'
  import Conturi from './components/Conturi.svelte'
  import Tranzactii from './components/Tranzactii.svelte'
  import RapoarteAvansate from './components/RapoarteAvansate.svelte'  // ADĂUGAT
  import ImportPDF from './components/ImportPDF.svelte'
  import Export from './components/Export.svelte'
  
  let activeTab = 'dashboard'
  let isDarkMode = false
  
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'conturi', label: '💳 Conturi', icon: '💳' },
    { id: 'tranzactii', label: '💸 Tranzacții', icon: '💸' },
    { id: 'rapoarte', label: '📈 Rapoarte Avansate', icon: '📈' },  // ADĂUGAT
    { id: 'import', label: '📄 Import PDF', icon: '📄' },
    { id: 'export', label: '💾 Export', icon: '💾' }
  ]
  
  onMount(() => {
    // Load dark mode preference
    const savedMode = localStorage.getItem('darkMode')
    isDarkMode = savedMode === 'true'
    updateDarkMode()
    
    // Initialize data if not exists
    const financeData = localStorage.getItem('financeData')
    if (!financeData) {
      const initialData = {
        accounts: [
          { id: 'acc1', name: 'Card Principal', type: 'card', currency: 'RON', balance: 0 },
          { id: 'acc2', name: 'Cash', type: 'cash', currency: 'RON', balance: 0 },
          { id: 'acc3', name: 'Economii', type: 'savings', currency: 'RON', balance: 0 }
        ],
        transactions: [],
        categories: {
          expense: ['Alimente', 'Restaurant/Comenzi', 'Transport', 'Consumabile casă', 
                   'Facturi', 'Abonamente', 'Achiziții diverse', 'Concediu/Vacanță',
                   'Investiții', 'Economii', 'Zile naștere', 'Asigurări',
                   'Revizii mașină', 'Reparații casă', 'Telefon/Laptop',
                   'Electrocasnice', 'Firmă Nico', 'Donații', 'Nunți',
                   'Mobilier casă', 'Sănătate', 'Scule', 'ATM Cash', 'Altele'],
          income: ['Salariu', 'Freelance', 'Investiții', 'Cadouri', 'Vânzări', 'Cashback', 'Altele']
        }
      }
      localStorage.setItem('financeData', JSON.stringify(initialData))
    }
  })
  
  function toggleDarkMode() {
    isDarkMode = !isDarkMode
    localStorage.setItem('darkMode', isDarkMode.toString())
    updateDarkMode()
  }
  
  function updateDarkMode() {
    if (isDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }
  
  function switchTab(tabId) {
    activeTab = tabId
  }
</script>

<div class="app">
  <header>
    <div class="header-content">
      <h1>💰 Finanțe Personale</h1>
      <button class="dark-toggle" on:click={toggleDarkMode}>
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  </header>
  
  <nav class="tabs">
    <div class="tabs-container">
      {#each tabs as tab}
        <button 
          class="tab {activeTab === tab.id ? 'active' : ''}"
          on:click={() => switchTab(tab.id)}
          transition:slide
        >
          <span class="tab-icon">{tab.icon}</span>
          <span class="tab-label">{tab.label}</span>
        </button>
      {/each}
    </div>
  </nav>
  
  <main>
    <div class="content" transition:fade={{duration: 200}}>
      {#if activeTab === 'dashboard'}
        <Dashboard />
      {:else if activeTab === 'conturi'}
        <Conturi />
      {:else if activeTab === 'tranzactii'}
        <Tranzactii />
      {:else if activeTab === 'rapoarte'}
        <RapoarteAvansate />
      {:else if activeTab === 'import'}
        <ImportPDF />
      {:else if activeTab === 'export'}
        <Export />
      {/if}
    </div>
  </main>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f5f5f5;
    color: #333;
    transition: background-color 0.3s, color 0.3s;
  }
  
  :global(body.dark) {
    background: #0f0f0f;
    color: #e0e0e0;
  }
  
  :global(:root) {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --bg-primary: white;
    --bg-secondary: #f8f9fa;
    --bg-tertiary: #f3f4f6;
    --text-primary: #111827;
    --text-muted: #6b7280;
    --border-color: #e5e7eb;
    --input-bg: white;
  }
  
  :global(body.dark) {
    --primary: #818cf8;
    --primary-dark: #6366f1;
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --bg-tertiary: #333333;
    --text-primary: #e0e0e0;
    --text-muted: #9ca3af;
    --border-color: #374151;
    --input-bg: #2a2a2a;
  }
  
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  header {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    padding: 16px 20px;
  }
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .dark-toggle {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: var(--bg-secondary);
    cursor: pointer;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
  }
  
  .dark-toggle:hover {
    transform: rotate(20deg);
    background: var(--bg-tertiary);
  }
  
  .tabs {
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    padding: 0 20px;
    overflow-x: auto;
  }
  
  .tabs-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    gap: 4px;
  }
  
  .tab {
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    transition: all 0.2s;
  }
  
  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }
  
  .tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: var(--bg-secondary);
  }
  
  .tab-icon {
    font-size: 1.2rem;
  }
  
  .tab-label {
    font-weight: 500;
  }
  
  main {
    flex: 1;
    background: var(--bg-secondary);
  }
  
  .content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    header h1 {
      font-size: 1.2rem;
    }
    
    .tab-label {
      display: none;
    }
    
    .tab {
      padding: 12px 16px;
    }
    
    .tabs-container {
      justify-content: space-around;
      width: 100%;
    }
  }
  
  section {
    background: var(--bg-primary);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
  
  .card {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 20px;
  }
  
  .card h2 {
    margin-bottom: 20px;
    font-size: 1.25rem;
  }
  
  .meta {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
</style>