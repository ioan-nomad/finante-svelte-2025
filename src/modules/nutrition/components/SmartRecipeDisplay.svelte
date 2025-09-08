<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import SmartRecipeGenerator from '../codex/SmartRecipeGenerator.js';
  import NutritionAnalyzer from '../analysis/NutritionAnalyzer.js';
  import { nutritionProfile } from '../stores/nutritionStore.js';
  import { groceryInventory } from '../../pantry/stores/pantryStore.js';

  // Initialize engines
  const recipeGenerator = new SmartRecipeGenerator();
  const nutritionAnalyzer = new NutritionAnalyzer();

  // Component state
  let generatedRecipe = null;
  let nutritionalAnalysis = null;
  let isGenerating = false;
  let pantryItems = [];
  let error = null;

  // Generate recipe on mount
  onMount(async () => {
    await loadPantryItems();
    await generateSmartRecipe();
  });

  /**
   * Load available pantry items
   */
  async function loadPantryItems() {
    try {
      const inventory = get(groceryInventory);
      pantryItems = inventory.inventory || [];
    } catch (e) {
      pantryItems = [
        // Mock data when pantry is not available
        { id: 1, name: 'Broccoli', quantity: 300, category: 'Legume' },
        { id: 2, name: 'Somon', quantity: 200, category: 'Pește' },
        { id: 3, name: 'Spanac', quantity: 150, category: 'Legume' },
        { id: 4, name: 'Quinoa', quantity: 100, category: 'Cereale' },
        { id: 5, name: 'Avocado', quantity: 2, category: 'Fructe' }
      ];
    }
  }

  /**
   * Generate smart recipe based on deficiencies and pantry
   */
  async function generateSmartRecipe() {
    isGenerating = true;
    error = null;

    try {
      // Get current nutrition profile and meal history
      const profile = get(nutritionProfile);
      const recentMeals = profile.mealHistory?.slice(-7) || [];

      // Analyze nutritional status
      nutritionalAnalysis = nutritionAnalyzer.analyzeNutritionalStatus(
        profile,
        recentMeals,
        profile.biomarkers || {}
      );

      // Extract deficiencies for recipe targeting
      const deficiencies = {};
      nutritionalAnalysis.deficiencies.forEach(def => {
        deficiencies[def.nutrient] = def.deficitPercent;
      });

      // Generate targeted recipe
      generatedRecipe = recipeGenerator.generateTargetedRecipe(
        pantryItems,
        deficiencies,
        {
          cookingMethod: 'instant_pot',
          maxIngredients: 8,
          maxCookingTime: 30
        }
      );

    } catch (e) {
      error = `Eroare la generarea rețetei: ${e.message}`;
      console.error('Recipe generation error:', e);
    } finally {
      isGenerating = false;
    }
  }

  /**
   * Format nutrient amount with unit
   */
  function formatNutrient(amount, unit = 'g') {
    if (amount < 1 && unit !== '%') {
      return `${(amount * 1000).toFixed(0)} m${unit}`;
    }
    return `${Math.round(amount)} ${unit}`;
  }

  /**
   * Get color for nutrient status
   */
  function getStatusColor(status) {
    const colors = {
      excellent: '#4CAF50',
      good: '#8BC34A',
      moderate: '#FF9800',
      minimal: '#f44336',
      critical: '#d32f2f'
    };
    return colors[status] || '#666';
  }

  /**
   * Get improvement level emoji
   */
  function getImprovementEmoji(level) {
    const emojis = {
      excellent: '🎯',
      good: '✅', 
      moderate: '⚡',
      minimal: '⚠️'
    };
    return emojis[level] || '📊';
  }
</script>

<div class="smart-recipe-container">
  {#if error}
    <div class="error-message">
      <h3>❌ {error}</h3>
      <button on:click={generateSmartRecipe} class="retry-btn">🔄 Încearcă din nou</button>
    </div>
  {:else if isGenerating}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <h3>🧠 Generez rețeta personalizată...</h3>
      <p>Analizez deficiențele nutriționale și inventarul disponibil</p>
    </div>
  {:else if generatedRecipe}
    <div class="recipe-display">
      
      <!-- Recipe Header -->
      <div class="recipe-header">
        <h2>🍽️ {generatedRecipe.name}</h2>
        <p class="recipe-description">{generatedRecipe.description}</p>
        
        <div class="recipe-meta">
          <span class="meta-item">⏱️ {generatedRecipe.totalTime} min</span>
          <span class="meta-item">🥄 {generatedRecipe.servings} porție OMAD</span>
          <span class="meta-item">⚡ Instant Pot</span>
          <span class="meta-item">📊 Dificultate: {generatedRecipe.difficulty}</span>
        </div>
      </div>

      <!-- Nutritional Targeting -->
      <div class="nutritional-targeting">
        <h3>🎯 Deficiențe Țintite</h3>
        <div class="deficiencies-grid">
          {#each generatedRecipe.targetedDeficiencies as deficiency}
            <div class="deficiency-card">
              <span class="nutrient-name">{deficiency.nutrient}</span>
              <span class="severity {deficiency.severity}">{deficiency.severity}</span>
              <span class="deficit">{Math.round(deficiency.deficitPercent * 100)}% lipsă</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Instant Pot Stratification -->
      <div class="instant-pot-section">
        <h3>⚡ INSTANT POT - Stratificare Obligatorie</h3>
        <div class="important-note">
          <p><strong>{generatedRecipe.instantPot.layers.importantNote}</strong></p>
        </div>

        <div class="layering-instructions">
          {#each generatedRecipe.instantPot.layers.instructions as instruction}
            <div class="layer-instruction">
              <div class="step-header">
                <span class="step-number">PASUL {instruction.step}</span>
                <h4>{instruction.title}</h4>
              </div>
              
              <div class="step-content">
                <div class="action">{instruction.action}</div>
                {#if instruction.ingredients}
                  <div class="ingredients-list">
                    <strong>Ingrediente:</strong> {instruction.ingredients}
                  </div>
                {/if}
                <div class="cooking-note">💡 {instruction.note}</div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Cooking Settings -->
        <div class="cooking-settings">
          <div class="setting">
            <span class="label">⏱️ Timp gătire:</span>
            <span class="value">{generatedRecipe.instantPot.cookingTime} minute</span>
          </div>
          <div class="setting">
            <span class="label">⚡ Presiune:</span>
            <span class="value">{generatedRecipe.instantPot.pressure}</span>
          </div>
          <div class="setting">
            <span class="label">💧 Lichid necesar:</span>
            <span class="value">{generatedRecipe.instantPot.liquidRequirements.minimum}</span>
          </div>
        </div>
      </div>

      <!-- Ingredients List -->
      <div class="ingredients-section">
        <h3>🛒 Ingrediente ({generatedRecipe.ingredients.length})</h3>
        <div class="ingredients-list">
          {#each generatedRecipe.ingredients as ingredient}
            <div class="ingredient-item">
              <span class="amount">{ingredient.amount}{ingredient.unit}</span>
              <span class="name">{ingredient.name}</span>
              <span class="category">{ingredient.category}</span>
              {#if ingredient.pantryId}
                <span class="pantry-tag">📦 Din pantry</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Nutritional Impact -->
      <div class="nutrition-impact">
        <h3>📊 Impact Nutrițional</h3>
        
        <!-- Deficiencies Addressed -->
        <div class="deficiencies-addressed">
          <h4>✅ Deficiențe Adresate</h4>
          {#each generatedRecipe.nutrition.deficienciesAddressed as addressed}
            <div class="addressed-item">
              <div class="nutrient-row">
                <span class="improvement-icon">{getImprovementEmoji(addressed.improvementLevel)}</span>
                <span class="nutrient">{addressed.nutrient}</span>
                <span class="provided">{addressed.provided}{addressed.nutrient.includes('vitamin') ? 'mg' : 'g'}</span>
                <span class="coverage" style="color: {getStatusColor(addressed.improvementLevel)}">
                  {addressed.percentageCovered}%
                </span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" 
                     style="width: {Math.min(addressed.percentageCovered, 100)}%; background: {getStatusColor(addressed.improvementLevel)}">
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Scores -->
        <div class="health-scores">
          <div class="score-item">
            <span class="score-label">🔥 Anti-inflamator</span>
            <span class="score-value">{generatedRecipe.nutrition.antiInflammatoryScore}/100</span>
          </div>
          <div class="score-item">
            <span class="score-label">🧬 Longevitate</span>
            <span class="score-value">{generatedRecipe.nutrition.longevityScore}/100</span>
          </div>
        </div>
      </div>

      <!-- Daily Targets Coverage -->
      <div class="daily-targets">
        <h3>🎯 Acoperire Ținte Zilnice</h3>
        <div class="targets-grid">
          {#each Object.entries(generatedRecipe.nutrition.dailyTargetsCovered) as [nutrient, data]}
            {#if data.percentage > 10}
              <div class="target-item">
                <div class="target-header">
                  <span class="nutrient-name">{nutrient}</span>
                  <span class="percentage {data.status}">{data.percentage}%</span>
                </div>
                <div class="target-amounts">
                  <span>{data.provided}</span> / <span>{data.target}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" 
                       style="width: {Math.min(data.percentage, 100)}%; background: {getStatusColor(data.status)}">
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <!-- Actions -->
      <div class="recipe-actions">
        <button on:click={generateSmartRecipe} class="action-btn primary">
          🔄 Generează Altă Rețetă
        </button>
        <button class="action-btn secondary">
          📱 Salvează Rețeta
        </button>
        <button class="action-btn secondary">
          🛒 Adaugă în Shopping List
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .smart-recipe-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', sans-serif;
  }

  .error-message, .loading-container {
    text-align: center;
    padding: 40px;
    border-radius: 12px;
    margin: 20px 0;
  }

  .error-message {
    background: #ffebee;
    border: 2px solid #f44336;
    color: #c62828;
  }

  .loading-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e3f2fd;
    border-top: 4px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .recipe-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 16px;
    margin-bottom: 24px;
    text-align: center;
  }

  .recipe-header h2 {
    font-size: 2.2rem;
    margin: 0 0 12px 0;
    font-weight: 700;
  }

  .recipe-description {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0 0 20px 0;
    line-height: 1.6;
  }

  .recipe-meta {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .meta-item {
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
  }

  .nutritional-targeting {
    background: #fff3e0;
    border: 2px solid #ff9800;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .nutritional-targeting h3 {
    color: #e65100;
    margin: 0 0 16px 0;
  }

  .deficiencies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .deficiency-card {
    background: white;
    padding: 12px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #ffcc02;
  }

  .nutrient-name {
    font-weight: 600;
  }

  .severity.critical {
    background: #f44336;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  .severity.moderate {
    background: #ff9800;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  .instant-pot-section {
    background: linear-gradient(135deg, #e8f5e8 0%, #d4edd4 100%);
    border: 2px solid #4caf50;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .instant-pot-section h3 {
    color: #2e7d32;
    margin: 0 0 16px 0;
    font-size: 1.5rem;
  }

  .important-note {
    background: #ffccbc;
    border: 2px solid #ff5722;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .important-note p {
    margin: 0;
    color: #d84315;
    font-weight: 600;
  }

  .layering-instructions {
    margin-bottom: 20px;
  }

  .layer-instruction {
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
    border: 1px solid #ddd;
  }

  .step-header {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .step-number {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .step-header h4 {
    margin: 0;
    font-size: 1.1rem;
  }

  .step-content {
    padding: 16px;
  }

  .action {
    font-weight: 600;
    color: #2e7d32;
    margin-bottom: 8px;
  }

  .ingredients-list {
    color: #666;
    margin-bottom: 8px;
  }

  .cooking-note {
    background: #f3e5f5;
    border: 1px solid #9c27b0;
    border-radius: 6px;
    padding: 8px;
    font-size: 0.9rem;
    color: #4a148c;
  }

  .cooking-settings {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting .label {
    font-weight: 500;
    color: #666;
  }

  .setting .value {
    font-weight: 600;
    color: #2e7d32;
  }

  .ingredients-section {
    background: #f9f9f9;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .ingredients-list {
    display: grid;
    gap: 8px;
  }

  .ingredient-item {
    background: white;
    padding: 12px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 80px 1fr 100px auto;
    gap: 12px;
    align-items: center;
    border: 1px solid #e0e0e0;
  }

  .ingredient-item .amount {
    font-weight: 600;
    color: #1976d2;
  }

  .ingredient-item .name {
    font-weight: 500;
  }

  .ingredient-item .category {
    color: #666;
    font-size: 0.9rem;
  }

  .pantry-tag {
    background: #e8f5e8;
    color: #2e7d32;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  .nutrition-impact {
    background: white;
    border: 2px solid #2196f3;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .addressed-item {
    margin-bottom: 16px;
  }

  .nutrient-row {
    display: grid;
    grid-template-columns: 30px 1fr 80px 60px;
    gap: 12px;
    align-items: center;
    margin-bottom: 6px;
  }

  .progress-bar {
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .health-scores {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }

  .score-item {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
    padding: 16px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .score-value {
    font-weight: 700;
    font-size: 1.2rem;
    color: #4a148c;
  }

  .daily-targets {
    background: #f3e5f5;
    border: 2px solid #9c27b0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .targets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .target-item {
    background: white;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .target-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .percentage.complete { color: #4caf50; font-weight: 600; }
  .percentage.good { color: #8bc34a; font-weight: 600; }
  .percentage.moderate { color: #ff9800; font-weight: 600; }
  .percentage.low { color: #f44336; font-weight: 600; }

  .target-amounts {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }

  .recipe-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .action-btn.secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
  }

  .action-btn.secondary:hover {
    background: #eeeeee;
  }

  .retry-btn {
    background: #f44336;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 16px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .smart-recipe-container {
      padding: 10px;
    }

    .recipe-header {
      padding: 20px;
    }

    .recipe-header h2 {
      font-size: 1.8rem;
    }

    .recipe-meta {
      gap: 10px;
    }

    .meta-item {
      font-size: 0.8rem;
      padding: 4px 8px;
    }

    .deficiencies-grid,
    .targets-grid {
      grid-template-columns: 1fr;
    }

    .nutrient-row {
      grid-template-columns: 24px 1fr 60px 50px;
      gap: 8px;
    }

    .ingredient-item {
      grid-template-columns: 60px 1fr;
      gap: 8px;
    }

    .ingredient-item .category,
    .ingredient-item .pantry-tag {
      grid-column: 2;
      margin-top: 4px;
    }

    .recipe-actions {
      flex-direction: column;
    }

    .action-btn {
      width: 100%;
    }
  }
</style>