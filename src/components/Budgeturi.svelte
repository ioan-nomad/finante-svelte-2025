<!-- components/Budgeturi.svelte -->
<script>
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { transactions, CATEGORIES, CATEGORY_COLORS, fmt, currentMonth, today } from '../lib/store.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  // Budget store
  const budgets = writable([]);
  
  // Current month data
  $: currentMonthData = getCurrentMonthSpending($transactions);
  
  // Form state
  let showForm = false;
  let budgetForm = {
    category: '',
    amount: '',
    month: currentMonth(),
    alert: 80 // Alert at 80%
  };
  
  // Notifications
  let notifications = [];
  
  onMount(() => {
    loadBudgets();
    checkBudgetAlerts();
  });
  
  function loadBudgets() {
    const stored = localStorage.getItem('fs_budgets');
    if (stored) {
      budgets.set(JSON.parse(stored));
    }
  }
  
  function saveBudgets(budgetList) {
    budgets.set(budgetList);
    localStorage.setItem('fs_budgets', JSON.stringify(budgetList));
  }
  
  function getCurrentMonthSpending(txs) {
    const current = currentMonth();
    const monthTx = txs.filter(t => 
      t.type === 'expense' && 
      t.date && 
      t.date.startsWith(current)
    );
    
    const byCategory = {};
    monthTx.forEach(t => {
      const cat = t.category || 'Altele';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    });
    
    return byCategory;
  }
  
  function addBudget() {
    if (!budgetForm.category || !budgetForm.amount || parseFloat(budgetForm.amount) <= 0) {
      alert('Completează toate câmpurile obligatorii');
      return;
    }
    
    budgets.update(list => {
      // Remove existing budget for same category/month
      const filtered = list.filter(b => 
        !(b.category === budgetForm.category && b.month === budgetForm.month)
      );
      
      // Add new budget
      filtered.push({
        id: Date.now().toString(),
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
        month: budgetForm.month,
        alert: budgetForm.alert,
        createdAt: today()
      });
      
      saveBudgets(filtered);
      return filtered;
    });
    
    // Reset form
    budgetForm = {
      category: '',
      amount: '',
      month: currentMonth(),
      alert: 80
    };
    showForm = false;
    
    checkBudgetAlerts();
  }
  
  function deleteBudget(id) {
    budgets.update(list => {
      const filtered = list.filter(b => b.id !== id);
      saveBudgets(filtered);
      return filtered;
    });
  }
  
  function checkBudgetAlerts() {
    const current = currentMonth();
    const alerts = [];
    
    $budgets.forEach(budget => {
      if (budget.month === current) {
        const spent = currentMonthData[budget.category] || 0;
        const percentage = (spent / budget.amount) * 100;
        
        if (percentage >= budget.alert) {
          alerts.push({
            category: budget.category,
            spent,
            budget: budget.amount,
            percentage: percentage.toFixed(1)
          });
        }
      }
    });
    
    notifications = alerts;
  }
  
  function getBudgetProgress(category, budgetAmount) {
    const spent = currentMonthData[category] || 0;
    const percentage = Math.min((spent / budgetAmount) * 100, 100);
    return {
      spent,
      percentage,
      remaining: Math.max(budgetAmount - spent, 0),
      isOver: spent > budgetAmount
    };
  }
  
  function getProgressColor(percentage, isOver) {
    if (isOver) return '#ef4444';
    if (percentage >= 90) return '#f97316';
    if (percentage >= 75) return '#eab308';
    return '#10b981';
  }
  
  // Current month budgets
  $: currentBudgets = $budgets.filter(b => b.month === currentMonth());
  
  // Expense categories for budget creation
  const expenseCategories = CATEGORIES.expense || [];
</script>

<div class="budgets-container">
  <div class="header">
    <h2>💰 Budgeturi Lunare</h2>
    <button class="btn-primary" on:click={() => showForm = !showForm}>
      {showForm ? 'Anulează' : '+ Adaugă Budget'}
    </button>
  </div>
  
  <!-- Notifications -->
  {#if notifications.length > 0}
    <div class="notifications">
      <h3>🚨 Alerte Budget</h3>
      {#each notifications as alert}
        <div class="notification warning">
          <strong>{alert.category}</strong>: Ai cheltuit {fmt(alert.spent)} RON din {fmt(alert.budget)} RON ({alert.percentage}%)
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Add Budget Form -->
  {#if showForm}
    <div class="form-card">
      <h3>Adaugă Budget Nou</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Categorie *</label>
          <select bind:value={budgetForm.category}>
            <option value="">-- Selectează categoria --</option>
            {#each expenseCategories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Suma Budgetată (RON) *</label>
          <input 
            type="number" 
            bind:value={budgetForm.amount}
            placeholder="0.00"
            step="0.01"
            min="0.01"
          />
        </div>
        
        <div class="form-group">
          <label>Luna</label>
          <input 
            type="month" 
            bind:value={budgetForm.month}
          />
        </div>
        
        <div class="form-group">
          <label>Alertă la % ({budgetForm.alert}%)</label>
          <input 
            type="range" 
            bind:value={budgetForm.alert}
            min="50"
            max="100"
            step="5"
          />
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-primary" on:click={addBudget}>
          💾 Salvează Budget
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Current Month Budgets -->
  <div class="budgets-grid">
    <h3>📊 Budgeturi {currentMonth()}</h3>
    
    {#if currentBudgets.length === 0}
      <div class="empty-state">
        <p>Nu ai budgeturi stabilite pentru luna curentă</p>
        <button class="btn-secondary" on:click={() => showForm = true}>
          Adaugă primul tău budget
        </button>
      </div>
    {:else}
      {#each currentBudgets as budget (budget.id)}
        {@const progress = getBudgetProgress(budget.category, budget.amount)}
        {@const color = getProgressColor(progress.percentage, progress.isOver)}
        
        <div class="budget-card">
          <div class="budget-header">
            <div class="category-info">
              <span 
                class="category-badge" 
                style="background-color: {CATEGORY_COLORS[budget.category]}20; color: {CATEGORY_COLORS[budget.category]}"
              >
                {budget.category}
              </span>
              <button 
                class="delete-btn" 
                on:click={() => deleteBudget(budget.id)}
                title="Șterge budget"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="budget-amounts">
            <div class="amount-row">
              <span class="label">Cheltuit:</span>
              <span class="amount spent" style="color: {color}">
                {fmt(progress.spent)} RON
              </span>
            </div>
            <div class="amount-row">
              <span class="label">Budget:</span>
              <span class="amount budget">
                {fmt(budget.amount)} RON
              </span>
            </div>
            <div class="amount-row">
              <span class="label">Rămas:</span>
              <span class="amount remaining" class:negative={progress.isOver}>
                {progress.isOver ? '-' : ''}{fmt(Math.abs(progress.remaining))} RON
              </span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div class="progress-track">
              <div 
                class="progress-fill" 
                style="width: {Math.min(progress.percentage, 100)}%; background-color: {color}"
              ></div>
            </div>
            <div class="progress-text">
              {progress.percentage.toFixed(1)}%
              {#if progress.isOver}
                <span class="over-budget">DEPĂȘIT!</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
  
  <!-- Budget History -->
  {#if $budgets.filter(b => b.month !== currentMonth()).length > 0}
    <div class="budget-history">
      <h3>📈 Istoric Budgeturi</h3>
      <div class="history-list">
        {#each $budgets.filter(b => b.month !== currentMonth()).sort((a,b) => b.month.localeCompare(a.month)) as budget (budget.id)}
          <div class="history-item">
            <div class="history-info">
              <strong>{budget.category}</strong>
              <span class="month">{budget.month}</span>
            </div>
            <div class="history-amount">
              {fmt(budget.amount)} RON
            </div>
            <button 
              class="delete-btn small" 
              on:click={() => deleteBudget(budget.id)}
            >
              🗑️
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .budgets-container {
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
  
  .notifications {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid var(--warn);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }
  
  .notifications h3 {
    margin: 0 0 12px 0;
    color: var(--warn);
    font-size: 1rem;
  }
  
  .notification {
    padding: 8px 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 0.9rem;
  }
  
  .notification.warning {
    background: rgba(251, 191, 36, 0.2);
    color: var(--warn);
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  
  .budgets-grid h3, .budget-history h3 {
    color: var(--acc);
    margin-bottom: 16px;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    background: var(--panel);
    border-radius: 14px;
    color: var(--muted);
  }
  
  .empty-state p {
    margin-bottom: 16px;
  }
  
  .budget-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .category-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .category-badge {
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
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
  
  .delete-btn.small {
    font-size: 0.8rem;
  }
  
  .budget-amounts {
    margin-bottom: 16px;
  }
  
  .amount-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .amount-row:last-child {
    margin-bottom: 0;
  }
  
  .label {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .amount {
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  .amount.spent {
    /* Color set dynamically */
  }
  
  .amount.budget {
    color: var(--ink);
  }
  
  .amount.remaining {
    color: var(--ok);
  }
  
  .amount.remaining.negative {
    color: var(--err);
  }
  
  .progress-bar {
    margin-top: 16px;
  }
  
  .progress-track {
    width: 100%;
    height: 8px;
    background: var(--panel2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .over-budget {
    color: var(--err);
    font-weight: 600;
    font-size: 0.8rem;
  }
  
  .budget-history {
    margin-top: 32px;
  }
  
  .history-list {
    background: var(--panel);
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(128, 184, 255, .1);
  }
  
  .history-item:last-child {
    border-bottom: none;
  }
  
  .history-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .history-info strong {
    color: var(--ink);
  }
  
  .month {
    font-size: 0.85rem;
    color: var(--muted);
  }
  
  .history-amount {
    font-weight: 600;
    color: var(--acc);
  }
  
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .amount-row {
      font-size: 0.9rem;
    }
    
    .history-item {
      padding: 12px 16px;
    }
  }
</style>