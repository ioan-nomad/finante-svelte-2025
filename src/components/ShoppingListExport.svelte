<script>
  import { onMount } from 'svelte';
  import { shoppingListManager } from '../modules/nutrition/ShoppingListManager.js';

  export let recipes = [];
  export let pantryInventory = {};

  let shoppingList = null;
  let showExportModal = false;
  let exportFormat = 'text';
  let copied = false;

  onMount(() => {
    generateList();
  });

  function generateList() {
    if (recipes && recipes.length > 0) {
      shoppingList = shoppingListManager.generateSmartShoppingList(recipes, pantryInventory);
      shoppingListManager.saveToLocalStorage(shoppingList);
    }
  }

  function exportList() {
    let content;

    switch(exportFormat) {
      case 'text':
        content = shoppingListManager.exportToText(shoppingList);
        break;
      case 'json':
        content = shoppingListManager.exportToJSON(shoppingList);
        break;
      case 'todoist':
        content = JSON.stringify(shoppingListManager.exportToTodoist(shoppingList), null, 2);
        break;
      default:
        content = shoppingListManager.exportToText(shoppingList);
    }

    navigator.clipboard.writeText(content);
    copied = true;
    setTimeout(() => copied = false, 3000);
  }

  function downloadList() {
    const content = shoppingListManager.exportToText(shoppingList);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if shoppingList}
  <div class="shopping-export">
    <div class="export-header">
      <h3>📋 Listă Cumpărături Inteligentă</h3>
      <div class="export-stats">
        <span class="stat">
          <span class="label">Magazine:</span>
          <span class="value">{shoppingList.route.length}</span>
        </span>
        <span class="stat">
          <span class="label">Produse:</span>
          <span class="value">{shoppingList.items.length}</span>
        </span>
        <span class="stat">
          <span class="label">Cost total:</span>
          <span class="value cost">{shoppingList.totalCost.toFixed(2)} RON</span>
        </span>
        <span class="stat">
          <span class="label">Timp estimat:</span>
          <span class="value">{shoppingList.estimatedTime} min</span>
        </span>
      </div>
    </div>

    <div class="route-visualization">
      <h4>🗺️ Rută Optimizată</h4>
      <div class="route-path">
        {#each shoppingList.route as store, idx}
          <div class="route-stop">
            <div class="stop-number">{idx + 1}</div>
            <div class="stop-info">
              <div class="stop-name">{store}</div>
              <div class="stop-details">
                {shoppingList.byStore[store].items.length} produse •
                {shoppingList.byStore[store].subtotal.toFixed(2)} RON
              </div>
            </div>
          </div>
          {#if idx < shoppingList.route.length - 1}
            <div class="route-connector">→</div>
          {/if}
        {/each}
      </div>
    </div>

    <div class="store-breakdown">
      {#each shoppingList.route as store}
        <div class="store-card">
          <div class="store-header">
            <h4>📍 {store}</h4>
            <span class="store-total">{shoppingList.byStore[store].subtotal.toFixed(2)} RON</span>
          </div>
          <div class="store-items">
            {#each shoppingList.byStore[store].items as item}
              <div class="item-row">
                <input type="checkbox" id="item-{store}-{item.name}">
                <label for="item-{store}-{item.name}">
                  {item.name} - {item.totalAmount}{item.unit}
                </label>
                <span class="item-price">{item.estimatedPrice.toFixed(2)} RON</span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="export-actions">
      <button class="btn btn-primary" on:click={() => showExportModal = true}>
        📤 Export Listă
      </button>
      <button class="btn btn-secondary" on:click={downloadList}>
        💾 Download TXT
      </button>
      <button class="btn btn-secondary" on:click={generateList}>
        🔄 Regenerează
      </button>
    </div>

    {#if showExportModal}
      <div class="modal-overlay" on:click={() => showExportModal = false}>
        <div class="modal" on:click|stopPropagation>
          <h3>Export Shopping List</h3>

          <div class="export-options">
            <label class="export-option">
              <input type="radio" bind:group={exportFormat} value="text">
              <span>📝 Text simplu</span>
            </label>
            <label class="export-option">
              <input type="radio" bind:group={exportFormat} value="json">
              <span>🔧 JSON (pentru aplicații)</span>
            </label>
            <label class="export-option">
              <input type="radio" bind:group={exportFormat} value="todoist">
              <span>✅ Todoist format</span>
            </label>
          </div>

          <div class="modal-actions">
            <button class="btn btn-primary" on:click={exportList}>
              {copied ? '✅ Copiat!' : '📋 Copiază în Clipboard'}
            </button>
            <button class="btn btn-secondary" on:click={() => showExportModal = false}>
              Închide
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .shopping-export {
    background: var(--panel, white);
    border-radius: 16px;
    padding: 24px;
    margin-top: 24px;
  }

  .export-header {
    margin-bottom: 24px;
  }

  .export-header h3 {
    margin: 0 0 16px 0;
    color: var(--ink, #333);
  }

  .export-stats {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat .label {
    font-size: 12px;
    color: var(--muted, #666);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat .value {
    font-size: 20px;
    font-weight: bold;
    color: var(--ink, #333);
  }

  .stat .value.cost {
    color: #F57C00;
  }

  .route-visualization {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .route-visualization h4 {
    margin: 0 0 16px 0;
    color: var(--ink, #333);
  }

  .route-path {
    display: flex;
    align-items: center;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .route-stop {
    display: flex;
    align-items: center;
    gap: 12px;
    background: white;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 150px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .stop-number {
    background: var(--primary, #4CAF50);
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
  }

  .stop-info {
    flex: 1;
  }

  .stop-name {
    font-weight: 600;
    color: var(--ink, #333);
  }

  .stop-details {
    font-size: 12px;
    color: var(--muted, #666);
  }

  .route-connector {
    color: var(--muted, #666);
    font-size: 20px;
  }

  .store-breakdown {
    display: grid;
    gap: 20px;
    margin-bottom: 24px;
  }

  .store-card {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 20px;
  }

  .store-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .store-header h4 {
    margin: 0;
    color: var(--ink, #333);
  }

  .store-total {
    font-size: 18px;
    font-weight: bold;
    color: #F57C00;
  }

  .store-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: white;
    border-radius: 6px;
  }

  .item-row input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .item-row label {
    flex: 1;
    cursor: pointer;
    color: var(--ink, #333);
  }

  .item-price {
    font-weight: 500;
    color: var(--primary, #4CAF50);
  }

  .export-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-primary {
    background: var(--primary, #4CAF50);
    color: white;
  }

  .btn-primary:hover {
    background: #45a049;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: var(--panel2, #f5f5f5);
    color: var(--ink, #333);
  }

  .btn-secondary:hover {
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

  .modal {
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
  }

  .modal h3 {
    margin: 0 0 24px 0;
    color: var(--ink, #333);
  }

  .export-options {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .export-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--panel2, #f9f9f9);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
  }

  .export-option:hover {
    background: #e0e0e0;
  }

  .export-option input[type="radio"] {
    width: 20px;
    height: 20px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  /* Dark mode */
  :global(.dark-mode) .shopping-export {
    background: #1a1a1a;
  }

  :global(.dark-mode) .store-card,
  :global(.dark-mode) .route-visualization {
    background: #2a2a2a;
  }

  :global(.dark-mode) .item-row,
  :global(.dark-mode) .route-stop {
    background: #3a3a3a;
  }

  :global(.dark-mode) .modal {
    background: #2a2a2a;
    color: #e0e0e0;
  }

  :global(.dark-mode) .export-option {
    background: #3a3a3a;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .route-path {
      flex-direction: column;
      align-items: stretch;
    }

    .route-connector {
      transform: rotate(90deg);
      margin: 8px 0;
    }

    .export-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
</style>