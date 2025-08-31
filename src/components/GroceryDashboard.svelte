<script>
  import { groceryInventory, totalInventoryValue, lowStockItems } from '../stores/groceryStore.js';
  import { onMount, onDestroy } from 'svelte';
  import { debounce } from '../lib/utils.js';
  // Import camera scanner
  import CameraScanner from './CameraScanner.svelte';
  
  let inventory = {};
  let priceHistory = {};
  let receipts = [];
  let totalValue = 0;
  let lowStock = [];
  let selectedItem = null;
  let searchTerm = '';
  let showPriceHistory = false;
  let selectedItemAnalytics = null;
  
  let resizeListener;
  
  // Debounce pentru search
  const debouncedSearch = debounce((term) => {
    searchTerm = term;
  }, 300);

  // Adaugă variabilă pentru camera scanner
  let showCameraScanner = false;

  onMount(() => {
    groceryInventory.loadFromStorage();
    
    // Add resize listener with cleanup
    resizeListener = () => {
      // resize logic if needed
    };
    window.addEventListener('resize', resizeListener);
  });

  onDestroy(() => {
    if (resizeListener) {
      window.removeEventListener('resize', resizeListener);
    }
  });
  
  $: inventory = $groceryInventory.inventory;
  $: priceHistory = $groceryInventory.priceHistory;
  $: receipts = $groceryInventory.receipts;
  $: totalValue = $totalInventoryValue;
  $: lowStock = $lowStockItems;
  
  $: filteredInventory = Object.entries(inventory).filter(([key, item]) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculează statistici
  $: totalProducts = Object.keys(inventory).length;
  $: totalReceipts = receipts.length;
  $: thisMonthExpenses = calculateMonthExpenses();
  
  function calculateMonthExpenses() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return groceryInventory.getExpensesByPeriod(
      startOfMonth.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    );
  }
  
  function viewPriceHistory(item) {
    selectedItem = item;
    selectedItemAnalytics = groceryInventory.getPriceAnalytics(item.name);
    showPriceHistory = true;
  }
  
  function consumeItem(item) {
    const quantity = prompt(`Câte ${item.unit} din ${item.name} consumi?`);
    if (quantity && !isNaN(quantity)) {
      groceryInventory.consumeItem(item.name, parseFloat(quantity));
    }
  }
  
  function addToShoppingList(item) {
    // Pentru implementare viitoare
    alert(`${item.name} adăugat la lista de cumpărături!`);
  }
  
  function getTrendDisplay(itemName) {
    const analytics = groceryInventory.getPriceAnalytics(itemName);
    if (!analytics || !analytics.history || analytics.history.length <= 1) return null;
    
    const percentChange = ((analytics.latest - analytics.avg) / analytics.avg * 100);
    
    if (analytics.trend === 'up') {
      return `📈 +${percentChange.toFixed(1)}%`;
    } else if (analytics.trend === 'down') {
      return `📉 ${percentChange.toFixed(1)}%`;
    } else {
      return `➡️ stabil`;
    }
  }
  
  // Grupare pe categorii
  $: groupedInventory = filteredInventory.reduce((acc, [key, item]) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
</script>

<div class="grocery-dashboard">
  <!-- Floating Camera Scan Button -->
  <button 
    class="scan-receipt-btn"
    on:click={() => showCameraScanner = true}
    style="
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 50%;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      cursor: pointer;
      z-index: 100;
      transition: transform 0.2s;
    "
    on:mouseenter={(e) => e.target.style.transform = 'scale(1.1)'}
    on:mouseleave={(e) => e.target.style.transform = 'scale(1)'}
  >
    📸
  </button>

  <!-- Stats Cards -->
  <div class="stats-cards">
    <div class="stat-card">
      <div class="stat-icon">📦</div>
      <div class="stat-content">
        <h3>Produse în Stoc</h3>
        <p class="stat-value">{totalProducts}</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-content">
        <h3>Valoare Totală</h3>
        <p class="stat-value">{totalValue.toFixed(2)} RON</p>
      </div>
    </div>
    
    <div class="stat-card warning">
      <div class="stat-icon">⚠️</div>
      <div class="stat-content">
        <h3>Stoc Scăzut</h3>
        <p class="stat-value">{lowStock.length} produse</p>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-content">
        <h3>Cheltuieli Luna Asta</h3>
        <p class="stat-value">{thisMonthExpenses.toFixed(2)} RON</p>
      </div>
    </div>
  </div>
  
  <!-- Search and Filters -->
  <div class="controls">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input 
        type="search" 
        placeholder="Caută produs sau categorie..."
        on:input={(e) => debouncedSearch(e.target.value)}
        class="search-input"
      />
    </div>
    
    <div class="view-options">
      <button class="view-btn active">📋 Listă</button>
      <button class="view-btn">📊 Categorii</button>
    </div>
  </div>
  
  <!-- Low Stock Alert -->
  {#if lowStock.length > 0}
    <div class="alert alert-warning">
      <span class="alert-icon">⚠️</span>
      <div>
        <strong>Stoc scăzut pentru:</strong> {lowStock.join(', ')}
        <button class="btn-link" on:click={() => addToShoppingList({name: lowStock.join(', ')})}>
          Adaugă la listă cumpărături
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Inventory Grid -->
  <div class="inventory-section">
    {#each Object.entries(groupedInventory) as [category, items]}
      <div class="category-section">
        <h3 class="category-header">
          {category} 
          <span class="category-count">({items.length})</span>
        </h3>
        
        <div class="inventory-grid">
          {#each items as item}
            <div class="inventory-card" class:low-stock={item.quantity < 2}>
              <div class="card-header">
                <h4>{item.name}</h4>
                <span class="category-badge">{item.category}</span>
              </div>
              
              <div class="card-body">
                <div class="quantity-display">
                  <span class="quantity-value">{item.quantity.toFixed(1)}</span>
                  <span class="quantity-unit">{item.unit}</span>
                </div>
                
                <div class="price-info">
                  <span class="current-price">{item.lastPrice.toFixed(2)} RON/{item.unit}</span>
                  {#if priceHistory[item.name.toLowerCase()]?.length > 1}
                    <span class="price-trend">
                      {getTrendDisplay(item.name) || '➡️ stabil'}
                    </span>
                  {/if}
                </div>
              </div>
              
              <div class="card-actions">
                <button 
                  on:click={() => viewPriceHistory(item)} 
                  title="Istoric prețuri"
                  class="action-btn"
                >
                  📊
                </button>
                <button 
                  on:click={() => consumeItem(item)} 
                  title="Consumă"
                  class="action-btn"
                >
                  🍽️
                </button>
                <button 
                  on:click={() => addToShoppingList(item)} 
                  title="Adaugă la cumpărături"
                  class="action-btn"
                >
                  🛒
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Price History Modal -->
  {#if showPriceHistory && selectedItem}
    <div class="modal-overlay" on:click={() => showPriceHistory = false}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h3>📊 Istoric Prețuri - {selectedItem.name}</h3>
          <button class="close-btn" on:click={() => showPriceHistory = false}>✕</button>
        </div>
        
        <div class="modal-body">
          {#if selectedItemAnalytics}
            <div class="price-stats">
              <div class="price-stat">
                <span class="label">Minim:</span>
                <span class="value">{selectedItemAnalytics.min.toFixed(2)} RON</span>
              </div>
              <div class="price-stat">
                <span class="label">Maxim:</span>
                <span class="value">{selectedItemAnalytics.max.toFixed(2)} RON</span>
              </div>
              <div class="price-stat">
                <span class="label">Mediu:</span>
                <span class="value">{selectedItemAnalytics.avg.toFixed(2)} RON</span>
              </div>
              <div class="price-stat">
                <span class="label">Curent:</span>
                <span class="value">{selectedItemAnalytics.latest.toFixed(2)} RON</span>
              </div>
            </div>
            
            <div class="price-history-list">
              <h4>Istoric achiziții:</h4>
              {#each selectedItemAnalytics.history.slice(-10).reverse() as entry}
                <div class="history-entry">
                  <span class="date">{entry.date}</span>
                  <span class="store">{entry.store}</span>
                  <span class="price">{entry.price.toFixed(2)} RON/{selectedItem.unit}</span>
                </div>
              {/each}
            </div>
          {:else}
            <p>Nu există date de preț pentru acest produs.</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Camera Scanner Component -->
<CameraScanner 
  isOpen={showCameraScanner} 
  on:close={() => showCameraScanner = false}
/>

<style>
  .grocery-dashboard {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    background: var(--bg, #f5f7fa);
    min-height: 100vh;
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-card {
    background: var(--panel, white);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 15px;
    transition: transform 0.2s;
    border: 1px solid rgba(128, 184, 255, .1);
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .stat-card.warning {
    background: #fff3e0;
    border-color: #ff9800;
  }
  
  .stat-icon {
    font-size: 36px;
  }
  
  .stat-content h3 {
    margin: 0;
    font-size: 14px;
    color: var(--muted, #666);
    font-weight: 500;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--ink, #333);
    margin: 5px 0 0 0;
  }
  
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 20px;
  }
  
  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: var(--muted, #666);
  }
  
  .search-input {
    width: 100%;
    padding: 12px 12px 12px 45px;
    border: 1px solid #ddd;
    border-radius: 25px;
    font-size: 14px;
    background: var(--panel, white);
    color: var(--ink, #333);
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--acc, #4CAF50);
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .view-options {
    display: flex;
    gap: 10px;
  }
  
  .view-btn {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: var(--panel, white);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--ink, #333);
  }
  
  .view-btn.active {
    background: var(--acc, #4CAF50);
    color: white;
    border-color: var(--acc, #4CAF50);
  }
  
  .alert {
    padding: 15px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .alert-warning {
    background: #fff3e0;
    border: 1px solid #ff9800;
  }
  
  .alert-icon {
    font-size: 24px;
  }
  
  .btn-link {
    background: none;
    border: none;
    color: #1976d2;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 10px;
  }
  
  .category-section {
    margin-bottom: 30px;
  }
  
  .category-header {
    font-size: 18px;
    color: var(--ink, #333);
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--panel2, #eee);
  }
  
  .category-count {
    font-size: 14px;
    color: var(--muted, #666);
    font-weight: normal;
  }
  
  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .inventory-card {
    background: var(--panel, white);
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: all 0.3s;
    border: 1px solid rgba(128, 184, 255, .1);
  }
  
  .inventory-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .inventory-card.low-stock {
    border: 2px solid #ff9800;
    background: #fff8e1;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 12px;
  }
  
  .card-header h4 {
    margin: 0;
    font-size: 16px;
    color: var(--ink, #333);
  }
  
  .category-badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
  }
  
  .card-body {
    margin-bottom: 12px;
  }
  
  .quantity-display {
    display: flex;
    align-items: baseline;
    gap: 5px;
    margin-bottom: 8px;
  }
  
  .quantity-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--acc, #4CAF50);
  }
  
  .quantity-unit {
    font-size: 14px;
    color: var(--muted, #666);
  }
  
  .price-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .current-price {
    font-size: 14px;
    color: var(--muted, #666);
  }
  
  .price-trend {
    font-size: 12px;
    color: var(--muted, #666);
  }
  
  .card-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--panel2, #eee);
  }
  
  .action-btn {
    flex: 1;
    padding: 6px;
    background: var(--panel2, #f5f5f5);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s;
  }
  
  .action-btn:hover {
    background: #e0e0e0;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: var(--panel, white);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--panel2, #eee);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h3 {
    margin: 0;
    color: var(--ink, #333);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--muted, #666);
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .close-btn:hover {
    background: var(--panel2, #f0f0f0);
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .price-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .price-stat {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    background: var(--panel2, #f5f5f5);
    border-radius: 6px;
  }
  
  .price-stat .label {
    color: var(--muted, #666);
    font-size: 14px;
  }
  
  .price-stat .value {
    font-weight: bold;
    color: var(--ink, #333);
  }
  
  .price-history-list h4 {
    margin-top: 20px;
    margin-bottom: 10px;
    color: var(--ink, #333);
  }
  
  .history-entry {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    border-bottom: 1px solid var(--panel2, #eee);
  }
  
  .history-entry .date {
    color: var(--muted, #666);
    font-size: 14px;
  }
  
  .history-entry .store {
    font-weight: 500;
    color: var(--ink, #333);
  }
  
  .history-entry .price {
    color: var(--acc, #4CAF50);
    font-weight: bold;
  }
  
  /* Dark mode support */
  :global(html.dark) .grocery-dashboard {
    background: var(--bg, #1a1f2e);
    color: var(--ink, #e5e7eb);
  }
  
  :global(html.dark) .stat-card,
  :global(html.dark) .inventory-card,
  :global(html.dark) .modal-content {
    background: var(--panel, #252a3a);
    color: var(--ink, #e5e7eb);
    border-color: rgba(128, 184, 255, .2);
  }
  
  :global(html.dark) .stat-card.warning {
    background: rgba(255, 152, 0, 0.15);
    border-color: #ff9800;
  }
  
  :global(html.dark) .inventory-card.low-stock {
    background: rgba(255, 152, 0, 0.15);
  }
  
  :global(html.dark) .search-input,
  :global(html.dark) .view-btn {
    background: var(--panel2, #2d3748);
    border-color: rgba(128, 184, 255, .2);
    color: var(--ink, #e5e7eb);
  }
  
  :global(html.dark) .action-btn {
    background: var(--panel2, #374151);
  }
  
  :global(html.dark) .action-btn:hover {
    background: #4b5563;
  }
  
  :global(html.dark) .modal-header,
  :global(html.dark) .history-entry,
  :global(html.dark) .card-actions {
    border-color: rgba(128, 184, 255, .2);
  }
  
  :global(html.dark) .price-stat {
    background: var(--panel2, #374151);
  }
  
  :global(html.dark) .close-btn:hover {
    background: var(--panel2, #374151);
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .grocery-dashboard {
      padding: 15px;
    }
    
    .controls {
      flex-direction: column;
      gap: 15px;
    }
    
    .search-box {
      max-width: none;
    }
    
    .stats-cards {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    
    .inventory-grid {
      grid-template-columns: 1fr;
    }
    
    .modal-content {
      width: 95%;
      margin: 10px;
    }
    
    .price-stats {
      grid-template-columns: 1fr;
    }
  }
</style>