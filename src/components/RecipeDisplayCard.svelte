<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import ShoppingListExport from './ShoppingListExport.svelte';

  export let recipe = null;
  export let loading = false;

  let activeTab = 'ingredients';
  let showPrintView = false;
  let pantryInventory = {};

  onMount(() => {
    // Get pantry data from localStorage
    try {
      const pantryData = localStorage.getItem('groceryInventory');
      if (pantryData) {
        const parsed = JSON.parse(pantryData);
        pantryInventory = parsed.inventory || {};
      }
    } catch (error) {
      console.warn('Could not load pantry data:', error);
    }
  });

  function getStatusColor(inStock) {
    return inStock ? '#4CAF50' : '#FF9800';
  }

  function calculateTotalCost() {
    if (!recipe?.shoppingList) return 0;
    return recipe.shoppingList.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  }

  function printRecipe() {
    window.print();
  }

  function exportToNotes() {
    const text = formatRecipeText();
    navigator.clipboard.writeText(text);
    alert('Rețeta copiată în clipboard!');
  }

  function formatRecipeText() {
    if (!recipe) return '';

    return `
🍽️ ${recipe.name}
⏰ Timp: ${recipe.cookingTime} minute
🔥 Calorii: ${recipe.nutrition?.calories || 0} kcal

INGREDIENTE:
${recipe.ingredients?.map(i => `- ${i.name}: ${i.amount}${i.unit} ${i.inStock ? '✅' : '🛒'}`).join('\n')}

STRATURI INSTANT POT:
${recipe.instantPotLayers?.instructions?.map((i, idx) => `${idx + 1}. ${i.instruction}`).join('\n')}

NUTRIȚIE:
- Proteine: ${recipe.nutrition?.protein || 0}g
- Carbohidrați: ${recipe.nutrition?.carbs || 0}g
- Grăsimi: ${recipe.nutrition?.fat || 0}g
- Fibre: ${recipe.nutrition?.fiber || 0}g

Cost estimat: ${calculateTotalCost()} RON
    `;
  }
</script>

{#if loading}
  <div class="loading-container" transition:fade>
    <div class="spinner"></div>
    <p>Generez rețeta optimizată...</p>
  </div>
{:else if recipe}
  <div class="recipe-card" transition:slide>
    <!-- Header -->
    <div class="recipe-header">
      <div class="recipe-title">
        <h2>{recipe.name}</h2>
        <div class="recipe-badges">
          <span class="badge badge-calories">🔥 {recipe.nutrition?.calories || 0} kcal</span>
          <span class="badge badge-time">⏰ {recipe.cookingTime} min</span>
          <span class="badge badge-score">🏆 Score: {recipe.codexScore || 0}</span>
        </div>
      </div>

      <div class="recipe-actions">
        <button class="btn-icon" on:click={printRecipe} title="Print">🖨️</button>
        <button class="btn-icon" on:click={exportToNotes} title="Export">📤</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab {activeTab === 'ingredients' ? 'active' : ''}"
        on:click={() => activeTab = 'ingredients'}
      >
        Ingrediente
      </button>
      <button
        class="tab {activeTab === 'instructions' ? 'active' : ''}"
        on:click={() => activeTab = 'instructions'}
      >
        Instant Pot
      </button>
      <button
        class="tab {activeTab === 'nutrition' ? 'active' : ''}"
        on:click={() => activeTab = 'nutrition'}
      >
        Nutriție
      </button>
      <button
        class="tab {activeTab === 'shopping' ? 'active' : ''}"
        on:click={() => activeTab = 'shopping'}
      >
        Shopping
      </button>
    </div>

    <!-- Content -->
    <div class="tab-content">
      {#if activeTab === 'ingredients'}
        <div class="ingredients-grid" transition:fade>
          {#each recipe.ingredients || [] as ingredient}
            <div class="ingredient-card" class:in-stock={ingredient.inStock}>
              <div class="ingredient-header">
                <span class="ingredient-name">{ingredient.name}</span>
                <span class="ingredient-status" style="color: {getStatusColor(ingredient.inStock)}">
                  {ingredient.inStock ? '✅' : '🛒'}
                </span>
              </div>
              <div class="ingredient-amount">
                {ingredient.amount}{ingredient.unit}
              </div>
              {#if ingredient.displayStatus}
                <div class="ingredient-note">{ingredient.displayStatus}</div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if activeTab === 'instructions'}
        <div class="instructions-container" transition:fade>
          <div class="instant-pot-visual">
            <div class="pot-layer layer-top">
              <span>Top Layer</span>
              <div class="layer-items">Quick cooking (spinach, herbs)</div>
            </div>
            <div class="pot-layer layer-middle">
              <span>Middle Layer</span>
              <div class="layer-items">Proteins & dense vegetables</div>
            </div>
            <div class="pot-layer layer-bottom">
              <span>Bottom Layer</span>
              <div class="layer-items">Liquids & aromatics</div>
            </div>
          </div>

          <ol class="instructions-list">
            {#each recipe.instantPotLayers?.instructions || [] as instruction, idx}
              <li class="instruction-step">
                <span class="step-number">{idx + 1}</span>
                <span class="step-text">{instruction.instruction}</span>
                {#if instruction.duration}
                  <span class="step-time">{instruction.duration}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </div>
      {/if}

      {#if activeTab === 'nutrition'}
        <div class="nutrition-container" transition:fade>
          <div class="macro-grid">
            <div class="macro-card protein">
              <div class="macro-icon">💪</div>
              <div class="macro-value">{recipe.nutrition?.protein || 0}g</div>
              <div class="macro-label">Proteine</div>
              <div class="macro-percent">{recipe.driPercentages?.protein || 0}% DRI</div>
            </div>
            <div class="macro-card carbs">
              <div class="macro-icon">🌾</div>
              <div class="macro-value">{recipe.nutrition?.carbs || 0}g</div>
              <div class="macro-label">Carbohidrați</div>
            </div>
            <div class="macro-card fat">
              <div class="macro-icon">🥑</div>
              <div class="macro-value">{recipe.nutrition?.fat || 0}g</div>
              <div class="macro-label">Grăsimi</div>
            </div>
            <div class="macro-card fiber">
              <div class="macro-icon">🌿</div>
              <div class="macro-value">{recipe.nutrition?.fiber || 0}g</div>
              <div class="macro-label">Fibre</div>
            </div>
          </div>

          <div class="micro-nutrients">
            <h4>Micronutrienți Cheie</h4>
            <div class="nutrient-bars">
              <div class="nutrient-bar">
                <span>Vitamina C</span>
                <div class="bar-track">
                  <div class="bar-fill" style="width: {Math.min(100, (recipe.nutrition?.vitamin_c || 0) / 2)}%"></div>
                </div>
                <span>{recipe.nutrition?.vitamin_c || 0}mg</span>
              </div>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'shopping'}
        <div class="shopping-container" transition:fade>
          <ShoppingListExport
            recipes={[recipe]}
            pantryInventory={pantryInventory}
          />
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="empty-state">
    <p>Generează o rețetă pentru a vedea detaliile</p>
  </div>
{/if}

<style>
  .recipe-card {
    background: var(--panel, white);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-width: 900px;
    margin: 0 auto;
  }

  .recipe-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--border, #e0e0e0);
  }

  .recipe-title h2 {
    margin: 0 0 12px 0;
    color: var(--ink, #333);
    font-size: 28px;
  }

  .recipe-badges {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .badge-calories {
    background: #FFF3E0;
    color: #F57C00;
  }

  .badge-time {
    background: #E8F5E9;
    color: #2E7D32;
  }

  .badge-score {
    background: #F3E5F5;
    color: #7B1FA2;
  }

  .recipe-actions {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    background: none;
    border: 1px solid var(--border, #ddd);
    border-radius: 8px;
    padding: 8px;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-icon:hover {
    background: var(--panel2, #f5f5f5);
    transform: translateY(-2px);
  }

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid var(--border, #e0e0e0);
  }

  .tab {
    background: none;
    border: none;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 500;
    color: var(--muted, #666);
    cursor: pointer;
    position: relative;
    transition: all 0.3s;
  }

  .tab:hover {
    color: var(--ink, #333);
  }

  .tab.active {
    color: var(--primary, #4CAF50);
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--primary, #4CAF50);
    border-radius: 2px 2px 0 0;
  }

  .ingredients-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .ingredient-card {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 16px;
    border: 2px solid transparent;
    transition: all 0.3s;
  }

  .ingredient-card.in-stock {
    border-color: #4CAF50;
    background: #F1F8E9;
  }

  .ingredient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .ingredient-name {
    font-weight: 600;
    color: var(--ink, #333);
  }

  .ingredient-amount {
    font-size: 18px;
    color: var(--primary, #4CAF50);
    font-weight: 500;
  }

  .ingredient-note {
    font-size: 12px;
    color: var(--muted, #666);
    margin-top: 8px;
  }

  .instant-pot-visual {
    background: linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .pot-layer {
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .layer-top {
    border-left: 4px solid #4CAF50;
  }

  .layer-middle {
    border-left: 4px solid #FF9800;
  }

  .layer-bottom {
    border-left: 4px solid #2196F3;
  }

  .instructions-list {
    list-style: none;
    padding: 0;
  }

  .instruction-step {
    display: flex;
    align-items: start;
    gap: 16px;
    padding: 16px;
    background: var(--panel2, #f9f9f9);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .step-number {
    background: var(--primary, #4CAF50);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .macro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .macro-card {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .macro-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .macro-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--ink, #333);
  }

  .macro-label {
    font-size: 14px;
    color: var(--muted, #666);
    margin-top: 4px;
  }

  .macro-percent {
    font-size: 12px;
    color: var(--success, #4CAF50);
    margin-top: 4px;
  }

  .nutrient-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .nutrient-bar {
    display: grid;
    grid-template-columns: 100px 1fr 60px;
    align-items: center;
    gap: 12px;
  }

  .bar-track {
    height: 8px;
    background: var(--panel2, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--primary, #4CAF50);
    transition: width 0.5s ease;
  }

  .shopping-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #FFF3E0;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .total-cost {
    font-size: 18px;
    color: var(--ink, #333);
  }

  .cost-value {
    font-size: 24px;
    font-weight: bold;
    color: #F57C00;
  }

  .shopping-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 16px;
    padding: 12px;
    background: var(--panel2, #f9f9f9);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .item-store {
    color: var(--muted, #666);
    font-size: 14px;
  }

  .item-cost {
    font-weight: 600;
    color: var(--primary, #4CAF50);
  }

  .btn-export {
    width: 100%;
    padding: 16px;
    background: var(--primary, #4CAF50);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.3s;
  }

  .btn-export:hover {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }

  .loading-container {
    text-align: center;
    padding: 60px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border, #e0e0e0);
    border-top-color: var(--primary, #4CAF50);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 60px;
    color: var(--muted, #666);
  }

  /* Dark mode support */
  :global(.dark-mode) .recipe-card {
    background: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  :global(.dark-mode) .ingredient-card {
    background: #2a2a2a;
  }

  :global(.dark-mode) .ingredient-card.in-stock {
    background: #1b3a1b;
  }

  :global(.dark-mode) .pot-layer {
    background: #2a2a2a;
  }

  :global(.dark-mode) .macro-card {
    background: #2a2a2a;
  }

  /* Print styles */
  @media print {
    .recipe-actions,
    .tabs {
      display: none;
    }

    .tab-content > div {
      display: block !important;
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .recipe-card {
      padding: 16px;
      border-radius: 0;
    }

    .ingredients-grid {
      grid-template-columns: 1fr;
    }

    .macro-grid {
      grid-template-columns: 1fr 1fr;
    }

    .tabs {
      overflow-x: auto;
    }
  }
</style>