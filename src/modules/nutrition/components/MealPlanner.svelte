<script>
  import { onMount } from 'svelte';
  import { CODEX_RECIPES } from '../data/codexRecipes.js';
  import { CodexScorer } from '../codex/codexScoring.js';
  import { CODEX_INGREDIENTS, getIngredientData } from '../codex/codexDatabase.js';
  
  const scorer = new CodexScorer();
  
  let currentWeek = getWeekDates(new Date());
  let mealPlan = {};
  let draggedRecipe = null;
  let shoppingList = [];
  let nutritionSummary = {};
  let showShoppingList = false;
  let selectedDay = null;
  
  // Reactive statement for shopping list categories
  $: categories = [...new Set(shoppingList.map(i => getCategoryForIngredient(i.name)))];
  
  // Load saved meal plan
  onMount(() => {
    loadMealPlan();
  });
  
  function getWeekDates(date) {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  }
  
  function formatDate(date) {
    return date.toLocaleDateString('ro-RO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }
  
  function loadMealPlan() {
    const saved = localStorage.getItem('codex_meal_plan');
    if (saved) {
      mealPlan = JSON.parse(saved);
    }
    calculateWeeklyNutrition();
  }
  
  function saveMealPlan() {
    localStorage.setItem('codex_meal_plan', JSON.stringify(mealPlan));
    calculateWeeklyNutrition();
    generateShoppingList();
  }
  
  function handleDragStart(event, recipe) {
    draggedRecipe = recipe;
    event.dataTransfer.effectAllowed = 'copy';
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
  
  function handleDrop(event, date) {
    event.preventDefault();
    if (draggedRecipe) {
      const dateKey = date.toISOString().split('T')[0];
      mealPlan[dateKey] = {
        recipe: draggedRecipe,
        score: scorer.scoreRecipe(draggedRecipe),
        date: dateKey
      };
      saveMealPlan();
      draggedRecipe = null;
    }
  }
  
  function removeMeal(dateKey) {
    delete mealPlan[dateKey];
    saveMealPlan();
  }
  
  function calculateWeeklyNutrition() {
    const summary = {
      totalCalories: 0,
      avgProtein: 0,
      avgFiber: 0,
      plantDiversity: new Set(),
      antiInflammatoryScore: 0,
      mealCount: 0
    };
    
    Object.values(mealPlan).forEach(meal => {
      if (meal.recipe) {
        summary.totalCalories += meal.recipe.totalCalories || 0;
        summary.mealCount++;
        
        // Track unique plants
        meal.recipe.ingredients.forEach(ing => {
          const data = getIngredientData(ing.name);
          if (data) {
            summary.plantDiversity.add(ing.name);
          }
        });
        
        // Add anti-inflammatory score
        if (meal.score) {
          summary.antiInflammatoryScore += meal.score.breakdown.antiInflammatory || 0;
        }
      }
    });
    
    if (summary.mealCount > 0) {
      summary.avgCalories = Math.round(summary.totalCalories / summary.mealCount);
      summary.avgAntiInflammatory = Math.round(summary.antiInflammatoryScore / summary.mealCount);
    }
    
    summary.plantCount = summary.plantDiversity.size;
    nutritionSummary = summary;
  }
  
  function generateShoppingList() {
    const ingredients = new Map();
    
    Object.values(mealPlan).forEach(meal => {
      if (meal.recipe) {
        meal.recipe.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (ingredients.has(key)) {
            const existing = ingredients.get(key);
            existing.amount += ing.amount;
          } else {
            ingredients.set(key, {
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              data: getIngredientData(ing.name)
            });
          }
        });
      }
    });
    
    // Sort by category
    shoppingList = Array.from(ingredients.values()).sort((a, b) => {
      const catA = getCategoryForIngredient(a.name);
      const catB = getCategoryForIngredient(b.name);
      return catA.localeCompare(catB);
    });
  }
  
  function getCategoryForIngredient(name) {
    const categories = {
      'Legume': ['spinach', 'kale', 'broccoli', 'carrot', 'tomato', 'cabbage', 'potato'],
      'Leguminoase': ['lentils', 'chickpeas', 'beans'],
      'Cereale': ['quinoa', 'rice', 'oats', 'barley'],
      'Proteine': ['chicken', 'salmon', 'eggs', 'yogurt'],
      'Nuci/Semințe': ['walnuts', 'almonds', 'flax', 'chia'],
      'Condimente': ['turmeric', 'ginger', 'garlic', 'pepper'],
      'Uleiuri': ['olive oil'],
      'Altele': []
    };
    
    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => name.toLowerCase().includes(item))) {
        return category;
      }
    }
    return 'Altele';
  }
  
  function exportMealPlan() {
    const exportData = {
      week: currentWeek[0].toISOString(),
      mealPlan: mealPlan,
      nutritionSummary: nutritionSummary,
      shoppingList: shoppingList,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-plan-${currentWeek[0].toISOString().split('T')[0]}.json`;
    a.click();
  }

  function exportShoppingList() {
    console.log('📋 Exporting shopping list...');
    
    if (!shoppingList || shoppingList.length === 0) {
      alert('Nu există ingrediente în lista de cumpărături');
      return;
    }

    // Colectează toate ingredients din planned meals
    const collectedIngredients = new Map();
    
    // Group ingredients by category
    Object.values(mealPlan).forEach(meal => {
      if (meal && meal.recipe && meal.recipe.ingredients) {
        meal.recipe.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const category = getCategoryForIngredient(ingredient.name);
          
          if (collectedIngredients.has(key)) {
            const existing = collectedIngredients.get(key);
            existing.totalAmount += ingredient.amount || 0;
          } else {
            collectedIngredients.set(key, {
              name: ingredient.name,
              totalAmount: ingredient.amount || 0,
              unit: ingredient.unit || 'g',
              category: category,
              meals: [meal.recipe.name || 'Unknown meal']
            });
          }
        });
      }
    });

    // Format for export
    const exportData = {
      week: `Săptămâna ${currentWeek[0].toLocaleDateString('ro-RO')} - ${currentWeek[6].toLocaleDateString('ro-RO')}`,
      totalItems: collectedIngredients.size,
      categorizedList: {},
      generatedAt: new Date().toISOString(),
      estimatedCost: 0
    };

    // Group by categories
    const categories = [...new Set([...collectedIngredients.values()].map(i => i.category))];
    
    categories.forEach(category => {
      exportData.categorizedList[category] = [];
      
      [...collectedIngredients.values()]
        .filter(item => item.category === category)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(item => {
          // Estimate cost (basic Romanian prices)
          const estimatedCostPerKg = {
            'Proteine': 30, 'Lactate': 8, 'Legume': 6, 'Fructe': 10,
            'Cereale': 5, 'Condimente': 20, 'Altele': 8
          };
          const cost = (item.totalAmount / 1000) * (estimatedCostPerKg[category] || 8);
          exportData.estimatedCost += cost;
          
          exportData.categorizedList[category].push({
            nume: item.name,
            cantitate: `${Math.round(item.totalAmount * 10) / 10}${item.unit}`,
            costEstimat: `${Math.round(cost * 100) / 100} RON`,
            folosit_in: item.meals.join(', ')
          });
        });
    });

    exportData.estimatedCost = `${Math.round(exportData.estimatedCost * 100) / 100} RON`;

    // Export as both JSON and text
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], 
      { type: 'application/json' });
    
    // Create readable text version
    const textContent = [
      `LISTĂ CUMPĂRĂTURI - ${exportData.week}`,
      `Generat: ${new Date().toLocaleString('ro-RO')}`,
      `Total articole: ${exportData.totalItems}`,
      `Cost estimat: ${exportData.estimatedCost}`,
      '',
      '═══════════════════════════════════════',
      ''
    ];

    Object.entries(exportData.categorizedList).forEach(([category, items]) => {
      if (items.length > 0) {
        textContent.push(`📦 ${category.toUpperCase()}`);
        textContent.push('─'.repeat(30));
        items.forEach(item => {
          textContent.push(`• ${item.nume} - ${item.cantitate} (${item.costEstimat})`);
        });
        textContent.push('');
      }
    });

    const textBlob = new Blob([textContent.join('\n')], 
      { type: 'text/plain; charset=utf-8' });

    // Download JSON file
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `shopping-list-${currentWeek[0].toISOString().split('T')[0]}.json`;
    jsonLink.click();
    
    // Download text file
    setTimeout(() => {
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `shopping-list-${currentWeek[0].toISOString().split('T')[0]}.txt`;
      textLink.click();
      URL.revokeObjectURL(textUrl);
    }, 100);
    
    URL.revokeObjectURL(jsonUrl);
    
    console.log('✅ Shopping list exported successfully!');
  }
  
  function nextWeek() {
    const nextMonday = new Date(currentWeek[0]);
    nextMonday.setDate(nextMonday.getDate() + 7);
    currentWeek = getWeekDates(nextMonday);
    loadMealPlan();
  }
  
  function prevWeek() {
    const prevMonday = new Date(currentWeek[0]);
    prevMonday.setDate(prevMonday.getDate() - 7);
    currentWeek = getWeekDates(prevMonday);
    loadMealPlan();
  }
</script>

<div class="meal-planner">
  <div class="planner-header">
    <h2>📅 CODEX Meal Planner</h2>
    <p class="subtitle">Evidence-based meal planning with automatic nutrition optimization</p>
  </div>

  <div class="week-navigation">
    <button on:click={prevWeek}>⬅️ Previous Week</button>
    <span class="week-label">
      {currentWeek[0].toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })} - 
      {currentWeek[6].toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
    </span>
    <button on:click={nextWeek}>Next Week ➡️</button>
  </div>

  <div class="planner-grid">
    <div class="recipes-sidebar">
      <h3>🍽️ Available Recipes</h3>
      <p class="instructions">Drag recipes to calendar days</p>
      
      <div class="recipes-list">
        {#each CODEX_RECIPES as recipe}
          <div 
            class="recipe-item"
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, recipe)}>
            <div class="recipe-header">
              <span class="recipe-name">{recipe.name}</span>
              <span class="recipe-calories">{recipe.totalCalories} kcal</span>
            </div>
            <div class="recipe-tags">
              <span class="tag">{recipe.category}</span>
              {#if recipe.evidence.diversity}
                <span class="tag plants">{recipe.evidence.diversity.plantCount} plants</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="calendar-grid">
      {#each currentWeek as day}
        {@const dateKey = day.toISOString().split('T')[0]}
        {@const meal = mealPlan[dateKey]}
        <div 
          class="day-cell"
          class:has-meal={meal}
          on:dragover={handleDragOver}
          on:drop={(e) => handleDrop(e, day)}>
          
          <div class="day-header">
            <span class="day-name">{formatDate(day)}</span>
            {#if day.toDateString() === new Date().toDateString()}
              <span class="today-badge">TODAY</span>
            {/if}
          </div>
          
          {#if meal}
            <div class="meal-card">
              <button 
                class="remove-btn"
                on:click={() => removeMeal(dateKey)}>
                ✖️
              </button>
              
              <h4>{meal.recipe.name}</h4>
              
              <div class="meal-stats">
                <span>🔥 {meal.recipe.totalCalories} kcal</span>
                {#if meal.score}
                  <span>💯 Score: {meal.score.overall}</span>
                {/if}
              </div>
              
              {#if meal.recipe.evidence}
                <div class="evidence-badges">
                  {#if meal.recipe.evidence.antiInflammatory}
                    <span class="evidence-badge">
                      Anti-inflam: {meal.recipe.evidence.antiInflammatory.score}
                    </span>
                  {/if}
                  {#if meal.recipe.evidence.diversity}
                    <span class="evidence-badge">
                      {meal.recipe.evidence.diversity.plantCount} plants
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
          {:else}
            <div class="empty-day">
              <span class="drop-hint">Drop recipe here</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="nutrition-summary">
    <h3>📊 Weekly Nutrition Analysis</h3>
    
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">Total Calories</span>
        <span class="summary-value">{nutritionSummary.totalCalories || 0}</span>
        <span class="summary-note">for {nutritionSummary.mealCount || 0} meals</span>
      </div>
      
      <div class="summary-card">
        <span class="summary-label">Avg Calories/Meal</span>
        <span class="summary-value">{nutritionSummary.avgCalories || 0}</span>
        <span class="summary-note">Target: 2500 kcal</span>
      </div>
      
      <div class="summary-card">
        <span class="summary-label">Plant Diversity</span>
        <span class="summary-value">{nutritionSummary.plantCount || 0}</span>
        <span class="summary-note">Target: 30+ plants/week</span>
      </div>
      
      <div class="summary-card">
        <span class="summary-label">Anti-Inflammatory</span>
        <span class="summary-value">{nutritionSummary.avgAntiInflammatory || 0}</span>
        <span class="summary-note">Average score</span>
      </div>
    </div>
    
    {#if nutritionSummary.plantCount < 30}
      <div class="alert warning">
        ⚠️ Plant diversity below target. Add {30 - nutritionSummary.plantCount} more unique plants.
      </div>
    {/if}
    
    {#if nutritionSummary.avgCalories && Math.abs(nutritionSummary.avgCalories - 2500) > 300}
      <div class="alert warning">
        ⚠️ Calorie average ({nutritionSummary.avgCalories}) differs from target (2500).
      </div>
    {/if}
  </div>

  <div class="actions-bar">
    <button 
      class="action-btn primary"
      on:click={() => { generateShoppingList(); showShoppingList = true; }}>
      🛒 Generate Shopping List
    </button>
    
    <button 
      class="action-btn"
      on:click={exportMealPlan}>
      📥 Export Week Plan
    </button>
  </div>

  {#if showShoppingList}
    <div class="shopping-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🛒 Shopping List</h3>
          <button 
            class="close-btn"
            on:click={() => showShoppingList = false}>
            ✖️
          </button>
        </div>
        
        <div class="shopping-categories">
          {#each categories as category}
            <div class="category-section">
              <h4>{category}</h4>
              <div class="items-list">
                {#each shoppingList.filter(i => getCategoryForIngredient(i.name) === category) as item}
                  <div class="shopping-item">
                    <input type="checkbox" id={item.name} />
                    <label for={item.name}>
                      <span class="item-name">{item.name}</span>
                      <span class="item-amount">{item.amount}{item.unit}</span>
                    </label>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="modal-actions">
          <button 
            class="action-btn"
            on:click={() => {
              const text = shoppingList.map(i => 
                `☐ ${i.name}: ${i.amount}${i.unit}`
              ).join('\n');
              navigator.clipboard.writeText(text);
            }}>
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .meal-planner {
    padding: 20px;
    max-width: 1600px;
    margin: 0 auto;
  }

  .planner-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 5px;
  }

  .week-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .week-navigation button {
    padding: 8px 16px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
  }

  .week-navigation button:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
  }

  .week-label {
    font-weight: 600;
    color: #1f2937;
  }

  .planner-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 25px;
    margin-bottom: 30px;
  }

  .recipes-sidebar {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    max-height: 600px;
    overflow-y: auto;
  }

  .instructions {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 15px;
  }

  .recipes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .recipe-item {
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    cursor: move;
    transition: all 0.3s;
  }

  .recipe-item:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102,126,234,0.2);
  }

  .recipe-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .recipe-name {
    font-weight: 600;
    font-size: 14px;
  }

  .recipe-calories {
    font-size: 12px;
    color: #6b7280;
  }

  .recipe-tags {
    display: flex;
    gap: 6px;
  }

  .tag {
    padding: 2px 8px;
    background: white;
    border-radius: 12px;
    font-size: 11px;
    color: #6b7280;
  }

  .tag.plants {
    background: #d1fae5;
    color: #065f46;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 15px;
  }

  .day-cell {
    background: white;
    border: 2px dashed #e5e7eb;
    border-radius: 12px;
    padding: 15px;
    min-height: 180px;
    transition: all 0.3s;
  }

  .day-cell.has-meal {
    border-style: solid;
  }

  .day-cell:hover {
    border-color: #667eea;
  }

  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .day-name {
    font-weight: 600;
    font-size: 13px;
    color: #374151;
  }

  .today-badge {
    padding: 2px 6px;
    background: #fbbf24;
    color: white;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  }

  .meal-card {
    position: relative;
    padding: 10px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.5;
    transition: opacity 0.3s;
  }

  .remove-btn:hover {
    opacity: 1;
  }

  .meal-card h4 {
    font-size: 13px;
    margin-bottom: 8px;
    color: #1f2937;
  }

  .meal-stats {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .evidence-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .evidence-badge {
    padding: 2px 6px;
    background: #ede9fe;
    color: #5b21b6;
    border-radius: 4px;
    font-size: 10px;
  }

  .empty-day {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
  }

  .drop-hint {
    color: #d1d5db;
    font-size: 12px;
  }

  .nutrition-summary {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .summary-card {
    text-align: center;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .summary-label {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
  }

  .summary-value {
    display: block;
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 4px;
  }

  .summary-note {
    display: block;
    font-size: 11px;
    color: #9ca3af;
  }

  .alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .alert.warning {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fbbf24;
  }

  .actions-bar {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 25px;
  }

  .action-btn {
    padding: 12px 24px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  }

  .shopping-modal {
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
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
  }

  .shopping-categories {
    padding: 20px;
  }

  .category-section {
    margin-bottom: 25px;
  }

  .category-section h4 {
    color: #667eea;
    margin-bottom: 12px;
    font-size: 14px;
    text-transform: uppercase;
  }

  .shopping-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .shopping-item label {
    display: flex;
    justify-content: space-between;
    flex: 1;
    margin-left: 12px;
    cursor: pointer;
  }

  .item-name {
    font-weight: 500;
  }

  .item-amount {
    color: #6b7280;
    font-size: 14px;
  }

  .modal-actions {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
  }

  @media (max-width: 1024px) {
    .planner-grid {
      grid-template-columns: 1fr;
    }
    
    .calendar-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (max-width: 768px) {
    .calendar-grid {
      grid-template-columns: 1fr;
    }
    
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
</style>