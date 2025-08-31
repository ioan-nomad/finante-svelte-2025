<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import EditModal from './EditModal.svelte'  // ADĂUGAT: Import EditModal
  import { debounce } from '../lib/utils.js'
  
  let transactions = []
  let accounts = []
  let filteredTx = []
  let visibleTransactions = []
  let searchTerm = ''
  let filterType = 'all'
  let filterAccount = ''
  let filterPerson = ''
  let sortBy = 'date'
  let sortOrder = 'desc'
  
  // ADĂUGAT: State pentru editare
  let editingTransaction = null
  
  // Virtual scrolling
  let scrollContainer
  const ITEMS_PER_PAGE = 50
  
  // Debounce pentru search
  const debouncedSearch = debounce((term) => {
    searchTerm = term;
  }, 300)
  
  // Categories
  const expenseCategories = ['Alimente', 'Transport', 'Utilități', 'Sănătate', 'Entertainment', 'Shopping', 'Restaurant', 'Educație', 'Sport', 'Abonamente', 'ATM Cash', 'Altele']
  const incomeCategories = ['Salariu', 'Freelance', 'Investiții', 'Cadouri', 'Vânzări', 'Cashback', 'Altele']
  
  let showForm = false
  let txType = 'expense'
  let txAmount = ''
  let txDesc = ''
  let txCategory = ''
  let txFromAccount = ''
  let txToAccount = ''
  let txDate = new Date().toISOString().split('T')[0]
  let txPerson = ''
  
  $: categories = txType === 'income' ? incomeCategories : expenseCategories
  
  onMount(() => {
    loadData()
  })
  
  function loadData() {
    const stored = localStorage.getItem('financeData')
    if (stored) {
      const data = JSON.parse(stored)
      transactions = data.transactions || []
      accounts = data.accounts || []
      filterAndSort()
    }
  }
  
  function saveData() {
    const stored = localStorage.getItem('financeData')
    const data = stored ? JSON.parse(stored) : {}
    data.transactions = transactions
    localStorage.setItem('financeData', JSON.stringify(data))
  }
  
  function filterAndSort() {
    let result = [...transactions]
    
    // Search
    if (searchTerm) {
      result = result.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType)
    }
    
    // Filter by account
    if (filterAccount) {
      result = result.filter(t => 
        t.fromAccount === filterAccount || t.toAccount === filterAccount
      )
    }
    
    // Filter by person
    if (filterPerson) {
      result = result.filter(t => t.person === filterPerson)
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      
      if (sortBy === 'date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else if (sortBy === 'amount') {
        aVal = parseFloat(aVal)
        bVal = parseFloat(bVal)
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    filteredTx = result
  }
  
  $: searchTerm, filterType, filterAccount, filterPerson, sortBy, sortOrder, filterAndSort()

  // Virtual scrolling pentru performanță
  $: {
    visibleTransactions = filteredTx.slice(0, ITEMS_PER_PAGE);
  }

  function loadMore() {
    if (visibleTransactions.length < filteredTx.length) {
      visibleTransactions = filteredTx.slice(0, visibleTransactions.length + ITEMS_PER_PAGE);
    }
  }
  
  function addTransaction() {
    if (!txAmount || parseFloat(txAmount) <= 0) {
      alert('Te rog introdu o sumă validă')
      return
    }
    
    const newTx = {
      id: Date.now().toString(),
      type: txType,
      amount: parseFloat(txAmount),
      description: txDesc,
      category: txCategory,
      fromAccount: txType !== 'income' ? txFromAccount : null,
      toAccount: txType !== 'expense' ? txToAccount : null,
      date: txDate,
      person: txPerson,
      createdAt: new Date().toISOString()
    }
    
    transactions = [newTx, ...transactions]
    saveData()
    filterAndSort()
    
    // Reset form
    txAmount = ''
    txDesc = ''
    txCategory = ''
    showForm = false
    
    alert('✅ Tranzacție adăugată cu succes!')
  }
  
  // ADĂUGAT: Funcție pentru deschidere modal editare
  function editTransaction(tx) {
    editingTransaction = tx
  }
  
  // ADĂUGAT: Handler pentru salvare editare
  function handleEditSave(event) {
    const updatedTx = event.detail
    transactions = transactions.map(t => 
      t.id === updatedTx.id ? updatedTx : t
    )
    saveData()
    filterAndSort()
    editingTransaction = null
    alert('✅ Tranzacție actualizată!')
  }
  
  // ADĂUGAT: Handler pentru ștergere din modal
  function handleEditDelete(event) {
    const txId = event.detail
    deleteTransaction(txId)
    editingTransaction = null
  }
  
  function deleteTransaction(id) {
    if (confirm('Sigur vrei să ștergi această tranzacție?')) {
      transactions = transactions.filter(t => t.id !== id)
      saveData()
      filterAndSort()
      alert('✅ Tranzacție ștearsă!')
    }
  }
  
  function getAccountName(id) {
    const acc = accounts.find(a => a.id === id)
    return acc ? acc.name : ''
  }
  
  function formatAmount(amount) {
    return new Intl.NumberFormat('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ro-RO')
  }
  
  const categoryColors = {
    'Alimente': '#10b981',
    'Transport': '#3b82f6',
    'Utilități': '#f59e0b',
    'Sănătate': '#ec4899',
    'Entertainment': '#8b5cf6',
    'Shopping': '#06b6d4',
    'Restaurant': '#f97316',
    'Educație': '#6366f1',
    'Sport': '#84cc16',
    'Abonamente': '#a855f7',
    'ATM Cash': '#64748b',
    'Salariu': '#10b981',
    'Freelance': '#3b82f6',
    'Investiții': '#f59e0b',
    'Altele': '#6b7280'
  }
</script>

<div class="container">
  <!-- Add Transaction Form -->
  <div class="card">
    <div class="card-header">
      <h2>➕ Adaugă Tranzacție</h2>
      <button on:click={() => showForm = !showForm}>
        {showForm ? 'Închide' : 'Deschide'}
      </button>
    </div>
    
    {#if showForm}
      <div transition:slide>
        <div class="form-grid">
          <div class="form-group">
            <label>Tip</label>
            <div class="type-selector">
              <button class:active={txType === 'income'} on:click={() => txType = 'income'}>
                ↓ Venit
              </button>
              <button class:active={txType === 'expense'} on:click={() => txType = 'expense'}>
                ↑ Cheltuială
              </button>
              <button class:active={txType === 'transfer'} on:click={() => txType = 'transfer'}>
                ↔ Transfer
              </button>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Sumă</label>
              <input type="number" bind:value={txAmount} placeholder="0.00" step="0.01">
            </div>
            
            <div class="form-group">
              <label>Descriere</label>
              <input type="text" bind:value={txDesc} placeholder="Descriere opțională">
            </div>
          </div>
          
          {#if txType !== 'transfer'}
            <div class="form-group">
              <label>Categorie</label>
              <select bind:value={txCategory}>
                <option value="">-- Selectează --</option>
                {#each categories as cat}
                  <option value={cat}>{cat}</option>
                {/each}
              </select>
            </div>
          {/if}
          
          <div class="form-row">
            {#if txType === 'expense' || txType === 'transfer'}
              <div class="form-group">
                <label>Din cont</label>
                <select bind:value={txFromAccount}>
                  <option value="">-- Selectează --</option>
                  {#each accounts as acc}
                    <option value={acc.id}>{acc.name}</option>
                  {/each}
                </select>
              </div>
            {/if}
            
            {#if txType === 'income' || txType === 'transfer'}
              <div class="form-group">
                <label>În cont</label>
                <select bind:value={txToAccount}>
                  <option value="">-- Selectează --</option>
                  {#each accounts as acc}
                    <option value={acc.id}>{acc.name}</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Data</label>
              <input type="date" bind:value={txDate}>
            </div>
            
            <div class="form-group">
              <label>Persoană</label>
              <select bind:value={txPerson}>
                <option value="">-- Selectează --</option>
                <option>Ioan</option>
                <option>Nico</option>
                <option>Comun</option>
                <option>Firmă Nico</option>
              </select>
            </div>
          </div>
          
          <button class="btn-primary" on:click={addTransaction}>
            Adaugă Tranzacție
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Filters -->
  <div class="card">
    <h3>🔍 Filtre și Sortare</h3>
    <div class="filters">
      <div class="filter-row">
        <div class="form-group">
          <label>Caută</label>
          <input type="text" on:input={(e) => debouncedSearch(e.target.value)} placeholder="Caută în descriere...">
        </div>
        
        <div class="form-group">
          <label>Tip</label>
          <select bind:value={filterType}>
            <option value="all">Toate</option>
            <option value="income">Venituri</option>
            <option value="expense">Cheltuieli</option>
            <option value="transfer">Transferuri</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Cont</label>
          <select bind:value={filterAccount}>
            <option value="">Toate</option>
            {#each accounts as acc}
              <option value={acc.id}>{acc.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Persoană</label>
          <select bind:value={filterPerson}>
            <option value="">Toate</option>
            <option>Ioan</option>
            <option>Nico</option>
            <option>Comun</option>
            <option>Firmă Nico</option>
          </select>
        </div>
      </div>
      
      <div class="filter-row">
        <div class="form-group">
          <label>Sortare</label>
          <select bind:value={sortBy}>
            <option value="date">După dată</option>
            <option value="amount">După sumă</option>
            <option value="description">După descriere</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Ordine</label>
          <select bind:value={sortOrder}>
            <option value="desc">Descendent</option>
            <option value="asc">Ascendent</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Transactions List -->
  <div class="card">
    <h2>📋 Tranzacții ({filteredTx.length})</h2>
    
    {#if filteredTx.length === 0}
      <p class="empty">Nu există tranzacții</p>
    {:else}
      <div class="tx-list" bind:this={scrollContainer}>
        {#each visibleTransactions as tx (tx.id)}
          <div class="tx-item" transition:slide>
            <div class="tx-main">
              <div class="tx-info">
                <div class="tx-header">
                  <span class="tx-desc">{tx.description || '(fără descriere)'}</span>
                  {#if tx.category}
                    <span class="tx-category" style="background-color: {categoryColors[tx.category]}20; color: {categoryColors[tx.category]}">
                      {tx.category}
                    </span>
                  {/if}
                  {#if tx.person}
                    <span class="tx-person">{tx.person}</span>
                  {/if}
                </div>
                
                <div class="tx-meta">
                  <span>{formatDate(tx.date)}</span>
                  {#if tx.type === 'transfer'}
                    <span>💳 {getAccountName(tx.fromAccount)} → {getAccountName(tx.toAccount)}</span>
                  {:else if tx.type === 'income'}
                    <span>💳 → {getAccountName(tx.toAccount)}</span>
                  {:else}
                    <span>💳 {getAccountName(tx.fromAccount)} →</span>
                  {/if}
                </div>
              </div>
              
              <div class="tx-right">
                <div class="tx-amount {tx.type}">
                  {#if tx.type === 'income'}
                    +{formatAmount(tx.amount)} RON
                  {:else if tx.type === 'expense'}
                    -{formatAmount(tx.amount)} RON
                  {:else}
                    ↔ {formatAmount(tx.amount)} RON
                  {/if}
                </div>
                
                <div class="tx-actions">
                  <!-- ADĂUGAT: Buton de editare -->
                  <button class="btn-icon" on:click={() => editTransaction(tx)} title="Editează">
                    ✏️
                  </button>
                  <button class="btn-icon delete" on:click={() => deleteTransaction(tx.id)} title="Șterge">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
        
        {#if visibleTransactions.length < filteredTx.length}
          <div class="load-more">
            <button on:click={loadMore} class="load-more-btn">
              Încarcă mai multe ({visibleTransactions.length} din {filteredTx.length})
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- ADĂUGAT: Modal pentru editare -->
{#if editingTransaction}
  <EditModal
    transaction={editingTransaction}
    {accounts}
    on:save={handleEditSave}
    on:delete={handleEditDelete}
    on:close={() => editingTransaction = null}
  />
{/if}

<style>
  .container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .card {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card h2, .card h3 {
    margin: 0 0 20px 0;
  }
  
  .form-grid {
    display: grid;
    gap: 16px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--text-muted);
  }
  
  input, select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 1rem;
    background: var(--input-bg);
    color: var(--text-primary);
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--primary);
  }
  
  .type-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .type-selector button {
    padding: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .type-selector button:hover {
    border-color: var(--primary);
  }
  
  .type-selector button.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .btn-primary {
    padding: 10px 20px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
  }
  
  .btn-primary:hover {
    opacity: 0.9;
  }
  
  .filters {
    display: grid;
    gap: 16px;
  }
  
  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .tx-list {
    display: grid;
    gap: 12px;
  }
  
  .tx-item {
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
  
  .tx-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
  
  .tx-info {
    flex: 1;
    min-width: 0;
  }
  
  .tx-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  
  .tx-desc {
    font-weight: 500;
  }
  
  .tx-category {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  
  .tx-person {
    padding: 2px 8px;
    background: var(--bg-tertiary);
    border-radius: 4px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  
  .tx-meta {
    display: flex;
    gap: 12px;
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  
  .tx-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .tx-amount {
    font-size: 1.25rem;
    font-weight: 600;
    white-space: nowrap;
  }
  
  .tx-amount.income {
    color: #10b981;
  }
  
  .tx-amount.expense {
    color: #ef4444;
  }
  
  .tx-amount.transfer {
    color: #3b82f6;
  }
  
  .tx-actions {
    display: flex;
    gap: 4px;
  }
  
  /* ADĂUGAT: Stiluri pentru butoane de acțiuni */
  .btn-icon {
    width: 32px;
    height: 32px;
    border: none;
    background: var(--bg-tertiary, #f3f4f6);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .btn-icon:hover {
    background: var(--primary-light, #dbeafe);
    transform: translateY(-2px);
  }
  
  .btn-icon.delete:hover {
    background: #fee2e2;
  }
  
  .empty {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
  }
  
  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .tx-main {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .tx-right {
      width: 100%;
      justify-content: space-between;
      margin-top: 12px;
    }
  }
</style>