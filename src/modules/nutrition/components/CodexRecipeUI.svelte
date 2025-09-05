<script>
  import { onMount } from 'svelte';
  import codexEngine from '../codex/codexEngine.js';
  
  // Component state
  let recipe = null;
  let isGenerating = false;
  let error = null;
  let showAdvanced = false;
  let activeTab = 'ingredients';
  
  // Configuration options
  let options = {
    cookingMethod: 'instant_pot',
    mealType: 'omad',
    servings: 2,
    useInventory: true,
    preferredCuisine: 'mediterranean',
    antiInflammatoryFocus: true
  };
  
  // UI state
  let expandedSections = {
    ingredients: true,
    instructions: false,
    nutrition: false,
    dzr: false,
    analysis: false,
    workflow: false
  };
  
  // Generate recipe function
  async function generateRecipe() {
    isGenerating = true;
    error = null;
    
    try {
      console.log('[CodexRecipeUI] Starting recipe generation...');
      const rawRecipe = await codexEngine.generateRecipe(options);
      console.log('[CodexRecipeUI] Raw recipe generated:', rawRecipe);
      
      recipe = codexEngine.formatOutput(rawRecipe);
      console.log('[CodexRecipeUI] Formatted recipe:', recipe);
      
      // Auto-expand ingredients section
      expandedSections.ingredients = true;
      
    } catch (err) {
      console.error('[CodexRecipeUI] Generation failed:', err);
      error = err.message || 'Failed to generate recipe';
      recipe = null;
    } finally {
      isGenerating = false;
    }
  }
  
  // Toggle section visibility
  function toggleSection(section) {
    expandedSections[section] = !expandedSections[section];
  }
  
  // Get mTOR cycle info
  function getMtorInfo() {
    const day = codexEngine.getMtorDay();
    const isHighProtein = day <= 3 || (day >= 8 && day <= 10);
    return {
      day,
      phase: isHighProtein ? 'Growth (High Protein)' : 'Recovery (Moderate Protein)',
      isHighProtein
    };
  }
  
  // Format cooking time display
  function formatTime(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  
  // Get status badge class
  function getStatusBadge(status) {
    const badges = {
      'deficit_critic': 'badge-error',
      'deficit_moderat': 'badge-warning', 
      'deficit_ușor': 'badge-info',
      'optimal': 'badge-success',
      'exces': 'badge-primary'
    };
    return badges[status] || 'badge-neutral';
  }
  
  // Initialize on mount
  onMount(() => {
    console.log('[CodexRecipeUI] Component mounted, CODEX Engine v' + codexEngine.getVersion());
  });
</script>

<div class="codex-recipe-ui">
  <!-- Header -->
  <div class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">🧬 CODEX Recipe Generator v4.0</h1>
      <p class="hero-subtitle">
        Sistem Expert de Generare Rețete cu Workflow Logic Impecabil
      </p>
      
      <!-- mTOR Cycle Display -->
      {#if getMtorInfo()}
        {@const mtorInfo = getMtorInfo()}
        <div class="mtor-display">
          <div class="mtor-badge">
            <span class="mtor-day">Day {mtorInfo.day}/14</span>
            <span class="mtor-phase" class:high-protein={mtorInfo.isHighProtein}>
              {mtorInfo.phase}
            </span>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Configuration Panel -->
  <div class="config-panel" class:expanded={showAdvanced}>
    <div class="panel-header">
      <h3>⚙️ Configuration</h3>
      <button class="toggle-btn" on:click={() => showAdvanced = !showAdvanced}>
        {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
      </button>
    </div>
    
    <div class="config-grid">
      <!-- Basic Options -->
      <div class="config-group">
        <label>Cooking Method:</label>
        <select bind:value={options.cookingMethod}>
          <option value="instant_pot">🍲 Instant Pot</option>
          <option value="stovetop">🔥 Stovetop</option>
          <option value="oven">🔥 Oven</option>
        </select>
      </div>
      
      <div class="config-group">
        <label>Meal Type:</label>
        <select bind:value={options.mealType}>
          <option value="omad">🍽️ OMAD (One Meal A Day)</option>
          <option value="lunch">🌅 Lunch</option>
          <option value="dinner">🌙 Dinner</option>
        </select>
      </div>
      
      <div class="config-group">
        <label>Servings:</label>
        <input type="number" bind:value={options.servings} min="1" max="6" />
      </div>
      
      {#if showAdvanced}
        <!-- Advanced Options -->
        <div class="config-group">
          <label>Cuisine Style:</label>
          <select bind:value={options.preferredCuisine}>
            <option value="mediterranean">🇬🇷 Mediterranean</option>
            <option value="asian">🇯🇵 Asian</option>
            <option value="romanian">🇷🇴 Romanian</option>
            <option value="fusion">🌍 Fusion</option>
          </select>
        </div>
        
        <div class="config-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={options.useInventory} />
            📦 Use Available Inventory
          </label>
        </div>
        
        <div class="config-group checkbox-group">
          <label>
            <input type="checkbox" bind:checked={options.antiInflammatoryFocus} />
            🌿 Anti-Inflammatory Focus
          </label>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Generation Button -->
  <div class="generation-section">
    <button 
      class="generate-btn" 
      class:loading={isGenerating}
      on:click={generateRecipe}
      disabled={isGenerating}
    >
      {#if isGenerating}
        <div class="loading-spinner"></div>
        Generating Perfect Recipe...
      {:else}
        🚀 Generate Optimal Recipe
      {/if}
    </button>
    
    {#if error}
      <div class="error-message">
        ⚠️ {error}
      </div>
    {/if}
  </div>
  
  <!-- Recipe Display -->
  {#if recipe}
    <div class="recipe-container">
      <!-- Recipe Header -->
      <div class="recipe-header">
        <div class="recipe-title">
          <h2>{recipe.header.name}</h2>
          <div class="recipe-meta">
            <span class="meta-item">🕒 {formatTime(recipe.header.totalTime)}</span>
            <span class="meta-item">👥 {recipe.header.servings} servings</span>
            <span class="meta-item">🍳 {recipe.header.method}</span>
            <span class="meta-item">🏆 Score: {recipe.analysis.scores.overall}/100</span>
          </div>
        </div>
        <div class="recipe-id">#{recipe.header.id}</div>
      </div>
      
      <!-- Navigation Tabs -->
      <div class="recipe-tabs">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'ingredients'}
          on:click={() => activeTab = 'ingredients'}
        >
          📋 Ingredients
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'instructions'}
          on:click={() => activeTab = 'instructions'}
        >
          👨‍🍳 Instructions
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'nutrition'}
          on:click={() => activeTab = 'nutrition'}
        >
          📊 Nutrition
        </button>
        <button 
          class="tab-btn" 
          class:active={activeTab === 'analysis'}
          on:click={() => activeTab = 'analysis'}
        >
          🔬 Analysis
        </button>
      </div>
      
      <!-- Tab Content -->
      <div class="tab-content">
        
        <!-- Ingredients Tab -->
        {#if activeTab === 'ingredients'}
          <div class="ingredients-section">
            <h3>🛒 Ingredient List</h3>
            <div class="ingredients-table">
              <table>
                <thead>
                  <tr>
                    {#each recipe.ingredients.headers as header}
                      <th>{header}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each recipe.ingredients.rows as row}
                    <tr>
                      {#each row as cell}
                        <td>{cell}</td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <!-- Safety Warnings -->
            {#if recipe.analysis.safety.issues?.length > 0}
              <div class="safety-warnings">
                <h4>⚠️ Safety Alerts</h4>
                {#each recipe.analysis.safety.issues as issue}
                  <div class="alert alert-error">
                    <strong>{issue.type}:</strong> {issue.message}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Instructions Tab -->
        {#if activeTab === 'instructions'}
          <div class="instructions-section">
            <div class="instruction-timing">
              <h3>⏰ Timing Overview</h3>
              <div class="timing-grid">
                <div class="timing-item">
                  <span class="timing-label">Prep:</span>
                  <span class="timing-value">{recipe.instructions.timing.prep} min</span>
                </div>
                <div class="timing-item">
                  <span class="timing-label">Cooking:</span>
                  <span class="timing-value">{recipe.instructions.timing.pressure_cooking || 20} min</span>
                </div>
                <div class="timing-item">
                  <span class="timing-label">Total:</span>
                  <span class="timing-value">{recipe.instructions.timing.total} min</span>
                </div>
              </div>
            </div>
            
            <div class="instruction-steps">
              <h3>📋 Preparation Steps</h3>
              <ol class="prep-steps">
                {#each recipe.instructions.prep as step}
                  <li>{step}</li>
                {/each}
              </ol>
              
              <h3>🍳 Cooking Instructions</h3>
              <ol class="cooking-steps">
                {#each recipe.instructions.cooking as step}
                  <li>{step}</li>
                {/each}
              </ol>
              
              {#if recipe.instructions.nicoAdjustments}
                <div class="nico-adjustments">
                  <h4>👥 Special Instructions for Nico</h4>
                  <ul>
                    {#each recipe.instructions.nicoAdjustments as adjustment}
                      <li>{adjustment}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- Nutrition Tab -->
        {#if activeTab === 'nutrition'}
          <div class="nutrition-section">
            <div class="nutrition-overview">
              <h3>📊 Nutritional Profile</h3>
              <div class="macro-cards">
                <div class="macro-card">
                  <div class="macro-value">{Math.round(recipe.nutrition.calories)}</div>
                  <div class="macro-label">Calories</div>
                </div>
                <div class="macro-card">
                  <div class="macro-value">{Math.round(recipe.nutrition.protein)}g</div>
                  <div class="macro-label">Protein</div>
                </div>
                <div class="macro-card">
                  <div class="macro-value">{Math.round(recipe.nutrition.carbs)}g</div>
                  <div class="macro-label">Carbs</div>
                </div>
                <div class="macro-card">
                  <div class="macro-value">{Math.round(recipe.nutrition.fat)}g</div>
                  <div class="macro-label">Fat</div>
                </div>
              </div>
            </div>
            
            <!-- DZR Tables -->
            <div class="dzr-section">
              <h3>🎯 DZR% Achievement</h3>
              
              <!-- Ioan's DZR -->
              <div class="dzr-table-container">
                <h4>👤 Ioan's DZR%</h4>
                {#if recipe.dzr.ioan.rows?.length > 0}
                  <table class="dzr-table">
                    <thead>
                      <tr>
                        <th>Nutrient</th>
                        <th>Actual</th>
                        <th>Target</th>
                        <th>DZR%</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each recipe.dzr.ioan.rows as row}
                        <tr>
                          <td>{row.nutrient}</td>
                          <td>{row.actual}</td>
                          <td>{row.target}</td>
                          <td class="dzr-percent">
                            {row.emoji} {row.dzr}%
                          </td>
                          <td>
                            <span class="badge {getStatusBadge(row.status)}">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                {:else}
                  <p class="no-data">DZR data not available</p>
                {/if}
              </div>
              
              <!-- Nico's DZR -->
              <div class="dzr-table-container">
                <h4>👤 Nico's DZR%</h4>
                {#if recipe.dzr.nico.rows?.length > 0}
                  <table class="dzr-table">
                    <thead>
                      <tr>
                        <th>Nutrient</th>
                        <th>Actual</th>
                        <th>Target</th>
                        <th>DZR%</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each recipe.dzr.nico.rows as row}
                        <tr>
                          <td>{row.nutrient}</td>
                          <td>{row.actual}</td>
                          <td>{row.target}</td>
                          <td class="dzr-percent">
                            {row.emoji} {row.dzr}%
                          </td>
                          <td>
                            <span class="badge {getStatusBadge(row.status)}">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                {:else}
                  <p class="no-data">DZR data not available</p>
                {/if}
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Analysis Tab -->
        {#if activeTab === 'analysis'}
          <div class="analysis-section">
            <h3>🔬 Recipe Analysis</h3>
            
            <!-- Score Cards -->
            <div class="score-cards">
              <div class="score-card">
                <div class="score-value">{recipe.analysis.scores.antiInflammatory}/100</div>
                <div class="score-label">🌿 Anti-Inflammatory</div>
              </div>
              <div class="score-card">
                <div class="score-value">{recipe.analysis.scores.plantDiversity}/100</div>
                <div class="score-label">🌈 Plant Diversity</div>
              </div>
              <div class="score-card">
                <div class="score-value">{Math.round((recipe.analysis.scores.digestibility?.ioan + recipe.analysis.scores.digestibility?.nico) / 2)}/100</div>
                <div class="score-label">💪 Digestibility</div>
              </div>
              <div class="score-card overall">
                <div class="score-value">{recipe.analysis.scores.overall}/100</div>
                <div class="score-label">🏆 Overall Score</div>
              </div>
            </div>
            
            <!-- Recommendations -->
            <div class="recommendations">
              <h4>💡 Recommendations</h4>
              <ul class="recommendation-list">
                {#each recipe.analysis.recommendations as recommendation}
                  <li>{recommendation}</li>
                {/each}
              </ul>
            </div>
            
            <!-- Deficits -->
            {#if recipe.analysis.deficits?.length > 0}
              <div class="deficits">
                <h4>⚠️ Nutritional Gaps</h4>
                {#each recipe.analysis.deficits as deficit}
                  <div class="deficit-item">
                    <strong>{deficit.person}:</strong> {deficit.nutrient} - {deficit.suggestion}
                  </div>
                {/each}
              </div>
            {/if}
            
            <!-- Academic Sources -->
            {#if recipe.academic?.sources}
              <div class="academic-sources">
                <h4>📚 Academic Sources</h4>
                <div class="sources-grid">
                  {#each recipe.academic.sources as source}
                    <div class="source-card">
                      <div class="source-type">{source.type}</div>
                      <div class="source-title">{source.source}</div>
                      <div class="source-application">{source.application}</div>
                      {#if source.doi}
                        <div class="source-doi">DOI: {source.doi}</div>
                      {:else if source.page}
                        <div class="source-page">{source.page}</div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Workflow Log -->
            {#if recipe.workflow?.executionLog}
              <details class="workflow-details">
                <summary>🔍 Workflow Execution Log</summary>
                <div class="workflow-log">
                  {#each recipe.workflow.executionLog as entry}
                    <div class="log-entry">
                      <span class="log-step">{entry.step}</span>
                      <span class="log-message">{entry.message}</span>
                      <span class="log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                  {/each}
                </div>
              </details>
            {/if}
          </div>
        {/if}
        
      </div>
    </div>
  {/if}
</div>

<style>
  .codex-recipe-ui {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  /* Hero Section */
  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 40px;
    margin-bottom: 30px;
    color: white;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 10px 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0 0 20px 0;
  }
  
  .mtor-display {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  
  .mtor-badge {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255,255,255,0.2);
    padding: 8px 16px;
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }
  
  .mtor-day {
    font-weight: 600;
  }
  
  .mtor-phase {
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .mtor-phase.high-protein {
    color: #ffd700;
    font-weight: 600;
  }
  
  /* Configuration Panel */
  .config-panel {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .panel-header h3 {
    margin: 0;
    color: #2d3748;
  }
  
  .toggle-btn {
    background: #4299e1;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  .toggle-btn:hover {
    background: #3182ce;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .config-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .config-group.checkbox-group {
    flex-direction: row;
    align-items: center;
  }
  
  .config-group label {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.9rem;
  }
  
  .config-group select,
  .config-group input[type="number"] {
    padding: 10px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
  }
  
  .config-group select:focus,
  .config-group input:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
  
  /* Generation Section */
  .generation-section {
    text-align: center;
    margin: 30px 0;
  }
  
  .generate-btn {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 250px;
    justify-content: center;
  }
  
  .generate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
  }
  
  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    background: #fed7d7;
    color: #e53e3e;
    padding: 12px 20px;
    border-radius: 8px;
    margin-top: 15px;
    border: 1px solid #feb2b2;
  }
  
  /* Recipe Container */
  .recipe-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    margin-top: 30px;
    overflow: hidden;
  }
  
  .recipe-header {
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    padding: 30px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .recipe-title h2 {
    margin: 0 0 15px 0;
    font-size: 1.8rem;
    font-weight: 700;
  }
  
  .recipe-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .meta-item {
    background: rgba(255,255,255,0.2);
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
  }
  
  .recipe-id {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    opacity: 0.8;
    background: rgba(255,255,255,0.1);
    padding: 8px 12px;
    border-radius: 6px;
  }
  
  /* Recipe Tabs */
  .recipe-tabs {
    display: flex;
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .tab-btn {
    flex: 1;
    padding: 15px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: 600;
    color: #718096;
    transition: all 0.2s;
    border-bottom: 3px solid transparent;
  }
  
  .tab-btn:hover {
    background: #edf2f7;
    color: #2d3748;
  }
  
  .tab-btn.active {
    color: #4299e1;
    border-bottom-color: #4299e1;
    background: white;
  }
  
  /* Tab Content */
  .tab-content {
    padding: 30px;
  }
  
  /* Ingredients Section */
  .ingredients-table {
    margin: 20px 0;
    overflow-x: auto;
  }
  
  .ingredients-table table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  .ingredients-table th {
    background: #4299e1;
    color: white;
    padding: 15px;
    text-align: left;
    font-weight: 600;
  }
  
  .ingredients-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .ingredients-table tr:hover {
    background: #f8fafc;
  }
  
  /* Safety Warnings */
  .safety-warnings {
    margin-top: 20px;
  }
  
  .alert {
    padding: 12px 16px;
    border-radius: 8px;
    margin: 10px 0;
  }
  
  .alert-error {
    background: #fed7d7;
    border: 1px solid #feb2b2;
    color: #c53030;
  }
  
  /* Instructions Section */
  .instruction-timing {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 25px;
  }
  
  .timing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }
  
  .timing-item {
    text-align: center;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .timing-label {
    display: block;
    font-size: 0.9rem;
    color: #718096;
    margin-bottom: 5px;
  }
  
  .timing-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #2d3748;
  }
  
  .prep-steps,
  .cooking-steps {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    margin: 20px 0;
  }
  
  .prep-steps li,
  .cooking-steps li {
    margin: 10px 0;
    line-height: 1.6;
  }
  
  .nico-adjustments {
    background: #e6fffa;
    border: 2px solid #81e6d9;
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
  }
  
  .nico-adjustments h4 {
    color: #285e61;
    margin-top: 0;
  }
  
  /* Nutrition Section */
  .macro-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }
  
  .macro-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
  }
  
  .macro-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 5px;
  }
  
  .macro-label {
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  /* DZR Tables */
  .dzr-section {
    margin-top: 30px;
  }
  
  .dzr-table-container {
    margin: 20px 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .dzr-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .dzr-table th {
    background: #4299e1;
    color: white;
    padding: 15px;
    text-align: left;
  }
  
  .dzr-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .dzr-percent {
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .badge-error { background: #fed7d7; color: #c53030; }
  .badge-warning { background: #fef5e7; color: #d69e2e; }
  .badge-info { background: #e6fffa; color: #319795; }
  .badge-success { background: #d4edda; color: #38a169; }
  .badge-primary { background: #e6f3ff; color: #3182ce; }
  
  .no-data {
    padding: 20px;
    text-align: center;
    color: #718096;
    font-style: italic;
  }
  
  /* Analysis Section */
  .score-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .score-card {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    padding: 25px;
    border-radius: 12px;
    text-align: center;
    transition: transform 0.2s;
  }
  
  .score-card:hover {
    transform: translateY(-2px);
  }
  
  .score-card.overall {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  }
  
  .score-value {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .score-label {
    font-size: 0.95rem;
    opacity: 0.95;
  }
  
  .recommendations {
    background: #f0fff4;
    border: 2px solid #9ae6b4;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .recommendation-list {
    list-style: none;
    padding: 0;
    margin: 10px 0 0 0;
  }
  
  .recommendation-list li {
    padding: 8px 0;
    border-bottom: 1px solid #c6f6d5;
  }
  
  .recommendation-list li:last-child {
    border-bottom: none;
  }
  
  .deficits {
    background: #fff5f5;
    border: 2px solid #feb2b2;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .deficit-item {
    padding: 8px 0;
    border-bottom: 1px solid #fed7d7;
  }
  
  .deficit-item:last-child {
    border-bottom: none;
  }
  
  /* Academic Sources */
  .academic-sources {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
  }
  
  .sources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }
  
  .source-card {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .source-type {
    font-size: 0.8rem;
    color: #4299e1;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .source-title {
    font-weight: 700;
    margin: 5px 0;
  }
  
  .source-application {
    color: #718096;
    font-size: 0.9rem;
    margin: 5px 0;
  }
  
  .source-doi,
  .source-page {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #4a5568;
    margin-top: 8px;
  }
  
  /* Workflow Details */
  .workflow-details {
    margin-top: 20px;
    background: #f8fafc;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .workflow-details summary {
    padding: 15px 20px;
    background: #e2e8f0;
    cursor: pointer;
    font-weight: 600;
  }
  
  .workflow-log {
    padding: 15px 20px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .log-entry {
    display: grid;
    grid-template-columns: 200px 1fr 100px;
    gap: 15px;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }
  
  .log-step {
    color: #4299e1;
    font-weight: 600;
  }
  
  .log-time {
    color: #718096;
    text-align: right;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .codex-recipe-ui {
      padding: 10px;
    }
    
    .hero-title {
      font-size: 1.8rem;
    }
    
    .hero-subtitle {
      font-size: 1rem;
    }
    
    .config-grid {
      grid-template-columns: 1fr;
    }
    
    .recipe-header {
      flex-direction: column;
      gap: 15px;
    }
    
    .recipe-meta {
      justify-content: center;
    }
    
    .tab-content {
      padding: 15px;
    }
    
    .macro-cards,
    .score-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .sources-grid {
      grid-template-columns: 1fr;
    }
  }
</style>