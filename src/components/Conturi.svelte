<!-- components/Conturi.svelte -->
<script>
  import { accounts, addAccount, deleteAccount, computeAccountBalance, fmt } from '../lib/store.js';
  import { toast } from '../lib/toastStore.js';
  
  // Form state - exact ca în HTML
  let accName = '';
  let accType = 'bank';
  let accOwner = 'Ioan';
  let accCurrency = 'RON';
  let accOpening = '';
  let accCashDefault = '';
  let editId = null;
  
  // Lista de conturi cash pentru dropdown
  $: cashAccounts = $accounts.filter(a => a.type === 'cash');
  
  function saveAccount() {
    if (!accName.trim()) {
      toast.error('Nume cont obligatoriu');
      return;
    }
    
    const acc = {
      id: editId || null,
      name: accName.trim(),
      type: accType,
      owner: accOwner,
      currency: accCurrency,
      opening: parseFloat(accOpening || 0),
      cashDefault: accCashDefault || ''
    };
    
    addAccount(acc);
    resetForm();
    toast.success('Cont salvat cu succes! 🎉');
  }
  
  function resetForm() {
    accName = '';
    accType = 'bank';
    accOwner = 'Ioan';
    accCurrency = 'RON';
    accOpening = '';
    accCashDefault = '';
    editId = null;
  }
  
  function editAccount(acc) {
    accName = acc.name;
    accType = acc.type;
    accOwner = acc.owner;
    accCurrency = acc.currency;
    accOpening = acc.opening;
    accCashDefault = acc.cashDefault || '';
    editId = acc.id;
  }
  
  function handleDelete(id) {
    if (confirm('Ștergi contul?')) {
      if (deleteAccount(id)) {
        toast.success('Cont șters');
      } else {
        toast.error('Nu poți șterge un cont cu tranzacții!');
      }
    }
  }
</script>

<div class="grid">
  <!-- Card pentru adăugare/editare cont -->
  <div class="card">
    <h2>➕ Adaugă / Editează cont</h2>
    
    <div class="row">
      <div>
        <label>Nume cont</label>
        <input bind:value={accName} placeholder="ex: BT Ioan" />
      </div>
      <div>
        <label>Tip</label>
        <select bind:value={accType}>
          <option value="bank">Bancă</option>
          <option value="cash">Cash</option>
        </select>
      </div>
    </div>
    
    <div class="row">
      <div>
        <label>Persoană</label>
        <select bind:value={accOwner}>
          <option>Ioan</option>
          <option>Nico</option>
          <option>Comun</option>
          <option>Firmă Nico</option>
        </select>
      </div>
      <div>
        <label>Monedă</label>
        <select bind:value={accCurrency}>
          <option>RON</option>
          <option>EUR</option>
          <option>USD</option>
        </select>
      </div>
    </div>
    
    <div class="row">
      <div>
        <label>Sold inițial</label>
        <input bind:value={accOpening} type="number" step="0.01" placeholder="0.00" />
      </div>
      <div>
        <label>Cont cash implicit pentru ATM</label>
        <select bind:value={accCashDefault}>
          <option value="">(niciunul)</option>
          {#each cashAccounts as acc}
            <option value={acc.id}>{acc.name}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <div class="stack" style="margin-top:10px">
      <button on:click={saveAccount} class="green">💾 Salvează cont</button>
      <button on:click={resetForm} class="ghost">↺ Resetează</button>
    </div>
  </div>

  <!-- Card pentru lista de conturi -->
  <div class="card">
    <h2>📑 Lista conturi & sold curent</h2>
    <div class="list">
      {#each $accounts as acc}
        {@const balance = computeAccountBalance(acc)}
        <div class="item">
          <div>
            <div>
              <b>{acc.name}</b> 
              {#if acc.type === 'cash'}
                <span class="tag">CASH</span>
              {/if}
              <span class="tag">{acc.owner}</span>
              <span class="tag">{acc.currency}</span>
            </div>
            <div class="meta">
              Sold inițial: {fmt(acc.opening)} | ID: {acc.id}
            </div>
          </div>
          <div class="right">
            <div class="amount {balance >= 0 ? 'inc' : 'exp'}">
              {fmt(balance)} {acc.currency}
            </div>
            <button class="ghost" on:click={() => editAccount(acc)}>Edit</button>
            <button class="red" on:click={() => handleDelete(acc.id)}>Șterge</button>
          </div>
        </div>
      {/each}
      
      {#if $accounts.length === 0}
        <div class="meta">Nu există conturi</div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Stilurile sunt deja definite în app.css, dar adăugăm specifice dacă e nevoie */
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
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--input-bg);
    color: var(--text-primary);
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  }
  
  button {
    background: var(--accent-color);
    color: white;
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
    outline: 1px solid var(--border-color);
    color: var(--text-primary);
  }
  
  button.red {
    background: var(--error-color);
  }

  button.green {
    background: var(--success-color);
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
  
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-color);
    color: white;
    font-size: .75rem;
    margin-left: 6px;
  }
  
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
</style>