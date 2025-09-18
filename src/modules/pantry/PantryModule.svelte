<script>
  import { onMount } from 'svelte';

  // Import Pantry components
  import GroceryDashboard from '../../components/GroceryDashboard.svelte';
  import ReceiptParser from '../../components/ReceiptParser.svelte';

  let activeTab = 'inventory';
  let isLoading = false;

  let pantryItems = [];
  let shoppingList = [];
  let priceHistory = [];

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'shopping', label: 'Shopping List', icon: '🛒' },
    { id: 'receipt', label: 'Receipt Parser', icon: '🧾' },
    { id: 'trends', label: 'Price Trends', icon: '📈' }
  ];

  const categories = [
    'diverse', 'legume', 'fructe', 'lactate', 'carne', 'cereale',
    'conserve', 'condimente', 'dulciuri', 'bauturi'
  ];

  const units = ['buc', 'kg', 'g', 'l', 'ml', 'cutii', 'pachete'];

  let newItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', expiryDate: '' };
  let showAddForm = false;

  let newShoppingItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', estimatedPrice: 0 };
  let showShoppingForm = false;

  onMount(() => {
    console.log('🛒 Pantry Module loaded');
    loadPantryData();
    loadShoppingList();
    // Load saved tab preference
    const savedTab = localStorage.getItem('pantryActiveTab');
    if (savedTab) {
      activeTab = savedTab;
    }
  });

  function switchTab(tabId) {
    activeTab = tabId;
    localStorage.setItem('pantryActiveTab', tabId);
  }

  function loadPantryData() {
    const stored = localStorage.getItem('groceryInventory');
    if (stored) {
      try {
        pantryItems = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading pantry data:', e);
        pantryItems = [];
      }
    }
  }

  function loadShoppingList() {
    const stored = localStorage.getItem('shoppingList');
    if (stored) {
      try {
        shoppingList = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading shopping list:', e);
        shoppingList = [];
      }
    }
  }

  function savePantryData() {
    localStorage.setItem('groceryInventory', JSON.stringify(pantryItems));
  }

  function saveShoppingList() {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }

  function addItem() {
    if (newItem.name.trim()) {
      pantryItems = [...pantryItems, {
        ...newItem,
        id: Date.now(),
        addedDate: new Date().toISOString()
      }];
      savePantryData();
      newItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', expiryDate: '' };
      showAddForm = false;
    }
  }

  function removeItem(id) {
    pantryItems = pantryItems.filter(item => item.id !== id);
    savePantryData();
  }

  function addShoppingItem() {
    if (newShoppingItem.name.trim()) {
      shoppingList = [...shoppingList, {
        ...newShoppingItem,
        id: Date.now(),
        checked: false,
        addedDate: new Date().toISOString()
      }];
      saveShoppingList();
      newShoppingItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', estimatedPrice: 0 };
      showShoppingForm = false;
    }
  }

  function toggleShoppingItem(id) {
    shoppingList = shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveShoppingList();
  }

  function removeShoppingItem(id) {
    shoppingList = shoppingList.filter(item => item.id !== id);
    saveShoppingList();
  }
</script>

<div class="pantry-container">
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div>Se încarcă...</div>
    </div>
  {:else}
    <!-- Module Header -->
    <div class="module-header">
      <h1 class="module-title">
        <span>🛒</span>
        Pantry Management
      </h1>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      {#each tabs as tab}
        <button
          class="tab-button"
          class:active={activeTab === tab.id}
          on:click={() => switchTab(tab.id)}
        >
          <span class="tab-icon">{tab.icon}</span>
          <span class="tab-name">{tab.label}</span>
        </button>
      {/each}
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      {#if activeTab === 'inventory'}
        <div class="inventory-section">
          <div class="section-header">
            <h3>📦 Inventory Management</h3>
            <button class="add-button" on:click={() => showAddForm = !showAddForm}>
              ➕ Add Item
            </button>
          </div>

          {#if showAddForm}
            <div class="add-form">
              <input bind:value={newItem.name} placeholder="Product name" />
              <input type="number" bind:value={newItem.quantity} min="1" />
              <select bind:value={newItem.unit}>
                {#each units as unit}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
              <select bind:value={newItem.category}>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
              <input type="date" bind:value={newItem.expiryDate} />
              <button on:click={addItem}>Add</button>
              <button on:click={() => showAddForm = false}>Cancel</button>
            </div>
          {/if}

          <div class="items-grid">
            {#each pantryItems as item}
              <div class="item-card">
                <h4>{item.name}</h4>
                <p>{item.quantity} {item.unit}</p>
                <p class="category">{item.category}</p>
                {#if item.expiryDate}
                  <p class="expiry">Expires: {item.expiryDate}</p>
                {/if}
                <button class="remove-btn" on:click={() => removeItem(item.id)}>🗑️</button>
              </div>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'shopping'}
        <div class="shopping-section">
          <div class="section-header">
            <h3>🛒 Shopping List</h3>
            <button class="add-button" on:click={() => showShoppingForm = !showShoppingForm}>
              ➕ Add Item
            </button>
          </div>

          {#if showShoppingForm}
            <div class="add-form">
              <input bind:value={newShoppingItem.name} placeholder="Product name" />
              <input type="number" bind:value={newShoppingItem.quantity} min="1" />
              <select bind:value={newShoppingItem.unit}>
                {#each units as unit}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
              <select bind:value={newShoppingItem.category}>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
              <input type="number" bind:value={newShoppingItem.estimatedPrice} step="0.01" placeholder="Estimated price" />
              <button on:click={addShoppingItem}>Add</button>
              <button on:click={() => showShoppingForm = false}>Cancel</button>
            </div>
          {/if}

          <div class="shopping-list">
            {#each shoppingList as item}
              <div class="shopping-item" class:checked={item.checked}>
                <input type="checkbox" checked={item.checked} on:change={() => toggleShoppingItem(item.id)} />
                <span class="item-name">{item.name}</span>
                <span class="item-quantity">{item.quantity} {item.unit}</span>
                <span class="item-price">{item.estimatedPrice} RON</span>
                <button class="remove-btn" on:click={() => removeShoppingItem(item.id)}>🗑️</button>
              </div>
            {/each}
          </div>
        </div>

      {:else if activeTab === 'receipt'}
        <div class="receipt-section">
          <h3>🧾 Receipt Parser</h3>
          <ReceiptParser />
        </div>

      {:else if activeTab === 'trends'}
        <div class="trends-section">
          <h3>📈 Price Trends</h3>
          <div class="trends-placeholder">
            <p>📊 Price tracking coming soon...</p>
            <p>Monitor product prices over time and get alerts for deals.</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .pantry-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .module-header {
    margin-bottom: 2rem;
  }

  .module-title {
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }

  .tab-navigation {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    border-bottom: 2px solid var(--border-color);
    overflow-x: auto;
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
  }

  .tab-button:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .tab-button.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
    background: rgba(59, 130, 246, 0.1);
  }

  .tab-icon {
    font-size: 1.2rem;
  }

  .tab-content {
    min-height: 400px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.5rem;
  }

  .add-button {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  .add-form {
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .add-form input,
  .add-form select {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .add-form button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
  }

  .add-form button:first-of-type {
    background: var(--accent-color);
    color: white;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .item-card {
    background: var(--bg-secondary);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    position: relative;
  }

  .item-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .item-card p {
    margin: 0.25rem 0;
    color: var(--text-secondary);
  }

  .category {
    font-size: 0.9rem;
    text-transform: capitalize;
  }

  .expiry {
    font-size: 0.8rem;
    color: var(--warning);
  }

  .remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
  }

  .shopping-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .shopping-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
  }

  .shopping-item.checked {
    opacity: 0.6;
  }

  .shopping-item.checked .item-name {
    text-decoration: line-through;
  }

  .item-name {
    flex: 1;
    font-weight: 500;
  }

  .item-quantity,
  .item-price {
    color: var(--text-secondary);
  }

  .trends-placeholder {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>