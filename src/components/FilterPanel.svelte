<script>
  import { createEventDispatcher } from 'svelte'
  
  export let categories = []
  export let accounts = []
  
  const dispatch = createEventDispatcher()
  
  // State filtre
  let startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  let endDate = new Date().toISOString().split('T')[0]
  let selectedCategories = []
  let selectedAccounts = []
  let selectedType = 'all'
  let selectedPerson = 'all'
  let granularity = 'month'
  
  // Emit changes
  function handleFilterChange() {
    dispatch('filterChange', {
      startDate,
      endDate,
      selectedCategories,
      selectedAccounts,
      selectedType,
      selectedPerson,
      granularity
    })
  }
  
  // Watch for changes
  $: startDate, endDate, selectedCategories, selectedAccounts, selectedType, selectedPerson, granularity, handleFilterChange()
  
  function toggleCategory(cat) {
    if (selectedCategories.includes(cat)) {
      selectedCategories = selectedCategories.filter(c => c !== cat)
    } else {
      selectedCategories = [...selectedCategories, cat]
    }
  }
  
  function selectAllCategories() {
    selectedCategories = categories.map(c => c.name)
  }
  
  function clearCategories() {
    selectedCategories = []
  }
  
  // Quick date presets
  function setThisMonth() {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  }
  
  function setLastMonth() {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  }
  
  function setThisYear() {
    const year = new Date().getFullYear()
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
  }
  
  function setLastYear() {
    const year = new Date().getFullYear() - 1
    startDate = `${year}-01-01`
    endDate = `${year}-12-31`
  }
</script>

<div class="filter-panel">
  <!-- Date Section -->
  <div class="filter-section">
    <h4>📅 Perioadă</h4>
    
    <div class="date-inputs">
      <input type="date" bind:value={startDate} />
      <span>→</span>
      <input type="date" bind:value={endDate} />
    </div>
    
    <div class="date-presets">
      <button on:click={setThisMonth}>Luna asta</button>
      <button on:click={setLastMonth}>Luna trecută</button>
      <button on:click={setThisYear}>Anul ăsta</button>
      <button on:click={setLastYear}>Anul trecut</button>
      <button class="reset-btn" on:click={resetAllFilters}>🔄 Resetează tot</button>
     }
      function resetAllFilters() {
       startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
       endDate = new Date().toISOString().split('T')[0]
       selectedCategories = []
       selectedAccounts = []
       selectedType = 'all'
       selectedPerson = 'all'
       granularity = 'month'
     }
    </div>
    
    <div class="granularity">
      <label>Granularitate:</label>
      <select bind:value={granularity}>
        <option value="day">Zilnic</option>
        <option value="week">Săptămânal</option>
        <option value="month">Lunar</option>
        <option value="quarter">Trimestrial</option>
        <option value="year">Anual</option>
      </select>
    </div>
  </div>
  
  <!-- Type & Person -->
  <div class="filter-section">
    <h4>🔍 Tip & Persoană</h4>
    
    <div class="filter-row">
      <div class="filter-group">
        <label>Tip tranzacție:</label>
        <select bind:value={selectedType}>
          <option value="all">Toate</option>
          <option value="income">Venituri</option>
          <option value="expense">Cheltuieli</option>
          <option value="transfer">Transferuri</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Persoană:</label>
        <select bind:value={selectedPerson}>
          <option value="all">Toate</option>
          <option value="Ioan">Ioan</option>
          <option value="Nico">Nico</option>
          <option value="Comun">Comun</option>
          <option value="Firmă Nico">Firmă Nico</option>
        </select>
      </div>
    </div>
  </div>
  
  <!-- Categories -->
  <div class="filter-section">
    <h4>🏷️ Categorii ({selectedCategories.length}/{categories.length})</h4>
    
    <div class="category-actions">
      <button on:click={selectAllCategories}>Toate</button>
      <button on:click={clearCategories}>Niciuna</button>
    </div>
    
    <div class="category-grid">
      {#each categories as cat}
        <label class="category-item">
          <input 
            type="checkbox" 
            checked={selectedCategories.includes(cat.name)}
            on:change={() => toggleCategory(cat.name)}
          />
          <span 
            class="category-label"
            style="background: {cat.color}20; color: {cat.color}"
          >
            {cat.name}
          </span>
        </label>
      {/each}
    </div>
  </div>
  
  <!-- Accounts -->
  {#if accounts && accounts.length > 0}
    <div class="filter-section">
      <h4>💳 Conturi</h4>
      
      <div class="accounts-list">
        {#each accounts as acc}
          <label class="account-item">
            <input 
              type="checkbox"
              checked={selectedAccounts.includes(acc.id)}
              on:change={(e) => {
                if (e.target.checked) {
                  selectedAccounts = [...selectedAccounts, acc.id]
                } else {
                  selectedAccounts = selectedAccounts.filter(id => id !== acc.id)
                }
              }}
            />
            <span>{acc.name}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .filter-panel {
    background: var(--bg-primary, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .filter-section {
    margin-bottom: 24px;
  }
  
  .filter-section:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    margin: 0 0 12px 0;
    color: var(--text-primary, #333);
    font-size: 1rem;
  }
  
  .date-inputs {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .date-inputs input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    background: var(--input-bg, white);
  }
  
  .date-presets {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }
  
  .date-presets button,
  .category-actions button {
    padding: 6px 12px;
    background: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }
  
  .date-presets button:hover,
  .category-actions button:hover {
    background: var(--primary, #3b82f6);
    color: white;
    border-color: var(--primary, #3b82f6);
  }
  
  .granularity {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .granularity label {
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }
  
  select {
    padding: 6px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: var(--input-bg, white);
    cursor: pointer;
  }
  
  .filter-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }
  
  .category-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }
  
  .category-item,
  .account-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  
  .category-item input,
  .account-item input {
    cursor: pointer;
  }
  
  .category-label {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .accounts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  /* Dark mode */
  :global(body.dark) .filter-panel {
    background: #1a1a1a;
  }
  
  :global(body.dark) .date-presets button,
  :global(body.dark) .category-actions button {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  :global(body.dark) input,
  :global(body.dark) select {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .filter-row {
      grid-template-columns: 1fr;
    }
    
    .date-presets {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }
  .reset-btn {
  margin-top: 12px;
  width: 100%;
  background: #ef4444;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #dc2626;
}
</style>