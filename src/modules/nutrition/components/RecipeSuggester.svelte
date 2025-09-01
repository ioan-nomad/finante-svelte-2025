<!-- src/modules/nutrition/components/RecipeSuggester.svelte -->
<script>
  import { onMount } from 'svelte';
  import { writable, derived, get } from 'svelte/store';
  import { 
    nutritionProfile, 
    codexRecipes,
    todaysRecommendations,
    addMealToProfile
  } from '../stores/nutritionStore.js';
  
  // Try to import pantry store if available
  let pantryInventory = null;
  let pantryAvailable = false;
  
  onMount(async () => {
    try {
      const pantryModule = await import('../../pantry/stores/pantryStore.js');
      pantryInventory = pantryModule.groceryInventory;
      pantryAvailable = true;
    } catch (error) {
      console.log('Pantry module not available - running in standalone mode');
    }
  });

  // Local state
  let selectedFilter = 'all';
  let searchQuery = '';
  let showDetails = {};
  let suggestions = writable([]);
  let expandedRecipes = {};

  // Filters
  const filters = [
    { value: 'all', label: 'Toate', icon: '📖' },
    { value: 'mtor-high', label: 'mTOR High', icon: '💪' },
    { value: 'anti-inflammatory', label: 'Anti-inflamator', icon: '🌿' },
    { value: 'plant-diverse', label: '30+ Plante', icon: '🌈' },
    { value: 'instant-pot', label: 'Instant Pot', icon: '🍲' },
    { value: 'quick', label: 'Rapid (< 30 min)', icon: '⚡' }
  ];

  // Utility functions
  function nid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function showNotification(message, type = 'info') {
    const event = new CustomEvent('show-notification', {
      detail: { message, type },
      bubbles: true
    });
    window.dispatchEvent(event);
  }

  // Check pantry availability for ingredients
  function checkPantryAvailability(recipe) {
    if (!pantryAvailable || !$pantryInventory) return 0;
    
    const inventory = $pantryInventory.inventory || [];
    let availableCount = 0;
    let totalCount = recipe.ingredients.length;
    
    recipe.ingredients.forEach(ingredient => {
      const available = inventory.find(item => 
        item.name.toLowerCase().includes(ingredient.name.toLowerCase())
      );
      
      if (available && available.quantity >= (ingredient.amount || 1)) {
        availableCount++;
      }
    });

    return (availableCount / totalCount) * 100;
  }

  // Generate suggestions based on CODEX principles
  function generateSuggestions() {
    const profile = $nutritionProfile;
    const today = new Date();
    const dayOfCycle = Math.floor((today - profile.startDate) / (1000 * 60 * 60 * 24)) % 14;
    
    // mTOR cycling: High protein days 1-3, 8-10; Low protein days 4-7, 11-14
    const isMtorHigh = (dayOfCycle >= 0 && dayOfCycle <= 2) || (dayOfCycle >= 7 && dayOfCycle <= 9);
    
    let recipeSuggestions = [...$codexRecipes];

    // Filter based on mTOR cycle
    if (isMtorHigh) {
      recipeSuggestions = recipeSuggestions.filter(r => 
        r.nutritionalGoals.includes('mtor-high') || r.protein >= 25
      );
    } else {
      recipeSuggestions = recipeSuggestions.filter(r => 
        r.nutritionalGoals.includes('anti-inflammatory') || r.plantCount >= 5
      );
    }

    // Apply selected filter
    if (selectedFilter !== 'all') {
      recipeSuggestions = recipeSuggestions.filter(r => {
        switch(selectedFilter) {
          case 'mtor-high':
            return r.nutritionalGoals.includes('mtor-high') || r.protein >= 25;
          case 'anti-inflammatory':
            return r.nutritionalGoals.includes('anti-inflammatory');
          case 'plant-diverse':
            return r.plantCount >= 8;
          case 'instant-pot':
            return r.instantPot === true;
          case 'quick':
            return r.cookingTime === 'quick';
          default:
            return true;
        }
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      recipeSuggestions = recipeSuggestions.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(query))
      );
    }

    // Sort by relevance
    recipeSuggestions.sort((a, b) => {
      // Prioritize by pantry availability if module is available
      if (pantryAvailable) {
        const availA = checkPantryAvailability(a);
        const availB = checkPantryAvailability(b);
        if (availA !== availB) return availB - availA;
      }
      
      // Then by mTOR cycle match
      if (isMtorHigh) {
        return (b.protein || 0) - (a.protein || 0);
      } else {
        return (b.plantCount || 0) - (a.plantCount || 0);
      }
    });

    suggestions.set(recipeSuggestions);
  }

  // Cook recipe and add to nutrition profile
  function cookRecipe(recipe) {
    const meal = {
      id: nid(),
      date: new Date().toISOString().split('T')[0],
      recipeName: recipe.name,
      plantCount: recipe.plantCount,
      protein: recipe.protein,
      antiInflammatory: recipe.nutritionalGoals.includes('anti-inflammatory'),
      mealType: recipe.mealType
    };

    addMealToProfile(meal);
    
    // Update ingredients in pantry if available
    if (pantryAvailable && pantryInventory) {
      recipe.ingredients.forEach(ingredient => {
        pantryInventory.consumeItem(ingredient.name, ingredient.amount || 1);
      });
    }

    showNotification(`✅ Rețeta "${recipe.name}" adăugată la profilul nutrițional!`, 'success');
  }

  // Generate shopping list from recipe
  function generateShoppingList(recipe) {
    const missingIngredients = [];
    
    recipe.ingredients.forEach(ingredient => {
      let needToBuy = true;
      
      if (pantryAvailable && $pantryInventory) {
        const available = $pantryInventory.inventory?.find(item =>
          item.name.toLowerCase().includes(ingredient.name.toLowerCase())
        );
        
        if (available && available.quantity >= (ingredient.amount || 1)) {
          needToBuy = false;
        }
      }
      
      if (needToBuy) {
        missingIngredients.push({
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit
        });
      }
    });

    if (missingIngredients.length === 0) {
      showNotification('✅ Ai toate ingredientele în stoc!', 'success');
      return;
    }

    // Create shopping list
    const shoppingList = {
      id: nid(),
      name: `Shopping: ${recipe.name}`,
      date: new Date().toISOString().split('T')[0],
      items: missingIngredients
    };

    // Save to localStorage
    const existingLists = JSON.parse(localStorage.getItem('shoppingLists') || '[]');
    existingLists.push(shoppingList);
    localStorage.setItem('shoppingLists', JSON.stringify(existingLists));
    
    // Copy to clipboard
    const listText = missingIngredients
      .map(i => `- ${i.name}: ${i.amount}${i.unit || ''}`)
      .join('\n');
    
    navigator.clipboard.writeText(listText).then(() => {
      showNotification(`📋 Listă shopping copiată în clipboard! (${missingIngredients.length} ingrediente)`, 'success');
    });
  }

  // Toggle recipe details
  function toggleRecipeDetails(recipeId) {
    expandedRecipes[recipeId] = !expandedRecipes[recipeId];
    expandedRecipes = expandedRecipes; // Trigger reactivity
  }

  // Initialize on mount
  onMount(() => {
    generateSuggestions();
  });

  // Reactive updates
  $: if (selectedFilter || searchQuery) {
    generateSuggestions();
  }

  $: cycleDay = Math.floor((new Date() - $nutritionProfile.startDate) / (1000 * 60 * 60 * 24)) % 14;
  $: isMtorHighDay = (cycleDay >= 0 && cycleDay <= 2) || (cycleDay >= 7 && cycleDay <= 9);
</script>

<div class="recipe-suggester">
  <!-- Header with cycle info -->
  <div class="suggester-header">
    <div class="cycle-status">
      <div class="cycle-badge {isMtorHighDay ? 'high' : 'low'}">
        {isMtorHighDay ? '💪 mTOR High' : '🌿 Plant Focus'}
        <span class="cycle-day">Ziua {cycleDay + 1}/14</span>
      </div>
      
      <div class="daily-goals">
        <span class="goal">🎯 {isMtorHighDay ? '25-40g proteine' : '8-12 plante'}</span>
        <span class="goal">🌱 {$nutritionProfile.weeklyPlantCount}/30 plante săptămâna asta</span>
      </div>
    </div>
  </div>

  <!-- Search and filters -->
  <div class="search-section">
    <div class="search-bar">
      <input
        type="text"
        placeholder="🔍 Caută rețete sau ingrediente..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>
    
    <div class="filter-buttons">
      {#each filters as filter}
        <button
          class="filter-btn {selectedFilter === filter.value ? 'active' : ''}"
          on:click={() => selectedFilter = filter.value}
        >
          <span class="filter-icon">{filter.icon}</span>
          <span class="filter-label">{filter.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Recipe suggestions -->
  <div class="recipe-grid">
    {#each $suggestions as recipe}
      <div class="recipe-card {expandedRecipes[recipe.id] ? 'expanded' : ''}">
        <div class="recipe-header" on:click={() => toggleRecipeDetails(recipe.id)}>
          <h3 class="recipe-name">{recipe.name}</h3>
          {#if pantryAvailable}
            {@const availability = checkPantryAvailability(recipe)}
            <div class="availability-badge" class:high={availability >= 80} class:medium={availability >= 50}>
              {availability.toFixed(0)}% disponibil
            </div>
          {/if}
        </div>
        
        <p class="recipe-description">{recipe.description}</p>
        
        <div class="recipe-stats">
          <span class="stat">🌱 {recipe.plantCount} plante</span>
          <span class="stat">💪 {recipe.protein}g proteine</span>
          <span class="stat">⏱️ {recipe.cookingTime === 'quick' ? '<30 min' : recipe.cookingTime}</span>
          {#if recipe.instantPot}
            <span class="stat instant-pot">🍲 Instant Pot</span>
          {/if}
        </div>

        <div class="recipe-tags">
          {#each recipe.nutritionalGoals as goal}
            <span class="tag {goal}">{goal.replace('-', ' ')}</span>
          {/each}
        </div>

        {#if expandedRecipes[recipe.id]}
          <div class="recipe-details">
            <div class="ingredients-section">
              <h4>Ingrediente:</h4>
              <ul class="ingredients-list">
                {#each recipe.ingredients as ingredient}
                  {@const isAvailable = pantryAvailable && $pantryInventory?.inventory?.find(
                    item => item.name.toLowerCase().includes(ingredient.name.toLowerCase()) &&
                    item.quantity >= (ingredient.amount || 1)
                  )}
                  <li class:available={isAvailable} class:missing={!isAvailable}>
                    {#if isAvailable}✅{:else}❌{/if}
                    {ingredient.name}: {ingredient.amount}{ingredient.unit || ''}
                  </li>
                {/each}
              </ul>
            </div>

            {#if recipe.instantPotInstructions}
              <div class="instructions-section">
                <h4>Instrucțiuni Instant Pot:</h4>
                <ol class="instructions-list">
                  {#each recipe.instantPotInstructions as step}
                    <li>{step}</li>
                  {/each}
                </ol>
              </div>
            {/if}

            {#if recipe.nutritionalHighlight}
              <div class="nutrition-highlight">
                💡 {recipe.nutritionalHighlight}
              </div>
            {/if}
          </div>
        {/if}

        <div class="recipe-actions">
          <button class="btn-cook" on:click={() => cookRecipe(recipe)}>
            🍳 Gătește acum
          </button>
          <button class="btn-shopping" on:click={() => generateShoppingList(recipe)}>
            🛒 Listă cumpărături
          </button>
        </div>
      </div>
    {/each}
  </div>

  {#if $suggestions.length === 0}
    <div class="no-results">
      <p>😔 Nu am găsit rețete care să corespundă criteriilor tale.</p>
      <p>Încearcă să modifici filtrele sau termenii de căutare.</p>
    </div>
  {/if}
</div>

<style>
  .recipe-suggester {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .suggester-header {
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
  }

  .cycle-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
  }

  .cycle-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .cycle-badge.high {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  .cycle-badge.low {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  .cycle-day {
    font-size: 0.9em;
    opacity: 0.9;
  }

  .daily-goals {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .goal {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 0.95em;
  }

  .search-section {
    margin-bottom: 25px;
  }

  .search-bar {
    margin-bottom: 15px;
  }

  .search-input {
    width: 100%;
    padding: 12px 20px;
    font-size: 16px;
    border: 2px solid var(--border, #ddd);
    border-radius: 25px;
    outline: none;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    border-color: var(--primary, #667eea);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .filter-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 16px;
    background: var(--panel, white);
    border: 2px solid var(--border, #e0e0e0);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
  }

  .filter-btn:hover {
    border-color: var(--primary, #667eea);
    transform: translateY(-2px);
  }

  .filter-btn.active {
    background: var(--primary, #667eea);
    color: white;
    border-color: var(--primary, #667eea);
  }

  .filter-icon {
    font-size: 16px;
  }

  .recipe-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .recipe-card {
    background: var(--panel, white);
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .recipe-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .recipe-card.expanded {
    grid-column: span 2;
  }

  .recipe-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 10px;
  }

  .recipe-name {
    margin: 0;
    font-size: 1.2em;
    color: var(--text, #333);
  }

  .availability-badge {
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
    background: #f0f0f0;
    color: #666;
  }

  .availability-badge.high {
    background: #d4edda;
    color: #155724;
  }

  .availability-badge.medium {
    background: #fff3cd;
    color: #856404;
  }

  .recipe-description {
    color: var(--text-secondary, #666);
    margin: 10px 0;
    font-size: 0.95em;
  }

  .recipe-stats {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    margin: 15px 0;
  }

  .stat {
    font-size: 0.9em;
    color: var(--text-secondary, #666);
  }

  .stat.instant-pot {
    color: var(--primary, #667eea);
    font-weight: bold;
  }

  .recipe-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 15px 0;
  }

  .tag {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    text-transform: capitalize;
    background: var(--tag-bg, #f0f0f0);
    color: var(--tag-color, #666);
  }

  .tag.anti-inflammatory {
    background: #d4edda;
    color: #155724;
  }

  .tag.mtor-high {
    background: #f8d7da;
    color: #721c24;
  }

  .tag.plant-diversity {
    background: #d1ecf1;
    color: #0c5460;
  }

  .recipe-details {
    margin: 20px 0;
    padding: 20px;
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 8px;
  }

  .ingredients-section,
  .instructions-section {
    margin-bottom: 20px;
  }

  .ingredients-section h4,
  .instructions-section h4 {
    margin: 0 0 10px 0;
    color: var(--text, #333);
  }

  .ingredients-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ingredients-list li {
    padding: 5px 0;
    border-bottom: 1px solid var(--border, #e0e0e0);
  }

  .ingredients-list li.available {
    color: #155724;
  }

  .ingredients-list li.missing {
    color: #721c24;
  }

  .instructions-list {
    margin: 0;
    padding-left: 20px;
  }

  .instructions-list li {
    margin: 8px 0;
    line-height: 1.5;
  }

  .nutrition-highlight {
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 8px;
    font-size: 0.95em;
  }

  .recipe-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .btn-cook,
  .btn-shopping {
    flex: 1;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-cook {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-cook:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  .btn-shopping {
    background: white;
    color: var(--primary, #667eea);
    border: 2px solid var(--primary, #667eea);
  }

  .btn-shopping:hover {
    background: var(--primary, #667eea);
    color: white;
  }

  .no-results {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary, #666);
  }

  /* Dark mode support */
  :global(body.dark-mode) .recipe-suggester {
    color: #e0e0e0;
  }

  :global(body.dark-mode) .recipe-card {
    background: #2a2a2a;
    border-color: #404040;
  }

  :global(body.dark-mode) .recipe-details {
    background: #1a1a1a;
  }

  :global(body.dark-mode) .search-input {
    background: #2a2a2a;
    color: #e0e0e0;
    border-color: #404040;
  }

  :global(body.dark-mode) .filter-btn {
    background: #2a2a2a;
    color: #e0e0e0;
    border-color: #404040;
  }

  :global(body.dark-mode) .filter-btn.active {
    background: var(--primary, #667eea);
    color: white;
  }
</style>