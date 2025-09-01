<!-- modules/nutrition/components/RecipeSuggester.svelte -->
<script>
  import { onMount } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { nid, fmt } from '../../../shared/stores/sharedStore.js';
  import { codexRecipes, nutritionProfile, addMealToProfile } from '../stores/nutritionStore.js';
  
  // Optional pantry integration - graceful fallback if module disabled
  let pantryInventory = null;
  let pantryAvailable = false;
  
  onMount(async () => {
    try {
      // Dynamic import - only if pantry module is available
      const pantryModule = await import('../../pantry/stores/pantryStore.js');
      pantryInventory = pantryModule.groceryInventory;
      pantryAvailable = true;
    } catch (error) {
      console.log('📝 Pantry module not available - using standalone mode');
      pantryAvailable = false;
    }
  });

  // Recipe suggestion engine
  const suggestions = writable([]);
  const filters = writable({
    cookingTime: 'all',      // quick, medium, slow, all
    difficulty: 'all',       // easy, medium, advanced, all
    nutritionalGoal: 'all',  // mtor-high, anti-inflammatory, plant-diversity, all
    availableOnly: false,    // only recipes with available ingredients
    instantPot: false,       // instant pot recipes only
    mealType: 'all'          // breakfast, lunch, dinner, snack, all
  });

  // Current suggestions based on filters and inventory
  const filteredSuggestions = derived(
    [suggestions, filters, pantryInventory || writable({})],
    ([$suggestions, $filters, $inventory]) => {
      let filtered = $suggestions;

      // Filter by cooking time
      if ($filters.cookingTime !== 'all') {
        filtered = filtered.filter(recipe => recipe.cookingTime === $filters.cookingTime);
      }

      // Filter by difficulty
      if ($filters.difficulty !== 'all') {
        filtered = filtered.filter(recipe => recipe.difficulty === $filters.difficulty);
      }

      // Filter by nutritional goal
      if ($filters.nutritionalGoal !== 'all') {
        filtered = filtered.filter(recipe => 
          recipe.nutritionalGoals.includes($filters.nutritionalGoal)
        );
      }

      // Filter by meal type
      if ($filters.mealType !== 'all') {
        filtered = filtered.filter(recipe => recipe.mealType === $filters.mealType);
      }

      // Filter by Instant Pot
      if ($filters.instantPot) {
        filtered = filtered.filter(recipe => recipe.instantPot);
      }

      // Filter by available ingredients (if pantry available)
      if ($filters.availableOnly && pantryAvailable && $inventory.inventory) {
        filtered = filtered.filter(recipe => {
          return recipe.ingredients.every(ingredient => {
            const key = ingredient.name.toLowerCase();
            const available = $inventory.inventory[key];
            return available && available.quantity >= (ingredient.amount || 1);
          });
        });
      }

      // Sort by ingredient availability score if pantry available
      if (pantryAvailable && $inventory.inventory) {
        filtered = filtered.sort((a, b) => {
          const scoreA = calculateAvailabilityScore(a.ingredients, $inventory.inventory);
          const scoreB = calculateAvailabilityScore(b.ingredients, $inventory.inventory);
          return scoreB - scoreA;
        });
      }

      return filtered;
    }
  );

  function calculateAvailabilityScore(ingredients, inventory) {
    if (!inventory) return 0;
    
    let availableCount = 0;
    let totalCount = ingredients.length;

    ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      const available = inventory[key];
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

    // Add dynamic suggestions based on missing nutrients
    const missingSuggestions = generateMissingSuggestions(profile);
    recipeSuggestions.push(...missingSuggestions);

    suggestions.set(recipeSuggestions);
  }

  function generateMissingSuggestions(profile) {
    const missing = [];
    
    // Check plant diversity goal (30+ plants/week)
    if (profile.weeklyPlantCount < 30) {
      missing.push({
        id: 'plant-boost-salad',
        name: '🌿 Plant Diversity Boost Salad',
        description: 'Maximizează diversitatea plantelor cu 12+ ingrediente în un singur fel',
        cookingTime: 'quick',
        difficulty: 'easy',
        mealType: 'lunch',
        plantCount: 12,
        protein: 15,
        instantPot: false,
        nutritionalGoals: ['plant-diversity', 'anti-inflammatory'],
        ingredients: [
          { name: 'Mix salată verde', amount: 100, unit: 'g' },
          { name: 'Spanac baby', amount: 50, unit: 'g' },
          { name: 'Rucola', amount: 30, unit: 'g' },
          { name: 'Roșii cherry', amount: 150, unit: 'g' },
          { name: 'Castraveți', amount: 100, unit: 'g' },
          { name: 'Morcovi', amount: 80, unit: 'g' },
          { name: 'Avocado', amount: 1, unit: 'buc' },
          { name: 'Nuca', amount: 30, unit: 'g' },
          { name: 'Semințe floarea-soarelui', amount: 20, unit: 'g' },
          { name: 'Fasole roșie', amount: 100, unit: 'g' },
          { name: 'Broccoli', amount: 100, unit: 'g' },
          { name: 'Ulei măsline', amount: 15, unit: 'ml' }
        ],
        instructions: [
          'Spală și toacă toate legumele',
          'Amestecă verdeața într-un bol mare',
          'Adaugă legumele tăiate cubulețe',
          'Presară nucile și semințele',
          'Condimentează cu ulei măsline și oțet balsamic'
        ],
        nutritionalHighlight: 'Conține 12 plante diferite pentru diversitate maximă',
        antiInflammatory: true
      });
    }

    // Check for anti-inflammatory needs
    if (profile.inflammationRisk > 0.7) {
      missing.push({
        id: 'turmeric-ginger-soup',
        name: '🔥 Anti-Inflammatory Turmeric Soup',
        description: 'Supă cu turmeric, ghimbir și 8+ plante anti-inflamatoare',
        cookingTime: 'medium',
        difficulty: 'easy',
        mealType: 'dinner',
        plantCount: 8,
        protein: 12,
        instantPot: true,
        nutritionalGoals: ['anti-inflammatory'],
        ingredients: [
          { name: 'Turmeric proaspăt', amount: 30, unit: 'g' },
          { name: 'Ghimbir proaspăt', amount: 20, unit: 'g' },
          { name: 'Ceapă', amount: 150, unit: 'g' },
          { name: 'Usturoi', amount: 4, unit: 'căței' },
          { name: 'Morcovi', amount: 200, unit: 'g' },
          { name: 'Țelină', amount: 150, unit: 'g' },
          { name: 'Linte roșie', amount: 150, unit: 'g' },
          { name: 'Lapte cocos', amount: 400, unit: 'ml' },
          { name: 'Bulion legume', amount: 500, unit: 'ml' },
          { name: 'Spanac', amount: 100, unit: 'g' }
        ],
        instantPotInstructions: [
          'Sauté: ceapă, usturoi, ghimbir, turmeric - 3 min',
          'Adaugă morcovii, țelina, lintea - amestecă',
          'Pressure Cook: HIGH 8 min, Quick Release',
          'Stir in: lapte cocos, spanac proaspăt',
          'Sauté 2 min până spanacul se ofilește'
        ],
        nutritionalHighlight: 'Curcumina + piperina pentru absorbție maximă'
      });
    }

    return missing;
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
    const shoppingList = {
      id: nid(),
      name: `Shopping pentru: ${recipe.name}`,
      items: recipe.ingredients.map(ingredient => {
        const available = pantryAvailable && $pantryInventory?.inventory?.[ingredient.name.toLowerCase()];
        const needed = Math.max(0, (ingredient.amount || 1) - (available?.quantity || 0));
        
        return {
          name: ingredient.name,
          quantity: needed,
          unit: ingredient.unit,
          category: categorizeIngredient(ingredient.name),
          checked: false,
          needed: needed > 0,
          available: available?.quantity || 0
        };
      }).filter(item => item.needed),
      generatedFrom: recipe.id,
      type: 'recipe',
      createdAt: new Date().toISOString()
    };

    // Add to pantry shopping lists if available
    if (pantryAvailable && pantryInventory) {
      pantryInventory.addShoppingList(shoppingList);
    }

    // Download as JSON if pantry not available
    if (!pantryAvailable) {
      const blob = new Blob([JSON.stringify(shoppingList, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopping-${recipe.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    showNotification(`📝 Listă de cumpărături generată pentru "${recipe.name}"!`, 'success');
  }

  function categorizeIngredient(name) {
    const lower = name.toLowerCase();
    if (/carn|pui|porc|vita|peste|ton/.test(lower)) return 'Carne și Pește';
    if (/lapte|iaurt|cas|smant|unt/.test(lower)) return 'Lactate';
    if (/tomat|castravet|morcov|ceap|usturoi|spanac|salat/.test(lower)) return 'Fructe și Legume';
    if (/paine|orez|paste|fain|malai/.test(lower)) return 'Pâine și Cereale';
    if (/sare|piper|boia|patrunjel|marar/.test(lower)) return 'Condimente';
    return 'Altele';
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, Arial;
      font-weight: 500;
      max-width: 350px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize suggestions on mount
  onMount(() => {
    generateSuggestions();
  });

  // Reactive regeneration
  $: if ($filters) {
    generateSuggestions();
  }
</script>

<div class="recipe-suggester">
  <div class="header">
    <div class="title-section">
      <h2>👨‍🍳 Recipe Suggester</h2>
      <div class="codex-info">
        <span class="badge codex">CODEX N-OMAD</span>
        {#if pantryAvailable}
          <span class="badge inventory">📦 Inventory Aware</span>
        {:else}
          <span class="badge standalone">🏃‍♂️ Standalone Mode</span>
        {/if}
      </div>
    </div>
    
    <div class="nutrition-cycle">
      <div class="cycle-indicator">
        <span class="label">mTOR Cycle:</span>
        <span class="phase {$nutritionProfile.currentPhase}">
          {$nutritionProfile.currentPhase === 'high' ? '🔥 High Protein' : '🌿 Plant Focus'}
        </span>
        <span class="day">Day {$nutritionProfile.cycleDay}/14</span>
      </div>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <label>Timp gătit:</label>
      <select bind:value={$filters.cookingTime}>
        <option value="all">Toate</option>
        <option value="quick">Rapid (< 30 min)</option>
        <option value="medium">Mediu (30-60 min)</option>
        <option value="slow">Îndelungat (> 60 min)</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Dificultate:</label>
      <select bind:value={$filters.difficulty}>
        <option value="all">Toate</option>
        <option value="easy">Ușor</option>
        <option value="medium">Mediu</option>
        <option value="advanced">Avansat</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Obiectiv nutrițional:</label>
      <select bind:value={$filters.nutritionalGoal}>
        <option value="all">Toate</option>
        <option value="mtor-high">mTOR High (Proteine)</option>
        <option value="anti-inflammatory">Anti-inflamator</option>
        <option value="plant-diversity">Diversitate plante</option>
      </select>
    </div>

    <div class="filter-group">
      <label>Tip masă:</label>
      <select bind:value={$filters.mealType}>
        <option value="all">Toate</option>
        <option value="breakfast">Mic dejun</option>
        <option value="lunch">Prânz</option>
        <option value="dinner">Cină</option>
        <option value="snack">Gustare</option>
      </select>
    </div>

    <div class="filter-toggles">
      <label class="toggle">
        <input type="checkbox" bind:checked={$filters.instantPot} />
        <span>🥘 Instant Pot</span>
      </label>
      
      {#if pantryAvailable}
        <label class="toggle">
          <input type="checkbox" bind:checked={$filters.availableOnly} />
          <span>📦 Doar cu ingrediente disponibile</span>
        </label>
      {/if}
    </div>
  </div>

  <div class="suggestions-grid">
    {#each $filteredSuggestions as recipe (recipe.id)}
      <div class="recipe-card">
        <div class="recipe-header">
          <h3>{recipe.name}</h3>
          <div class="recipe-badges">
            <span class="badge time">{recipe.cookingTime}</span>
            <span class="badge difficulty">{recipe.difficulty}</span>
            {#if recipe.instantPot}
              <span class="badge instant-pot">🥘 IP</span>
            {/if}
          </div>
        </div>

        <p class="description">{recipe.description}</p>

        <div class="nutrition-info">
          <div class="nutrition-item">
            <span class="icon">🌿</span>
            <span>{recipe.plantCount} plante</span>
          </div>
          <div class="nutrition-item">
            <span class="icon">💪</span>
            <span>{recipe.protein}g proteină</span>
          </div>
          {#if recipe.nutritionalGoals.includes('anti-inflammatory')}
            <div class="nutrition-item anti-inflammatory">
              <span class="icon">🔥</span>
              <span>Anti-inflamator</span>
            </div>
          {/if}
        </div>

        {#if pantryAvailable && $pantryInventory?.inventory}
          {@const availabilityScore = calculateAvailabilityScore(recipe.ingredients, $pantryInventory.inventory)}
          <div class="availability-bar">
            <div class="availability-fill" style="width: {availabilityScore}%"></div>
            <span class="availability-text">
              {Math.round(availabilityScore)}% ingrediente disponibile
            </span>
          </div>
        {/if}

        <div class="ingredients-preview">
          <h4>Ingrediente ({recipe.ingredients.length}):</h4>
          <div class="ingredients-list">
            {#each recipe.ingredients.slice(0, 6) as ingredient}
              <span class="ingredient-tag">
                {ingredient.name}
                {#if pantryAvailable && $pantryInventory?.inventory}
                  {@const available = $pantryInventory.inventory[ingredient.name.toLowerCase()]}
                  {#if available && available.quantity >= (ingredient.amount || 1)}
                    <span class="available">✅</span>
                  {:else}
                    <span class="missing">❌</span>
                  {/if}
                {/if}
              </span>
            {/each}
            {#if recipe.ingredients.length > 6}
              <span class="more">+{recipe.ingredients.length - 6} mai multe</span>
            {/if}
          </div>
        </div>

        <div class="recipe-actions">
          <button class="btn-primary" on:click={() => cookRecipe(recipe)}>
            👨‍🍳 Gătesc
          </button>
          <button class="btn-secondary" on:click={() => generateShoppingList(recipe)}>
            📝 Listă cumpărături
          </button>
        </div>

        {#if recipe.instantPot && recipe.instantPotInstructions}
          <div class="instant-pot-preview">
            <h4>🥘 Instant Pot Steps:</h4>
            <ol>
              {#each recipe.instantPotInstructions.slice(0, 3) as step}
                <li>{step}</li>
              {/each}
              {#if recipe.instantPotInstructions.length > 3}
                <li>... +{recipe.instantPotInstructions.length - 3} mai mulți pași</li>
              {/if}
            </ol>
          </div>
        {/if}

        {#if recipe.nutritionalHighlight}
          <div class="nutritional-highlight">
            <span class="icon">💡</span>
            <span>{recipe.nutritionalHighlight}</span>
          </div>
        {/if}
      </div>
    {/each}

    {#if $filteredSuggestions.length === 0}
      <div class="no-suggestions">
        <h3>🤷‍♂️ Nu am găsit rețete</h3>
        <p>Încearcă să modifici filtrele sau să adaugi mai multe ingrediente în inventar.</p>
        <button class="btn-secondary" on:click={() => {
          filters.update(f => ({
            ...f,
            cookingTime: 'all',
            difficulty: 'all',
            nutritionalGoal: 'all',
            availableOnly: false,
            instantPot: false,
            mealType: 'all'
          }));
        }}>
          🔄 Resetează filtrele
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .recipe-suggester {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: var(--panel, #2d2d2d);
    border-radius: 12px;
  }

  .title-section h2 {
    margin: 0 0 10px 0;
    color: var(--acc, #80b8ff);
    font-size: 1.8rem;
  }

  .codex-info {
    display: flex;
    gap: 10px;
  }

  .badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .badge.codex {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .badge.inventory {
    background: #4ade80;
    color: #0f172a;
  }

  .badge.standalone {
    background: #f59e0b;
    color: #0f172a;
  }

  .nutrition-cycle {
    text-align: right;
  }

  .cycle-indicator {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: flex-end;
  }

  .phase {
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
  }

  .phase.high {
    background: #dc2626;
    color: white;
  }

  .phase.low {
    background: #16a34a;
    color: white;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
    padding: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 12px;
  }

  .filter-group label {
    display: block;
    margin-bottom: 5px;
    color: var(--muted, #9aa3b2);
    font-weight: 500;
  }

  .filter-group select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border, #404040);
    border-radius: 6px;
    background: var(--bg, #0f1220);
    color: var(--ink, #e6e9ff);
  }

  .filter-toggles {
    grid-column: 1 / -1;
    display: flex;
    gap: 20px;
    margin-top: 10px;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
  }

  .recipe-card {
    background: var(--panel, #2d2d2d);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--border, #404040);
  }

  .recipe-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .recipe-header h3 {
    margin: 0;
    color: var(--acc, #80b8ff);
    font-size: 1.3rem;
  }

  .recipe-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .badge.time {
    background: #8b5cf6;
    color: white;
  }

  .badge.difficulty {
    background: #06b6d4;
    color: white;
  }

  .badge.instant-pot {
    background: #f97316;
    color: white;
  }

  .description {
    color: var(--muted, #9aa3b2);
    margin-bottom: 15px;
  }

  .nutrition-info {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  .nutrition-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
  }

  .nutrition-item.anti-inflammatory {
    color: #f97316;
  }

  .availability-bar {
    position: relative;
    height: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 10px;
    margin-bottom: 15px;
    overflow: hidden;
  }

  .availability-fill {
    height: 100%;
    background: linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #16a34a 100%);
    transition: width 0.3s ease;
  }

  .availability-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .ingredients-preview h4 {
    margin: 0 0 10px 0;
    color: var(--ink, #e6e9ff);
    font-size: 1rem;
  }

  .ingredients-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ingredient-tag {
    background: var(--panel2, #1a1a1a);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .available {
    color: #16a34a;
  }

  .missing {
    color: #dc2626;
  }

  .more {
    color: var(--muted, #9aa3b2);
    font-style: italic;
  }

  .recipe-actions {
    display: flex;
    gap: 10px;
    margin: 20px 0;
  }

  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    flex: 1;
  }

  .btn-secondary {
    background: var(--panel2, #1a1a1a);
    color: var(--ink, #e6e9ff);
    border: 1px solid var(--border, #404040);
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    flex: 1;
  }

  .instant-pot-preview {
    margin: 15px 0;
    padding: 15px;
    background: var(--panel2, #1a1a1a);
    border-radius: 8px;
    border-left: 4px solid #f97316;
  }

  .instant-pot-preview h4 {
    margin: 0 0 10px 0;
    color: #f97316;
    font-size: 1rem;
  }

  .instant-pot-preview ol {
    margin: 0;
    padding-left: 20px;
    color: var(--muted, #9aa3b2);
  }

  .nutritional-highlight {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid #10b981;
    border-radius: 8px;
    color: #10b981;
    font-size: 0.9rem;
    margin-top: 15px;
  }

  .no-suggestions {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: var(--muted, #9aa3b2);
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }

    .suggestions-grid {
      grid-template-columns: 1fr;
    }

    .filters {
      grid-template-columns: 1fr;
    }

    .filter-toggles {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>