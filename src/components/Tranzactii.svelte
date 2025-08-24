<!-- components/Tranzactii.svelte -->
<script>
  import { 
    accounts, 
    transactions, 
    addTransaction, 
    deleteTransaction,
    CATEGORIES,
    CATEGORY_COLORS,
    fmt, 
    formatDate,
    today,
    currentMonth
  } from '../lib/store.js';
  
  // Form state
  let txType = 'expense';
  let txFrom = '';
  let txTo = '';
  let txCategory = CATEGORIES[txType][0];
  let txPerson = 'Ioan';
  let txAmount = '';
  let txDate = today();
  let txDesc = '';
  
  // Filter state
  let fltType = 'all';
  let fltAccount = 'all';
  let fltCategory = 'all';
  let fltMonth = currentMonth();
  
  // Update category when type changes
  $: if (txType) {
    txCategory = CATEGORIES[txType][0];
  }
  
  // Filter transactions
  $: filteredTransactions = filterTransactions($transactions, fltType, fltAccount, fltCategory, fltMonth);
  
  function filterTransactions(txs, type, account, category, month) {
    let arr = [...txs];
    
    if (type !== 'all') arr = arr.filter(x => x.type === type);
    if (account !== 'all') arr = arr.filter(x => x.fromAccount === account || x.toAccount === account);
    if (category !== 'all') arr = arr.filter(x => x.category === category);
    if (month) arr = arr.filter(x => x.date && x.date.startsWith(month));
    
    return arr;
  }
  
  // All categories for filter
  const allCategories = [...new Set([
    ...CATEGORIES.expense, 
    ...CATEGORIES.income, 
    ...CATEGORIES.transfer
  ])];
  
  function handleAddTx() {
    const amount = parseFloat(txAmount || 0);
    
    if (!amount || amount <= 0) {
      alert('Sumă > 0');
      return;
    }
    
    if (txType === 'expense' && !txFrom) {
      alert('Alege contul sursă');
      return;
    }
    
    if (txType === 'income' && !txTo) {
      alert('Alege contul destinație');
      return;
    }
    
    if (txType === 'transfer' && (!txFrom || !txTo)) {
      alert('Alege ambele conturi');
      return;
    }
    
    addTransaction({
      type: txType,
      fromAccount: txType !== 'income' ? txFrom : null,
      toAccount: txType !== 'expense' ? txTo : null,
      category: txCategory,
      person: txPerson,
      amount: amount,
      date: txDate,
      description: txDesc.trim(),
      imported: false
    });
    
    // Reset form
    txAmount = '';
    txDesc = '';
    alert('✅ Tranzacție adăugată');
  }
  
  function resetForm() {
    txAmount = '';
    txDesc = '';
    txDate = today();
  }
  
  function handleDeleteTx(id) {
    if (confirm('Ștergi tranzacția?')) {
      deleteTransaction(id);
    }
  }
  
  function getAccountName(id) {
    return $accounts.find(a => a.id === id)?.name || '';
  }
</script>

<div class="grid">
  <!-- Form pentru adăugare tranzacție -->
  <div class="card">
    <h2>➕ Tranzacție manuală</h2>
    
    <label>Tip</label>
    <select bind:value={txType}>
      <option value="expense">Cheltuială</option>
      <option value="income">Venit</option>
      <option value="transfer">Transfer</option>
    </select>
    
    <div class="row">
      <div>
        <label>Din cont (from)</label>
        <select bind:value={txFrom}>
          <option value="">—</option>
          {#each $accounts as acc}
            <option value={acc.id}>{acc.name} ({acc.currency})</option>
          {/each}
        </select>
      </div>
      <div>
        <label>În cont (to)</label>
        <select bind:value={txTo}>
          <option value="">—</option>
          {#each $accounts as acc}
            <option value={acc.id}>{acc.name} ({acc.currency})</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="row">
      <div>
        <label>Categorie</label>
        <select bind:value={txCategory}>
          {#each CATEGORIES[txType] as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </div>
      <div>
        <label>Persoană</label>
        <select bind:value={txPerson}>
          <option>Ioan</option>
          <option>Nico</option>
          <option>Comun</option>
          <option>Firmă Nico</option>
        </select>
      </div>
    </div>
    
    <div class="row">
      <div>
        <label>Sumă</label>
        <input bind:value={txAmount} type="number" step="0.01" />
      </div>
      <div>
        <label>Data</label>
        <input bind:value={txDate} type="date" />
      </div>
    </div>
    
    <label>Descriere</label>
    <input bind:value={txDesc} placeholder="ex: piață, benzină, salariu, transfer" />
    
    <div class="stack" style="margin-top:10px">
      <button on:click={handleAddTx} class="green">➕ Adaugă</button>
      <button on:click={resetForm} class="ghost">↺ Resetează</button>
    </div>
  </div>

  <!-- Lista de tranzacții cu filtre -->
  <div class="card">
    <h2>📋 Tranzacții</h2>
    
    <!-- Filtre -->
    <div class="filters-panel">
      <div class="filters-row">
        <div>
          <label>Tip</label>
          <select bind:value={fltType}>
            <option value="all">Toate</option>
            <option value="income">Venituri</option>
            <option value="expense">Cheltuieli</option>
            <option value="transfer">Transferuri</option>
          </select>
        </div>
        <div>
          <label>Cont</label>
          <select bind:value={fltAccount}>
            <option value="all">Toate</option>
            {#each $accounts as acc}
              <option value={acc.id}>{acc.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label>Categorie</label>
          <select bind:value={fltCategory}>
            <option value="all">Toate</option>
            {#each allCategories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>
        <div>
          <label>Luna</label>
          <input bind:value={fltMonth} type="month" />
        </div>
      </div>
    </div>
    
    <!-- Lista tranzacții -->
    <div class="list">
      {#each filteredTransactions as t}
        {@const from = getAccountName(t.fromAccount)}
        {@const to = getAccountName(t.toAccount)}
        {@const cls = t.type === 'income' ? 'inc' : t.type === 'expense' ? 'exp' : 'xfer'}
        {@const sign = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '±'}
        {@const color = CATEGORY_COLORS[t.category] || '#999'}
        
        <div class="item">
          <div>
            <div>
              <b>{t.description || '(fără descriere)'}</b>
              <span class="tag" style="background:{color}20;color:{color}">{t.category || ''}</span>
              <span class="tag">{t.person || ''}</span>
              {#if t.imported}
                <span class="tag">PDF</span>
              {/if}
            </div>
            <div class="meta">
              {formatDate(t.date)} · 
              {#if from}din <b>{from}</b>{/if}
              {#if to} → <b>{to}</b>{/if}
            </div>
          </div>
          <div class="right">
            <div class="amount {cls}">{sign}{fmt(t.amount)}</div>
            <button class="red" on:click={() => handleDeleteTx(t.id)}>×</button>
          </div>
        </div>
      {/each}
      
      {#if filteredTransactions.length === 0}
        <div class="meta">Nu există tranzacții</div>
      {/if}
    </div>
  </div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1.2fr 1.8fr;
    gap: 18px;
  }
  
  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
    }
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
  
  label {
    display: block;
    margin: 10px 0 6px;
    color: var(--muted);
    font-size: .9rem;
  }
  
  input, select {
    width: 100%;
    padding: 10px;
    border: 1px solid #28304b;
    border-radius: 10px;
    background: var(--panel2);
    color: var(--ink);
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--acc);
    box-shadow: 0 0 0 3px rgba(128,184,255,.18);
  }
  
  button {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button.ghost {
    background: transparent;
    outline: 1px solid #2a3354;
    color: var(--ink);
  }
  
  button.red {
    background: var(--err);
  }
  
  button.green {
    background: var(--ok);
  }
  
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  @media (max-width: 700px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
  
  .stack {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .list {
    max-height: 520px;
    overflow: auto;
  }
  
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--panel2);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .meta {
    color: var(--muted);
    font-size: .86rem;
  }
  
  .amount {
    font-weight: 900;
  }
  
  .inc {
    color: var(--ok);
  }
  
  .exp {
    color: var(--err);
  }
  
  .xfer {
    color: var(--warn);
  }
  
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: #243056;
    color: #cfe1ff;
    font-size: .75rem;
    margin-left: 6px;
  }
  
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .filters-panel {
    background: var(--panel2);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
</style>