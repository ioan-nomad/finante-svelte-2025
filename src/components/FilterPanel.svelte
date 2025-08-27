<!-- src/components/FilterPanel.svelte -->
<script>
  import { 
    accounts, 
    transactions,
    CATEGORIES,
    currentMonth
  } from '../lib/store.js';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // Filter properties
  export let filters = {
    type: 'all',
    account: 'all',
    category: 'all',
    month: currentMonth(),
    dateStart: '',
    dateEnd: '',
    person: 'all',
    minAmount: '',
    maxAmount: '',
    description: ''
  };

  // All unique categories from transactions
  $: allCategories = [...new Set([
    ...CATEGORIES.expense, 
    ...CATEGORIES.income, 
    ...CATEGORIES.transfer
  ])];

  // All unique persons from transactions
  $: allPersons = [...new Set(
    $transactions
      .map(t => t.person)
      .filter(p => p && p.trim())
  )];

  // Reactive updates - dispatch when filters change
  $: dispatch('filtersChanged', filters);

  function resetFilters() {
    filters = {
      type: 'all',
      account: 'all',
      category: 'all',
      month: currentMonth(),
      dateStart: '',
      dateEnd: '',
      person: 'all',
      minAmount: '',
      maxAmount: '',
      description: ''
    };
  }

  function applyCommonFilters(period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'thisMonth':
        filters.month = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        filters.dateStart = '';
        filters.dateEnd = '';
        break;
      case 'lastMonth':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        filters.month = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}`;
        filters.dateStart = '';
        filters.dateEnd = '';
        break;
      case 'thisYear':
        filters.month = '';
        filters.dateStart = `${currentYear}-01-01`;
        filters.dateEnd = `${currentYear}-12-31`;
        break;
      case 'last3Months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filters.month = '';
        filters.dateStart = threeMonthsAgo.toISOString().slice(0, 10);
        filters.dateEnd = now.toISOString().slice(0, 10);
        break;
    }
  }
</script>

<div class="filter-panel">
  <div class="panel-header">
    <h3>🔍 Filtre Avansate</h3>
    <div class="panel-actions">
      <button class="btn ghost" on:click={resetFilters}>
        ↺ Reset
      </button>
    </div>
  </div>

  <div class="filter-groups">
    <!-- Basic Filters -->
    <div class="filter-group">
      <h4>Filtre de bază</h4>
      <div class="filter-row">
        <div class="filter-item">
          <label>Tip tranzacție</label>
          <select bind:value={filters.type}>
            <option value="all">Toate</option>
            <option value="income">Venituri</option>
            <option value="expense">Cheltuieli</option>
            <option value="transfer">Transferuri</option>
          </select>
        </div>
        
        <div class="filter-item">
          <label>Cont</label>
          <select bind:value={filters.account}>
            <option value="all">Toate</option>
            {#each $accounts as acc}
              <option value={acc.id}>{acc.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-item">
          <label>Categorie</label>
          <select bind:value={filters.category}>
            <option value="all">Toate</option>
            {#each allCategories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>
        
        <div class="filter-item">
          <label>Persoană</label>
          <select bind:value={filters.person}>
            <option value="all">Toate</option>
            {#each allPersons as person}
              <option value={person}>{person}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Date Filters -->
    <div class="filter-group">
      <h4>Filtre temporale</h4>
      <div class="quick-periods">
        <button class="btn small" on:click={() => applyCommonFilters('thisMonth')}>
          Luna aceasta
        </button>
        <button class="btn small" on:click={() => applyCommonFilters('lastMonth')}>
          Luna trecută
        </button>
        <button class="btn small" on:click={() => applyCommonFilters('last3Months')}>
          Ultimele 3 luni
        </button>
        <button class="btn small" on:click={() => applyCommonFilters('thisYear')}>
          Anul acesta
        </button>
      </div>
      
      <div class="filter-row">
        <div class="filter-item">
          <label>Luna</label>
          <input 
            bind:value={filters.month} 
            type="month"
            on:input={() => { filters.dateStart = ''; filters.dateEnd = ''; }}
          />
        </div>
        
        <div class="filter-item">
          <label>Data început</label>
          <input 
            bind:value={filters.dateStart} 
            type="date"
            on:input={() => filters.month = ''}
          />
        </div>
        
        <div class="filter-item">
          <label>Data sfârșit</label>
          <input 
            bind:value={filters.dateEnd} 
            type="date"
            on:input={() => filters.month = ''}
          />
        </div>
      </div>
    </div>

    <!-- Amount & Description Filters -->
    <div class="filter-group">
      <h4>Filtre sume și descriere</h4>
      <div class="filter-row">
        <div class="filter-item">
          <label>Suma minimă</label>
          <input 
            bind:value={filters.minAmount} 
            type="number" 
            step="0.01" 
            placeholder="0.00"
          />
        </div>
        
        <div class="filter-item">
          <label>Suma maximă</label>
          <input 
            bind:value={filters.maxAmount} 
            type="number" 
            step="0.01" 
            placeholder="999999.99"
          />
        </div>
        
        <div class="filter-item">
          <label>Descriere conține</label>
          <input 
            bind:value={filters.description} 
            type="text" 
            placeholder="ex: supermarket, benzină..."
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .filter-panel {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .panel-header h3 {
    margin: 0;
    color: var(--acc);
    font-size: 1rem;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
  }

  .filter-groups {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .filter-group {
    background: var(--panel2);
    border-radius: 12px;
    padding: 14px;
  }

  .filter-group h4 {
    margin: 0 0 12px 0;
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .filter-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    align-items: end;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .filter-item label {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .quick-periods {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  input, select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #28304b;
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  input:focus, select:focus {
    outline: none;
    border-color: var(--acc);
    box-shadow: 0 0 0 2px rgba(128, 184, 255, 0.15);
  }

  .btn {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 8px;
    padding: 8px 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .btn.ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid #2a3354;
  }

  .btn.ghost:hover {
    color: var(--ink);
    border-color: var(--acc);
  }

  .btn.small {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    .panel-header {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .filter-row {
      grid-template-columns: 1fr;
    }

    .quick-periods {
      justify-content: center;
    }
  }
</style>