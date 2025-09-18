<script>
  import { onMount } from 'svelte';

  let pantryItems = [];
  let newItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', expiryDate: '' };
  let showAddForm = false;

  const categories = [
    'diverse', 'legume', 'fructe', 'lactate', 'carne', 'cereale',
    'conserve', 'condimente', 'dulciuri', 'bauturi'
  ];

  const units = ['buc', 'kg', 'g', 'l', 'ml', 'cutii', 'pachete'];

  onMount(() => {
    loadPantryData();
  });

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

  function savePantryData() {
    localStorage.setItem('groceryInventory', JSON.stringify(pantryItems));
  }

  function addItem() {
    if (!newItem.name.trim()) return;

    const item = {
      id: Date.now(),
      ...newItem,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    pantryItems = [...pantryItems, item];
    savePantryData();

    // Reset form
    newItem = { name: '', quantity: 1, unit: 'buc', category: 'diverse', expiryDate: '' };
    showAddForm = false;
  }

  function removeItem(id) {
    pantryItems = pantryItems.filter(item => item.id !== id);
    savePantryData();
  }

  function updateQuantity(id, delta) {
    pantryItems = pantryItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    savePantryData();
  }

  function isExpiringSoon(expiryDate) {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    return expiry <= threeDaysFromNow;
  }

  function isExpired(expiryDate) {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  }

  $: itemsByCategory = pantryItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  $: expiringItems = pantryItems.filter(item => isExpiringSoon(item.expiryDate));
  $: expiredItems = pantryItems.filter(item => isExpired(item.expiryDate));
</script>

<style>
  .pantry-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  .pantry-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pantry-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #333);
  }

  .add-button {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s;
  }

  .add-button:hover {
    background: #059669;
  }

  .add-form {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-weight: 600;
    color: var(--text-primary, #333);
  }

  .form-group input,
  .form-group select {
    padding: 0.5rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    background: var(--bg-primary, white);
    color: var(--text-primary, #333);
  }

  .form-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #333);
    border: 1px solid var(--border-color, #ddd);
  }

  .btn-secondary:hover {
    background: var(--border-color, #e5e7eb);
  }

  .categories-grid {
    display: grid;
    gap: 2rem;
  }

  .category-section {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid var(--border-color, #e0e0e0);
  }

  .category-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    text-transform: capitalize;
    color: var(--text-primary, #333);
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .item-card {
    background: var(--bg-secondary, #f9f9f9);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid var(--border-color, #e0e0e0);
    position: relative;
  }

  .item-card.expiring {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .item-card.expired {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .item-name {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #333);
  }

  .item-details {
    font-size: 0.875rem;
    color: var(--text-secondary, #666);
    margin-bottom: 0.5rem;
  }

  .item-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-btn {
    background: var(--bg-primary, white);
    border: 1px solid var(--border-color, #ddd);
    width: 2rem;
    height: 2rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .quantity-btn:hover {
    background: var(--border-color, #e5e7eb);
  }

  .remove-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.75rem;
  }

  .remove-btn:hover {
    background: #dc2626;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary, #666);
  }

  .alerts {
    margin-bottom: 2rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid #f59e0b;
    color: #92400e;
  }

  .alert-danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #991b1b;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .items-grid {
      grid-template-columns: 1fr;
    }

    .pantry-header {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>

<div class="pantry-container">
  <div class="pantry-header">
    <h1 class="pantry-title">
      <span>🛒</span>
      Pantry Management
    </h1>
    <button class="add-button" on:click={() => showAddForm = !showAddForm}>
      <span>➕</span>
      Add Item
    </button>
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Items</div>
      <div class="stat-value">{pantryItems.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Categories</div>
      <div class="stat-value">{Object.keys(itemsByCategory).length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expiring Soon</div>
      <div class="stat-value">{expiringItems.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expired</div>
      <div class="stat-value">{expiredItems.length}</div>
    </div>
  </div>

  <!-- Alerts -->
  {#if expiredItems.length > 0 || expiringItems.length > 0}
    <div class="alerts">
      {#if expiredItems.length > 0}
        <div class="alert alert-danger">
          ⚠️ {expiredItems.length} item(s) have expired: {expiredItems.map(item => item.name).join(', ')}
        </div>
      {/if}
      {#if expiringItems.length > 0}
        <div class="alert alert-warning">
          ⏰ {expiringItems.length} item(s) expiring soon: {expiringItems.map(item => item.name).join(', ')}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Add Item Form -->
  {#if showAddForm}
    <div class="add-form">
      <div class="form-grid">
        <div class="form-group">
          <label for="itemName">Item Name</label>
          <input
            id="itemName"
            type="text"
            bind:value={newItem.name}
            placeholder="Enter item name"
          />
        </div>
        <div class="form-group">
          <label for="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            bind:value={newItem.quantity}
            min="1"
          />
        </div>
        <div class="form-group">
          <label for="unit">Unit</label>
          <select id="unit" bind:value={newItem.unit}>
            {#each units as unit}
              <option value={unit}>{unit}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="category">Category</label>
          <select id="category" bind:value={newItem.category}>
            {#each categories as category}
              <option value={category}>{category}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="expiryDate">Expiry Date</label>
          <input
            id="expiryDate"
            type="date"
            bind:value={newItem.expiryDate}
          />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" on:click={addItem}>Add Item</button>
        <button class="btn btn-secondary" on:click={() => showAddForm = false}>Cancel</button>
      </div>
    </div>
  {/if}

  <!-- Items by Category -->
  {#if pantryItems.length === 0}
    <div class="empty-state">
      <h3>No items in pantry</h3>
      <p>Add your first item to get started!</p>
    </div>
  {:else}
    <div class="categories-grid">
      {#each Object.entries(itemsByCategory) as [category, items]}
        <div class="category-section">
          <h3 class="category-title">{category} ({items.length})</h3>
          <div class="items-grid">
            {#each items as item}
              <div class="item-card" class:expiring={isExpiringSoon(item.expiryDate)} class:expired={isExpired(item.expiryDate)}>
                <div class="item-name">{item.name}</div>
                <div class="item-details">
                  {item.quantity} {item.unit}
                  {#if item.expiryDate}
                    <br>Expires: {item.expiryDate}
                  {/if}
                  {#if item.dateAdded}
                    <br>Added: {item.dateAdded}
                  {/if}
                </div>
                <div class="item-actions">
                  <div class="quantity-controls">
                    <button class="quantity-btn" on:click={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button class="quantity-btn" on:click={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <button class="remove-btn" on:click={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>