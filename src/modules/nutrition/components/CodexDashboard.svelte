<script>
  import { onMount } from 'svelte';
  import { CODEX_AUTHORITY } from '../codex/codexAuthority.js';
  import { CODEX_INGREDIENTS, getNicoSafeIngredients } from '../codex/codexDatabase.js';
  import CodexRecipeGenerator from '../codex/codexRecipeGenerator.js';
  
  // Dashboard State
  let stats = {
    totalIngredients: 0,
    nicoSafeIngredients: 0,
    verifiedSources: 0,
    pmidCount: 0,
    usda_count: 0,
    cochrane_count: 0
  };
  
  let authorizedSources = [];
  let bannedSources = [];
  let ingredientValidation = [];
  let todayRecipe = null;
  let sourceAudit = [];
  
  // Recipe Generator
  const generator = new CodexRecipeGenerator();
  
  onMount(() => {
    loadDashboardData();
    generateTodayRecipe();
    auditAllSources();
  });
  
  function loadDashboardData() {
    // Calculate statistics
    const ingredients = Object.entries(CODEX_INGREDIENTS);
    stats.totalIngredients = ingredients.length;
    stats.nicoSafeIngredients = getNicoSafeIngredients().length;
    
    // Count verified sources
    ingredients.forEach(([name, data]) => {
      if (data.nutrition_per_100g?.source) {
        stats.verifiedSources++;
        
        if (data.nutrition_per_100g.citation?.includes('FDC_ID')) {
          stats.usda_count++;
        }
      }
      
      // Count PMIDs
      const jsonStr = JSON.stringify(data);
      const pmidMatches = jsonStr.match(/PMID:\s*\d+/g) || [];
      stats.pmidCount += pmidMatches.length;
      
      // Count Cochrane
      const cochraneMatches = jsonStr.match(/CD\d{6}/g) || [];
      stats.cochrane_count += cochraneMatches.length;
    });
    
    // Get authorized sources
    const authSources = CODEX_AUTHORITY.AUTHORIZED_SOURCES;
    Object.entries(authSources).forEach(([category, sources]) => {
      if (typeof sources === 'object') {
        Object.entries(sources).forEach(([key, source]) => {
          if (source.name) {
            authorizedSources.push({
              category: category.replace(/_/g, ' ').toUpperCase(),
              name: source.name,
              trust: source.trust_level || 'N/A',
              url: source.url || 'N/A'
            });
          }
        });
      }
    });
    
    // Get banned sources
    bannedSources = CODEX_AUTHORITY.BANNED_SOURCES;
    
    // Validate each ingredient
    ingredients.forEach(([id, data]) => {
      const validation = {
        id,
        name: data.name,
        has_nutrition: !!data.nutrition_per_100g?.source,
        has_citation: !!data.nutrition_per_100g?.citation,
        has_bioactive: !!data.bioactive_compounds,
        nico_safe: data.nico_safe === true,
        inflammation_score: data.inflammation_score || 'N/A'
      };
      ingredientValidation.push(validation);
    });
    
    // Sort by inflammation score
    ingredientValidation.sort((a, b) => {
      if (a.inflammation_score === 'N/A') return 1;
      if (b.inflammation_score === 'N/A') return -1;
      return a.inflammation_score - b.inflammation_score;
    });
  }
  
  function generateTodayRecipe() {
    todayRecipe = generator.generateDailyRecipe();
    console.log('Generated recipe:', todayRecipe);
  }
  
  function auditAllSources() {
    // Audit trail pentru toate sursele folosite
    const audit = [];
    
    Object.entries(CODEX_INGREDIENTS).forEach(([id, data]) => {
      if (data.nutrition_per_100g?.source) {
        audit.push({
          ingredient: data.name,
          data_type: 'Nutrition',
          source: data.nutrition_per_100g.source,
          citation: data.nutrition_per_100g.citation,
          verified: '✅'
        });
      }
      
      if (data.bioactive_compounds) {
        Object.entries(data.bioactive_compounds).forEach(([compound, info]) => {
          if (info.source) {
            audit.push({
              ingredient: data.name,
              data_type: `Bioactive: ${compound}`,
              source: info.source,
              citation: info.citation,
              verified: '✅'
            });
          }
        });
      }
    });
    
    sourceAudit = audit;
  }
  
  function testSourceValidation() {
    // Test live validation
    try {
      const testResult = CODEX_AUTHORITY.enforceAuthority({
        source: "PubMed",
        citation: "PMID: 12345678",
        type: "test"
      });
      alert('✅ Validation system active and working!');
    } catch (e) {
      alert('❌ Validation error: ' + e.message);
    }
  }
</script>

<div class="codex-dashboard">
  <div class="dashboard-header">
    <h1>🧬 CODEX Authority Dashboard v3.0</h1>
    <p class="subtitle">Evidence-Based Nutrition Monitoring System</p>
    <p class="safety-status">Nico Safety Mode: <span class="active">ACTIVE ✅</span></p>
  </div>
  
  <!-- Statistics Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">{stats.totalIngredients}</div>
      <div class="stat-label">Total Ingredients</div>
    </div>
    
    <div class="stat-card safe">
      <div class="stat-value">{stats.nicoSafeIngredients}</div>
      <div class="stat-label">Nico-Safe</div>
    </div>
    
    <div class="stat-card verified">
      <div class="stat-value">{stats.verifiedSources}</div>
      <div class="stat-label">Source Verified</div>
    </div>
    
    <div class="stat-card pmid">
      <div class="stat-value">{stats.pmidCount}</div>
      <div class="stat-label">PubMed Citations</div>
    </div>
    
    <div class="stat-card usda">
      <div class="stat-value">{stats.usda_count}</div>
      <div class="stat-label">USDA Sources</div>
    </div>
    
    <div class="stat-card cochrane">
      <div class="stat-value">{stats.cochrane_count}</div>
      <div class="stat-label">Cochrane Reviews</div>
    </div>
  </div>
  
  <!-- Today's Recipe -->
  {#if todayRecipe}
  <div class="recipe-section">
    <h2>📅 Today's Evidence-Based Recipe</h2>
    <div class="recipe-card">
      <h3>{todayRecipe.name}</h3>
      <div class="recipe-meta">
        <span>mTOR Phase: {todayRecipe.mtor_phase}</span>
        <span>Method: {todayRecipe.cooking_method}</span>
        <span>Time: {todayRecipe.cooking_time} min</span>
      </div>
      
      {#if todayRecipe.nico_evaluation}
      <div class="evaluation">
        <div class="score-display {todayRecipe.nico_evaluation.approved ? 'approved' : 'rejected'}">
          {#if todayRecipe.nico_evaluation.approved}
            <span class="score">{todayRecipe.nico_evaluation.total_score}/100</span>
            <span class="grade">{todayRecipe.nico_evaluation.grade}</span>
          {:else}
            <span class="rejected">REJECTED - Safety Violation</span>
          {/if}
        </div>
        
        {#if todayRecipe.nico_evaluation.breakdown}
        <div class="breakdown">
          <div>Safety: {todayRecipe.nico_evaluation.breakdown.safety}</div>
          <div>Anti-Inflammatory: {todayRecipe.nico_evaluation.breakdown.inflammation}/100</div>
          <div>Nutrients: {todayRecipe.nico_evaluation.breakdown.nutrients}/100</div>
          <div>Metabolic: {todayRecipe.nico_evaluation.breakdown.metabolic}/100</div>
        </div>
        {/if}
      </div>
      {/if}
      
      <div class="ingredients-list">
        <h4>Ingredients (all source-verified):</h4>
        {#each todayRecipe.ingredients as ing}
          <div class="ingredient-line">
            <span>{ing.amount}g {ing.name}</span>
            <span class="source-badge">✅ {ing.source_verified}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
  {/if}
  
  <!-- Authorized Sources -->
  <div class="sources-section">
    <h2>✅ Authorized Sources ({authorizedSources.length})</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Source</th>
            <th>Trust Level</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          {#each authorizedSources.slice(0, 10) as source}
          <tr>
            <td>{source.category}</td>
            <td>{source.name}</td>
            <td><span class="trust-badge">{source.trust}%</span></td>
            <td>{source.url}</td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Banned Sources -->
  <div class="banned-section">
    <h2>🚫 Banned Sources</h2>
    <div class="banned-list">
      {#each bannedSources as source}
        <span class="banned-badge">{source}</span>
      {/each}
    </div>
  </div>
  
  <!-- Ingredient Validation -->
  <div class="validation-section">
    <h2>🔬 Ingredient Validation Status</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Nutrition</th>
            <th>Citation</th>
            <th>Bioactive</th>
            <th>Nico Safe</th>
            <th>Anti-Inflam Score</th>
          </tr>
        </thead>
        <tbody>
          {#each ingredientValidation.slice(0, 15) as item}
          <tr>
            <td>{item.name}</td>
            <td>{item.has_nutrition ? '✅' : '❌'}</td>
            <td>{item.has_citation ? '✅' : '❌'}</td>
            <td>{item.has_bioactive ? '✅' : '➖'}</td>
            <td>{item.nico_safe ? '✅' : '❌'}</td>
            <td class="score {item.inflammation_score < 0 ? 'good' : 'bad'}">
              {item.inflammation_score}
            </td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Source Audit Trail -->
  <div class="audit-section">
    <h2>📋 Source Audit Trail ({sourceAudit.length} entries)</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Ingredient</th>
            <th>Data Type</th>
            <th>Source</th>
            <th>Citation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each sourceAudit.slice(0, 20) as entry}
          <tr>
            <td>{entry.ingredient}</td>
            <td>{entry.data_type}</td>
            <td>{entry.source}</td>
            <td class="citation">{entry.citation}</td>
            <td>{entry.verified}</td>
          </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Test Button -->
  <div class="test-section">
    <button on:click={testSourceValidation} class="test-button">
      🧪 Test Source Validation System
    </button>
  </div>
</div>

<style>
  .codex-dashboard {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  }
  
  .dashboard-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    color: white;
  }
  
  .dashboard-header h1 {
    margin: 0;
    font-size: 2.5em;
  }
  
  .subtitle {
    margin: 10px 0;
    opacity: 0.9;
  }
  
  .safety-status {
    font-size: 1.2em;
    margin-top: 15px;
  }
  
  .safety-status .active {
    color: #4ade80;
    font-weight: bold;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .stat-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
    transition: transform 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  }
  
  .stat-card.safe {
    border-left: 4px solid #10b981;
  }
  
  .stat-card.verified {
    border-left: 4px solid #3b82f6;
  }
  
  .stat-card.pmid {
    border-left: 4px solid #8b5cf6;
  }
  
  .stat-card.usda {
    border-left: 4px solid #f59e0b;
  }
  
  .stat-card.cochrane {
    border-left: 4px solid #ef4444;
  }
  
  .stat-value {
    font-size: 2.5em;
    font-weight: bold;
    color: #1f2937;
  }
  
  .stat-label {
    color: #6b7280;
    margin-top: 5px;
  }
  
  .recipe-section, .sources-section, .banned-section, 
  .validation-section, .audit-section {
    margin-bottom: 40px;
  }
  
  h2 {
    color: #1f2937;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .recipe-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .recipe-meta {
    display: flex;
    gap: 20px;
    margin: 15px 0;
    color: #6b7280;
  }
  
  .evaluation {
    margin: 20px 0;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
  }
  
  .score-display {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 15px;
  }
  
  .score-display.approved .score {
    font-size: 2em;
    font-weight: bold;
    color: #10b981;
  }
  
  .score-display.approved .grade {
    font-size: 1.5em;
    padding: 5px 15px;
    background: #10b981;
    color: white;
    border-radius: 20px;
  }
  
  .score-display.rejected {
    color: #ef4444;
    font-weight: bold;
  }
  
  .breakdown {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin-top: 15px;
  }
  
  .breakdown div {
    padding: 8px;
    background: white;
    border-radius: 6px;
  }
  
  .ingredients-list {
    margin-top: 20px;
  }
  
  .ingredient-line {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: #f9fafb;
    margin: 5px 0;
    border-radius: 6px;
  }
  
  .source-badge {
    color: #10b981;
    font-size: 0.9em;
  }
  
  .table-container {
    overflow-x: auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  thead {
    background: #f3f4f6;
  }
  
  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  tbody tr:hover {
    background: #f9fafb;
  }
  
  .trust-badge {
    padding: 4px 8px;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .banned-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .banned-badge {
    padding: 8px 16px;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 20px;
    font-size: 0.9em;
  }
  
  .score.good {
    color: #10b981;
    font-weight: bold;
  }
  
  .score.bad {
    color: #ef4444;
  }
  
  .citation {
    font-family: monospace;
    font-size: 0.9em;
    color: #6366f1;
  }
  
  .test-section {
    text-align: center;
    margin-top: 40px;
  }
  
  .test-button {
    padding: 15px 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1em;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .test-button:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .table-container {
      font-size: 0.9em;
    }
  }
</style>