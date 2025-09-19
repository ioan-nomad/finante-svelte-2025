<!-- modules/nutrition/NutritionModule.svelte -->
<script>
  import { onMount } from 'svelte';

  // Import nutrition components
  import RecipeSuggester from './components/RecipeSuggester.svelte';
  import BiomarkerTracking from './components/BiomarkerTracking.svelte';
  import MealPlanner from './components/MealPlanner.svelte';
  import CodexDashboard from './components/CodexDashboard.svelte';
  import CodexRecipeUI from './components/CodexRecipeUI.svelte';

  // Import CODEX N-OMAD v3.0 Components
  import RecipeDisplay from './codex/RecipeDisplay.svelte';
  import { ProfileEngine, CodexIntegration, NutrientDatabase } from './codex/CodexCore.js';
  import { initializeNutrientDatabase } from './codex/database/nutrients.js';
  import { CookingMethodIntegration } from './codex/CookingMethods.js';
  import { RecipeEngine } from './RecipeEngine.js';

  // Import nutrition stores
  import {
    nutritionProfile,
    weeklyProgress,
    todaysRecommendations
  } from './stores/nutritionStore.js';

  let activeTab = 'recipes';
  let isLoading = false;

  // Future components (placeholders)
  let CodexDatabase = null;
  let NutritionTracker = null;

  // CODEX N-OMAD v3.0 State
  let currentProfile = "ioan";
  let recipeData = null;
  let nutritionAnalysis = null;
  let isGeneratingRecipe = false;
  let isAnalyzingNutrition = false;
  let recipeEngine = null;

  // mTOR Tracker state
  let mtorData = {
    protein: 0,
    leucine: 0,
    carbs: 0,
    fasting: 0,
    score: 0
  };

  const tabs = [
    { id: 'recipes', label: 'Recipe Suggester', icon: '🍳' },
    { id: 'planner', label: 'Meal Planner', icon: '📅' },
    { id: 'codex', label: 'CODEX Database', icon: '🧬' },
    { id: 'mtor', label: 'mTOR Tracker', icon: '⚡' }
  ];

  onMount(async () => {
    console.log('🍽️ Nutrition Module loaded');

    // Initialize CODEX N-OMAD v3.0 Database
    try {
      initializeNutrientDatabase(NutrientDatabase);
      console.log('🧬 CODEX N-OMAD v3.0 initialized with complete nutrient database');

      // Initialize RecipeEngine
      recipeEngine = new RecipeEngine();
      console.log('🚀 RecipeEngine v3.0 initialized with orchestration system');
    } catch (error) {
      console.log('CODEX initialization skipped - components not available');
    }

    // Load saved tab preference
    const savedTab = localStorage.getItem('nutritionActiveTab');
    if (savedTab) {
      activeTab = savedTab;
    }

    // Load mTOR data
    loadMTORData();
  });

  function switchTab(tabId) {
    activeTab = tabId;
    localStorage.setItem('nutritionActiveTab', tabId);
  }

  function loadMTORData() {
    const stored = localStorage.getItem('mtorData');
    if (stored) {
      try {
        mtorData = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading mTOR data:', e);
      }
    }
  }

  function saveMTORData() {
    localStorage.setItem('mtorData', JSON.stringify(mtorData));
  }

  function calculateMTORScore() {
    // Simple mTOR activation score calculation
    const proteinScore = Math.min(mtorData.protein / 30, 1) * 30; // Target: 30g protein
    const leucineScore = Math.min(mtorData.leucine / 2.5, 1) * 25; // Target: 2.5g leucine
    const carbScore = Math.min(mtorData.carbs / 50, 1) * 20; // Target: 50g carbs
    const fastingPenalty = mtorData.fasting > 16 ? -10 : 0; // Penalty for long fasting

    mtorData.score = Math.max(0, proteinScore + leucineScore + carbScore + fastingPenalty);
    saveMTORData();
  }

  function updateMTORValue(field, value) {
    mtorData[field] = parseFloat(value) || 0;
    calculateMTORScore();
  }

  // CODEX N-OMAD v3.0 Event Handlers
  async function handleGenerateRecipe(event) {
    if (!recipeEngine) return;

    isGeneratingRecipe = true;
    const profile = event.detail?.profile || currentProfile;

    try {
      // Switch to selected profile
      recipeEngine.switchProfile(profile);

      // Generate complete OMAD recipe with orchestration
      const completeRecipe = await recipeEngine.generateOMADRecipe({
        preferences: event.detail?.preferences || {},
        dietaryRestrictions: profile === 'nico' ? ['mushrooms'] : []
      });

      recipeData = completeRecipe;
      nutritionAnalysis = completeRecipe.nutrition;

      console.log('🔄 Generated complete OMAD recipe:', completeRecipe);
    } catch (error) {
      console.error('Recipe generation error:', error);
    } finally {
      isGeneratingRecipe = false;
    }
  }

  async function handleNutritionAnalysis(event) {
    isAnalyzingNutrition = true;

    try {
      const analysis = await CodexIntegration.analyzeNutrition(event.detail.ingredients);
      nutritionAnalysis = analysis;

      console.log('🧬 Nutrition analysis complete:', analysis);
    } catch (error) {
      console.error('Nutrition analysis error:', error);
    } finally {
      isAnalyzingNutrition = false;
    }
  }
</script>

<div class="nutrition-container">
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <div>Se încarcă...</div>
    </div>
  {:else}
    <!-- Module Header -->
    <div class="module-header">
      <h1 class="module-title">
        <span>🍽️</span>
        Nutrition Management
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
      {#if activeTab === 'recipes'}
        <div class="recipes-section">
          <h3>🍳 Recipe Suggester</h3>
          <RecipeSuggester
            on:generateRecipe={handleGenerateRecipe}
            {isGeneratingRecipe}
          />

          {#if recipeData}
            <div class="recipe-display">
              <h4>Generated Recipe</h4>
              <RecipeDisplay recipe={recipeData} analysis={nutritionAnalysis} />
            </div>
          {/if}
        </div>

      {:else if activeTab === 'planner'}
        <div class="planner-section">
          <h3>📅 Meal Planner</h3>
          <MealPlanner />

          <div class="codex-ui">
            <h4>🧬 CODEX Recipe Generator</h4>
            <CodexRecipeUI
              on:generateRecipe={handleGenerateRecipe}
              on:analyzeNutrition={handleNutritionAnalysis}
              {isGeneratingRecipe}
              {isAnalyzingNutrition}
            />
          </div>
        </div>

      {:else if activeTab === 'codex'}
        <div class="codex-section">
          <h3>🧬 CODEX Database</h3>
          <CodexDashboard />

          <div class="biomarker-tracking">
            <h4>📊 Biomarker Tracking</h4>
            <BiomarkerTracking />
          </div>

          <div class="codex-placeholder">
            <p>🚀 Advanced CODEX features:</p>
            <ul>
              <li>🧬 Complete nutrient database</li>
              <li>🔬 Biomarker optimization</li>
              <li>🍳 Smart recipe generation</li>
              <li>📊 Nutrition analysis engine</li>
            </ul>
          </div>
        </div>

      {:else if activeTab === 'mtor'}
        <div class="mtor-section">
          <h3>⚡ mTOR Tracker</h3>

          <div class="mtor-dashboard">
            <div class="mtor-score">
              <h4>Current mTOR Score</h4>
              <div class="score-display" class:high={mtorData.score > 70} class:medium={mtorData.score > 40 && mtorData.score <= 70}>
                {mtorData.score.toFixed(1)}
              </div>
            </div>

            <div class="mtor-inputs">
              <div class="input-group">
                <label>Protein (g):</label>
                <input
                  type="number"
                  step="0.1"
                  value={mtorData.protein}
                  on:input={(e) => updateMTORValue('protein', e.target.value)}
                />
              </div>

              <div class="input-group">
                <label>Leucine (g):</label>
                <input
                  type="number"
                  step="0.1"
                  value={mtorData.leucine}
                  on:input={(e) => updateMTORValue('leucine', e.target.value)}
                />
              </div>

              <div class="input-group">
                <label>Carbs (g):</label>
                <input
                  type="number"
                  step="0.1"
                  value={mtorData.carbs}
                  on:input={(e) => updateMTORValue('carbs', e.target.value)}
                />
              </div>

              <div class="input-group">
                <label>Fasting Hours:</label>
                <input
                  type="number"
                  step="0.5"
                  value={mtorData.fasting}
                  on:input={(e) => updateMTORValue('fasting', e.target.value)}
                />
              </div>
            </div>

            <div class="mtor-info">
              <h4>💡 mTOR Optimization Tips</h4>
              <ul>
                <li>🥩 Target 25-30g protein per meal</li>
                <li>🧀 Include 2.5g+ leucine for activation</li>
                <li>🍠 Add 30-50g carbs post-workout</li>
                <li>⏰ Limit fasting to 16h for muscle growth</li>
              </ul>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .nutrition-container {
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

  .recipes-section h3,
  .planner-section h3,
  .codex-section h3,
  .mtor-section h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
  }

  .recipe-display,
  .codex-ui,
  .biomarker-tracking {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
  }

  .recipe-display h4,
  .codex-ui h4,
  .biomarker-tracking h4 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .codex-placeholder {
    background: var(--bg-secondary);
    padding: 2rem;
    border-radius: 0.5rem;
    margin-top: 2rem;
    text-align: center;
  }

  .codex-placeholder ul {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
  }

  .codex-placeholder li {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: var(--bg-primary);
    border-radius: 0.25rem;
  }

  .mtor-dashboard {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .mtor-score {
    text-align: center;
  }

  .score-display {
    font-size: 3rem;
    font-weight: bold;
    padding: 1rem;
    border-radius: 1rem;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    margin-top: 1rem;
  }

  .score-display.medium {
    background: var(--warning-color);
    color: white;
  }

  .score-display.high {
    background: var(--success-color);
    color: white;
  }

  .mtor-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group label {
    font-weight: 500;
    color: var(--text-primary);
  }

  .input-group input {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  .mtor-info {
    grid-column: 1 / -1;
    background: var(--bg-secondary);
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-top: 1rem;
  }

  .mtor-info h4 {
    margin: 0 0 1rem 0;
  }

  .mtor-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .mtor-info li {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: var(--bg-primary);
    border-radius: 0.25rem;
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

  @media (max-width: 768px) {
    .mtor-dashboard {
      grid-template-columns: 1fr;
    }

    .mtor-inputs {
      grid-template-columns: 1fr;
    }
  }
</style>