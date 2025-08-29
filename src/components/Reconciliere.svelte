<!-- components/Reconciliere.svelte -->
<script>
  import { onMount } from 'svelte';
  import { accounts, transactions, computeAccountBalance, fmt, today } from '../lib/store.js';
  
  // Reconciliation state
  let reconciliations = [];
  let showForm = false;
  let selectedAccount = '';
  let bankBalance = '';
  let reconcileDate = today();
  let differences = [];
  
  onMount(() => {
    loadReconciliations();
    calculateDifferences();
  });
  
  // Reactive updates
  $: if ($accounts.length || $transactions.length) {
    calculateDifferences();
  }
  
  function loadReconciliations() {
    const stored = localStorage.getItem('fs_reconciliations');
    if (stored) {
      reconciliations = JSON.parse(stored);
    }
  }
  
  function saveReconciliations() {
    localStorage.setItem('fs_reconciliations', JSON.stringify(reconciliations));
  }
  
  function calculateDifferences() {
    differences = $accounts.map(account => {
      const appBalance = computeAccountBalance(account);
      const lastReconcile = getLastReconciliation(account.id);
      
      return {
        account,
        appBalance,
        lastReconcileDate: lastReconcile?.date || 'Niciodată',
        lastBankBalance: lastReconcile?.bankBalance || 0,
        difference: lastReconcile ? appBalance - lastReconcile.bankBalance : 0,
        status: getReconcileStatus(account.id, appBalance, lastReconcile),
        daysSinceReconcile: lastReconcile ? Math.floor((new Date() - new Date(lastReconcile.date)) / (1000 * 60 * 60 * 24)) : null
      };
    });
  }
  
  function getLastReconciliation(accountId) {
    return reconciliations
      .filter(r => r.accountId === accountId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }
  
  function getReconcileStatus(accountId, appBalance, lastReconcile) {
    if (!lastReconcile) return 'never';
    
    const daysSince = Math.floor((new Date() - new Date(lastReconcile.date)) / (1000 * 60 * 60 * 24));
    const difference = Math.abs(appBalance - lastReconcile.bankBalance);
    
    if (daysSince > 30) return 'overdue';
    if (difference > 10) return 'mismatch';
    if (daysSince > 7) return 'due';
    return 'ok';
  }
  
  function getStatusInfo(status) {
    switch (status) {
      case 'never': return { icon: '⚠️', text: 'Niciodată reconciliat', color: '#ef4444' };
      case 'overdue': return { icon: '🚨', text: 'Întârziat (>30 zile)', color: '#dc2626' };
      case 'mismatch': return { icon: '❌', text: 'Diferență mare', color: '#f97316' };
      case 'due': return { icon: '⏰', text: 'Trebuie reconciliat', color: '#eab308' };
      case 'ok': return { icon: '✅', text: 'La zi', color: '#10b981' };
      default: return { icon: '❓', text: 'Necunoscut', color: '#6b7280' };
    }
  }
  
  function startReconcile(accountId) {
    selectedAccount = accountId;
    bankBalance = '';
    reconcileDate = today();
    showForm = true;
  }
  
  function performReconciliation() {
    if (!selectedAccount || !bankBalance) {
      alert('Selectează contul și introdu soldul din bancă');
      return;
    }
    
    const account = $accounts.find(a => a.id === selectedAccount);
    if (!account) return;
    
    const appBalance = computeAccountBalance(account);
    const bankBal = parseFloat(bankBalance);
    const difference = appBalance - bankBal;
    
    // Save reconciliation
    const reconciliation = {
      id: Date.now().toString(),
      accountId: selectedAccount,
      accountName: account.name,
      date: reconcileDate,
      appBalance,
      bankBalance: bankBal,
      difference,
      status: Math.abs(difference) <= 0.01 ? 'matched' : 'unmatched',
      notes: Math.abs(difference) > 0.01 ? `Diferență: ${fmt(Math.abs(difference))} RON` : 'Perfect match'
    };
    
    reconciliations = [reconciliation, ...reconciliations];
    saveReconciliations();
    
    // Show result
    if (Math.abs(difference) <= 0.01) {
      alert(`✅ Reconciliere perfectă! Soldurile se potrivesc.`);
    } else {
      const diffText = difference > 0 ? `${fmt(difference)} RON în plus în aplicație` : `${fmt(Math.abs(difference))} RON în minus în aplicație`;
      alert(`⚠️ Diferență găsită: ${diffText}\n\nVerifică tranzacțiile din perioada recentă.`);
    }
    
    showForm = false;
    calculateDifferences();
  }
  
  function deleteReconciliation(id) {
    if (confirm('Sigur vrei să ștergi această reconciliere?')) {
      reconciliations = reconciliations.filter(r => r.id !== id);
      saveReconciliations();
      calculateDifferences();
    }
  }
  
  function exportReconciliations() {
    const csv = [
      'Data,Cont,Sold Aplicatie,Sold Banca,Diferenta,Status,Observatii',
      ...reconciliations.map(r => 
        `${r.date},${r.accountName},${r.appBalance},${r.bankBalance},${r.difference},${r.status},${r.notes}`
      )
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reconcilieri_${today()}.csv`;
    link.click();
  }
  
  // Get recent reconciliations for history
  $: recentReconciliations = reconciliations.slice(0, 10);
</script>

<div class="reconcile-container">
  <div class="header">
    <h2>🔍 Reconciliere Conturi</h2>
    <div class="header-actions">
      <button class="btn-secondary" on:click={exportReconciliations}>
        📊 Export CSV
      </button>
      <button class="btn-primary" on:click={() => showForm = !showForm}>
        {showForm ? 'Anulează' : '+ Reconciliază'}
      </button>
    </div>
  </div>
  
  <!-- Info Section -->
  <div class="info-card">
    <h3>ℹ️ Ce este reconcilierea?</h3>
    <p>Reconcilierea verifică dacă soldurile din aplicație se potrivesc cu cele din extrasele bancare. 
    Recomandăm reconcilierea săptămânală pentru acuratețe maximă.</p>
  </div>
  
  <!-- Reconciliation Form -->
  {#if showForm}
    <div class="form-card">
      <h3>Reconciliere Nouă</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Cont *</label>
          <select bind:value={selectedAccount}>
            <option value="">-- Selectează contul --</option>
            {#each $accounts as account}
              <option value={account.id}>
                {account.name} ({account.currency})
                - App: {fmt(computeAccountBalance(account))} {account.currency}
              </option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Sold din Bancă ({$accounts.find(a => a.id === selectedAccount)?.currency || 'RON'}) *</label>
          <input 
            type="number" 
            bind:value={bankBalance}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        
        <div class="form-group">
          <label>Data Reconcilierii</label>
          <input 
            type="date" 
            bind:value={reconcileDate}
          />
        </div>
      </div>
      
      {#if selectedAccount && bankBalance}
        {@const account = $accounts.find(a => a.id === selectedAccount)}
        {@const appBal = computeAccountBalance(account)}
        {@const bankBal = parseFloat(bankBalance)}
        {@const diff = appBal - bankBal}
        
        <div class="reconcile-preview">
          <h4>🔍 Previzualizare Reconciliere</h4>
          <div class="preview-grid">
            <div class="preview-item">
              <span class="label">Sold în Aplicație:</span>
              <span class="value">{fmt(appBal)} {account.currency}</span>
            </div>
            <div class="preview-item">
              <span class="label">Sold din Bancă:</span>
              <span class="value">{fmt(bankBal)} {account.currency}</span>
            </div>
            <div class="preview-item">
              <span class="label">Diferență:</span>
              <span class="value" class:positive={diff > 0} class:negative={diff < 0} class:zero={Math.abs(diff) < 0.01}>
                {Math.abs(diff) < 0.01 ? 'Perfect!' : `${fmt(Math.abs(diff))} ${account.currency} ${diff > 0 ? '(în plus în app)' : '(în minus în app)'}`}
              </span>
            </div>
          </div>
        </div>
      {/if}
      
      <div class="form-actions">
        <button class="btn-primary" on:click={performReconciliation}>
          🔍 Reconciliază
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Account Status Overview -->
  <div class="accounts-overview">
    <h3>📊 Status Conturi</h3>
    <div class="accounts-grid">
      {#each differences as diff (diff.account.id)}
        {@const statusInfo = getStatusInfo(diff.status)}
        
        <div class="account-card" class:needs-attention={diff.status !== 'ok'}>
          <div class="account-header">
            <div class="account-info">
              <h4>{diff.account.name}</h4>
              <span class="account-type">{diff.account.type} • {diff.account.currency}</span>
            </div>
            <button 
              class="btn-reconcile"
              on:click={() => startReconcile(diff.account.id)}
            >
              🔍
            </button>
          </div>
          
          <div class="balance-info">
            <div class="balance-item">
              <span class="label">Sold Curent:</span>
              <span class="value">{fmt(diff.appBalance)} {diff.account.currency}</span>
            </div>
            {#if diff.lastBankBalance}
              <div class="balance-item">
                <span class="label">Ultimul Sold Bancă:</span>
                <span class="value">{fmt(diff.lastBankBalance)} {diff.account.currency}</span>
              </div>
            {/if}
          </div>
          
          <div class="status-row">
            <div class="status" style="color: {statusInfo.color}">
              {statusInfo.icon} {statusInfo.text}
            </div>
            {#if diff.daysSinceReconcile !== null}
              <div class="days-since">
                {diff.daysSinceReconcile} zile
              </div>
            {/if}
          </div>
          
          {#if Math.abs(diff.difference) > 0.01}
            <div class="difference-alert">
              ⚠️ Diferență: {fmt(Math.abs(diff.difference))} {diff.account.currency}
            </div>
          {/if}
          
          <div class="last-reconcile">
            Ultima reconciliere: {diff.lastReconcileDate}
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Reconciliation History -->
  {#if recentReconciliations.length > 0}
    <div class="history-section">
      <h3>📈 Istoric Reconcilieri</h3>
      <div class="history-table">
        <div class="table-header">
          <div class="col-date">Data</div>
          <div class="col-account">Cont</div>
          <div class="col-balance">Sold App</div>
          <div class="col-balance">Sold Bancă</div>
          <div class="col-diff">Diferență</div>
          <div class="col-status">Status</div>
          <div class="col-actions">Acțiuni</div>
        </div>
        
        {#each recentReconciliations as reconcile (reconcile.id)}
          <div class="table-row">
            <div class="col-date">{new Date(reconcile.date).toLocaleDateString('ro-RO')}</div>
            <div class="col-account">{reconcile.accountName}</div>
            <div class="col-balance">{fmt(reconcile.appBalance)}</div>
            <div class="col-balance">{fmt(reconcile.bankBalance)}</div>
            <div class="col-diff" class:positive={reconcile.difference > 0} class:negative={reconcile.difference < 0} class:zero={Math.abs(reconcile.difference) < 0.01}>
              {Math.abs(reconcile.difference) < 0.01 ? '✅' : fmt(Math.abs(reconcile.difference))}
            </div>
            <div class="col-status">
              {reconcile.status === 'matched' ? '✅ OK' : '⚠️ Diferență'}
            </div>
            <div class="col-actions">
              <button class="delete-btn" on:click={() => deleteReconciliation(reconcile.id)}>
                🗑️
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .reconcile-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .header h2 {
    margin: 0;
    color: var(--acc);
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
  
  .info-card {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--acc);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .info-card h3 {
    margin: 0 0 8px 0;
    color: var(--acc);
    font-size: 1rem;
  }
  
  .info-card p {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .form-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .form-card h3 {
    margin: 0 0 16px 0;
    color: var(--acc);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }
  
  input, select {
    padding: 10px 12px;
    border: 1px solid #28304b;
    border-radius: 10px;
    background: var(--panel2);
    color: var(--ink);
    font-size: 14px;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--acc);
    box-shadow: 0 0 0 3px rgba(128, 184, 255, 0.1);
  }
  
  .reconcile-preview {
    background: var(--panel2);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }
  
  .reconcile-preview h4 {
    margin: 0 0 12px 0;
    color: var(--ink);
  }
  
  .preview-grid {
    display: grid;
    gap: 8px;
  }
  
  .preview-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
  }
  
  .preview-item .label {
    color: var(--muted);
  }
  
  .preview-item .value {
    font-weight: 600;
  }
  
  .value.positive {
    color: var(--err);
  }
  
  .value.negative {
    color: var(--warn);
  }
  
  .value.zero {
    color: var(--ok);
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .btn-primary, .btn-secondary {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 10px 16px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
  }
  
  .btn-primary:hover, .btn-secondary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: transparent;
    outline: 1px solid var(--acc);
    color: var(--acc);
  }
  
  .accounts-overview h3 {
    color: var(--acc);
    margin-bottom: 16px;
  }
  
  .accounts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .account-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(128, 184, 255, .2);
    transition: all 0.2s;
  }
  
  .account-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .account-card.needs-attention {
    border-color: var(--warn);
    background: linear-gradient(135deg, var(--panel) 0%, rgba(251, 191, 36, 0.05) 100%);
  }
  
  .account-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .account-info h4 {
    margin: 0;
    color: var(--ink);
    font-size: 1rem;
  }
  
  .account-type {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .btn-reconcile {
    background: var(--acc);
    color: #08131a;
    border: none;
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .btn-reconcile:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
  
  .balance-info {
    margin-bottom: 12px;
  }
  
  .balance-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.9rem;
  }
  
  .balance-item:last-child {
    margin-bottom: 0;
  }
  
  .balance-item .label {
    color: var(--muted);
  }
  
  .balance-item .value {
    font-weight: 600;
    color: var(--ink);
  }
  
  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .status {
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .days-since {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .difference-alert {
    background: rgba(251, 191, 36, 0.2);
    color: var(--warn);
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .last-reconcile {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .history-section h3 {
    color: var(--acc);
    margin-bottom: 16px;
  }
  
  .history-table {
    background: var(--panel);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .table-header, .table-row {
    display: grid;
    grid-template-columns: 100px 1fr 100px 100px 100px 80px 60px;
    gap: 12px;
    padding: 12px 16px;
    align-items: center;
  }
  
  .table-header {
    background: var(--panel2);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--muted);
  }
  
  .table-row {
    border-bottom: 1px solid rgba(128, 184, 255, .1);
    font-size: 0.9rem;
  }
  
  .table-row:last-child {
    border-bottom: none;
  }
  
  .col-account {
    font-weight: 500;
  }
  
  .col-diff.positive {
    color: var(--err);
  }
  
  .col-diff.negative {
    color: var(--warn);
  }
  
  .col-diff.zero {
    color: var(--ok);
  }
  
  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
  
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .header-actions {
      justify-content: stretch;
    }
    
    .accounts-grid {
      grid-template-columns: 1fr;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .table-header, .table-row {
      grid-template-columns: 1fr;
      gap: 8px;
      text-align: left;
    }
    
    .table-header {
      display: none;
    }
    
    .table-row {
      display: block;
      padding: 16px;
    }
    
    .col-date::before { content: "Data: "; font-weight: 600; }
    .col-account::before { content: "Cont: "; font-weight: 600; }
    .col-balance:nth-of-type(3)::before { content: "Sold App: "; font-weight: 600; }
    .col-balance:nth-of-type(4)::before { content: "Sold Bancă: "; font-weight: 600; }
    .col-diff::before { content: "Diferență: "; font-weight: 600; }
    .col-status::before { content: "Status: "; font-weight: 600; }
  }
</style>