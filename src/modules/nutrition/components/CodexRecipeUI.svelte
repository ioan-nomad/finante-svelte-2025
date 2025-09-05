<script>
  import { onMount } from 'svelte';
  import codexEngine from '../codex/codexEngine.js';
  
  let recipe = null;
  let loading = false;
  let cookingMethod = 'instant_pot';
  let useInventory = true;
  let error = null;
  
  async function generateRecipe() {
    loading = true;
    error = null;
    try {
      const rawRecipe = await codexEngine.generateRecipe({
        cookingMethod,
        useInventory,
        mealType: 'omad',
        servings: 2
      });
      
      // Format for display
      recipe = codexEngine.formatOutput(rawRecipe);
      console.log('Generated recipe:', recipe);
    } catch (err) {
      console.error('Recipe generation failed:', err);
      error = err.message || 'Eroare la generarea rețetei';
    }
    loading = false;
  }
  
  onMount(() => {
    generateRecipe();
  });
</script>

<div class="codex-recipe-ui">
  <div class="controls">
    <h1>🍳 CODEX Engine v4.0 - Generator Rețete</h1>
    
    <div class="control-row">
      <select bind:value={cookingMethod} class="method-select">
        <option value="instant_pot">Instant Pot</option>
        <option value="induction_stovetop">Plită Inducție</option>
        <option value="oven">Cuptor</option>
      </select>
      
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={useInventory}>
        Folosește doar ce am în stoc
      </label>
      
      <button on:click={generateRecipe} disabled={loading} class="generate-btn">
        {loading ? 'Generez...' : 'Generează Rețetă Nouă'}
      </button>
    </div>
  </div>
  
  {#if error}
    <div class="error-message">
      ❌ Eroare: {error}
    </div>
  {/if}
  
  {#if recipe}
  <div class="recipe-display">
    <!-- HEADER -->
    <div class="recipe-header">
      <h1>{recipe.header.name}</h1>
      <div class="meta">
        <span class="meta-item">⏱️ {recipe.header.totalTime} min</span>
        <span class="meta-item">👥 {recipe.header.servings} porții</span>
        <span class="meta-item">🍳 {recipe.header.method}</span>
        <span class="meta-item">📅 {new Date(recipe.header.date).toLocaleDateString('ro-RO')}</span>
      </div>
    </div>
    
    <!-- SAFETY CHECK -->
    {#if recipe.analysis.safety}
      {#if recipe.analysis.safety.passed}
        <div class="alert success">
          ✅ Rețeta este sigură pentru Nico (fără alergeni)
        </div>
      {:else}
        <div class="alert danger">
          ⚠️ ATENȚIE: {recipe.analysis.safety.issues.join(', ')}
        </div>
      {/if}
    {/if}
    
    <!-- INGREDIENTS TABLE -->
    <div class="ingredients-section">
      <h2>📝 Ingrediente (Cantități Exacte)</h2>
      <div class="table-container">
        <table class="ingredients-table">
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
    </div>
    
    <!-- INSTRUCTIONS -->
    <div class="instructions-section">
      <h2>👨‍🍳 Instrucțiuni Pas cu Pas</h2>
      
      <div class="instruction-block">
        <h3>⏰ Pregătire ({recipe.instructions.timing.prep} min):</h3>
        <ol class="prep-list">
          {#each recipe.instructions.prep as step}
            <li>{step}</li>
          {/each}
        </ol>
      </div>
      
      <div class="instruction-block">
        <h3>🔥 Gătire ({recipe.instructions.timing.cooking} min):</h3>
        <ol class="cooking-list">
          {#each recipe.instructions.cooking as step}
            <li>{step}</li>
          {/each}
        </ol>
      </div>
    </div>
    
    <!-- NUTRITION OVERVIEW -->
    <div class="nutrition-overview">
      <h2>📊 Sumar Nutrițional</h2>
      <div class="nutrition-grid">
        <div class="nutrition-card">
          <div class="nutrition-label">Calorii</div>
          <div class="nutrition-value">{recipe.nutrition.calories?.toFixed(0) || '0'}</div>
          <div class="nutrition-unit">kcal</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label">Proteine</div>
          <div class="nutrition-value">{recipe.nutrition.protein?.toFixed(1) || '0'}</div>
          <div class="nutrition-unit">g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label">Carbohidrați</div>
          <div class="nutrition-value">{recipe.nutrition.carbs?.toFixed(1) || '0'}</div>
          <div class="nutrition-unit">g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label">Grăsimi</div>
          <div class="nutrition-value">{recipe.nutrition.fat?.toFixed(1) || '0'}</div>
          <div class="nutrition-unit">g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label">Fibre</div>
          <div class="nutrition-value">{recipe.nutrition.fiber?.toFixed(1) || '0'}</div>
          <div class="nutrition-unit">g</div>
        </div>
        <div class="nutrition-card">
          <div class="nutrition-label">Omega-3</div>
          <div class="nutrition-value">{recipe.nutrition.omega3?.toFixed(2) || '0'}</div>
          <div class="nutrition-unit">g</div>
        </div>
      </div>
    </div>
    
    <!-- DZR ANALYSIS TABLES -->
    <div class="dzr-section">
      <h2>📊 Analiză DZR% (Doza Zilnică Recomandată)</h2>
      
      <div class="dzr-grid">
        <!-- Ioan DZR -->
        <div class="dzr-table">
          <h3>👨 Ioan - Analiză DZR</h3>
          {#if recipe.dzr.ioan.rows && recipe.dzr.ioan.rows.length > 0}
            <table>
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
                    <td class="dzr-{row.status}">{row.dzr}%</td>
                    <td>{row.emoji}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="no-data">Date DZR în curs de procesare...</p>
          {/if}
        </div>
        
        <!-- Nico DZR -->
        <div class="dzr-table">
          <h3>👩 Nico - Analiză DZR</h3>
          {#if recipe.dzr.nico.rows && recipe.dzr.nico.rows.length > 0}
            <table>
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
                    <td class="dzr-{row.status}">{row.dzr}%</td>
                    <td>{row.emoji}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="no-data">Date DZR în curs de procesare...</p>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- ANALYSIS & RECOMMENDATIONS -->
    <div class="analysis-section">
      <h2>🔍 Analiză & Recomandări</h2>
      
      {#if recipe.analysis.recommendations && recipe.analysis.recommendations.length > 0}
        <div class="recommendations">
          <h3>💡 Recomandări:</h3>
          <ul>
            {#each recipe.analysis.recommendations as recommendation}
              <li>{recommendation}</li>
            {/each}
          </ul>
        </div>
      {/if}
      
      {#if recipe.analysis.deficits && recipe.analysis.deficits.length > 0}
        <div class="deficits">
          <h3>⚠️ Nutrienți de completat în următoarele zile:</h3>
          <ul>
            {#each recipe.analysis.deficits as deficit}
              <li>
                <strong>{deficit.person}:</strong> {deficit.nutrient} - {deficit.suggestion}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
    
    <!-- RECIPE ID for reference -->
    <div class="recipe-footer">
      <small>ID Rețetă: {recipe.header.id}</small>
    </div>
  </div>
  {:else if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Generez rețeta optimă bazată pe profilurile nutriționale...</p>
    </div>
  {/if}
</div>

<style>
  .codex-recipe-ui {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .controls {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 15px;
    margin-bottom: 30px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .controls h1 {
    margin: 0 0 20px 0;
    font-size: 1.8rem;
    text-align: center;
  }
  
  .control-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .method-select {
    padding: 12px 15px;
    border: none;
    border-radius: 8px;
    background: white;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .checkbox-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .generate-btn {
    padding: 12px 24px;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .generate-btn:hover:not(:disabled) {
    background: #ff5252;
  }
  
  .generate-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  .error-message {
    background: #fee2e2;
    color: #991b1b;
    padding: 15px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #ef4444;
  }
  
  .loading {
    text-align: center;
    padding: 60px 20px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .recipe-display {
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .recipe-header {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  
  .recipe-header h1 {
    margin: 0 0 15px 0;
    font-size: 2rem;
    font-weight: bold;
  }
  
  .meta {
    display: flex;
    justify-content: center;
    gap: 25px;
    flex-wrap: wrap;
  }
  
  .meta-item {
    background: rgba(255,255,255,0.2);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
  }
  
  .alert {
    padding: 15px;
    margin: 20px;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .alert.success {
    background: #dcfce7;
    color: #166534;
    border-left: 4px solid #22c55e;
  }
  
  .alert.danger {
    background: #fee2e2;
    color: #991b1b;
    border-left: 4px solid #ef4444;
  }
  
  .ingredients-section,
  .instructions-section,
  .nutrition-overview,
  .dzr-section,
  .analysis-section {
    padding: 30px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .ingredients-section h2,
  .instructions-section h2,
  .nutrition-overview h2,
  .dzr-section h2,
  .analysis-section h2 {
    color: #1e293b;
    margin-bottom: 20px;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .ingredients-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ingredients-table th {
    background: #f8fafc;
    color: #374151;
    font-weight: bold;
    padding: 15px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .ingredients-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .ingredients-table tr:hover {
    background: #f8fafc;
  }
  
  .instruction-block {
    margin: 25px 0;
  }
  
  .instruction-block h3 {
    color: #1e293b;
    margin-bottom: 12px;
    font-size: 1.2rem;
  }
  
  .prep-list,
  .cooking-list {
    padding-left: 20px;
    line-height: 1.6;
  }
  
  .prep-list li,
  .cooking-list li {
    margin: 8px 0;
    color: #374151;
  }
  
  .nutrition-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .nutrition-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  .nutrition-label {
    font-size: 0.9rem;
    opacity: 0.9;
    margin-bottom: 5px;
  }
  
  .nutrition-value {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .nutrition-unit {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  .dzr-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin: 20px 0;
  }
  
  .dzr-table {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  
  .dzr-table h3 {
    margin: 0 0 15px 0;
    color: #1e293b;
    font-size: 1.2rem;
  }
  
  .dzr-table table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .dzr-table th {
    background: #e2e8f0;
    color: #374151;
    padding: 10px 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .dzr-table td {
    padding: 8px;
    font-size: 0.85rem;
    border-bottom: 1px solid #f1f5f9;
  }
  
  .dzr-critical { color: #ef4444; font-weight: bold; }
  .dzr-moderate { color: #f97316; font-weight: bold; }
  .dzr-slight { color: #eab308; font-weight: bold; }
  .dzr-optimal { color: #22c55e; font-weight: bold; }
  .dzr-excess { color: #3b82f6; font-weight: bold; }
  
  .no-data {
    color: #6b7280;
    font-style: italic;
    text-align: center;
    padding: 20px;
  }
  
  .recommendations,
  .deficits {
    background: #f0f9ff;
    padding: 20px;
    border-radius: 8px;
    margin: 15px 0;
    border-left: 4px solid #0ea5e9;
  }
  
  .deficits {
    background: #fef3c7;
    border-left-color: #f59e0b;
  }
  
  .recommendations h3,
  .deficits h3 {
    margin: 0 0 10px 0;
    color: #1e293b;
    font-size: 1.1rem;
  }
  
  .recommendations ul,
  .deficits ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .recommendations li,
  .deficits li {
    margin: 5px 0;
    color: #374151;
  }
  
  .recipe-footer {
    padding: 20px 30px;
    background: #f8fafc;
    color: #6b7280;
    text-align: center;
    border-top: 1px solid #e2e8f0;
  }
  
  @media (max-width: 768px) {
    .codex-recipe-ui {
      padding: 10px;
    }
    
    .dzr-grid {
      grid-template-columns: 1fr;
    }
    
    .nutrition-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }
    
    .meta {
      gap: 15px;
    }
    
    .control-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .method-select,
    .generate-btn {
      width: 100%;
    }
  }
</style>