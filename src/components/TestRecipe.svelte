<script>
  import { onMount } from 'svelte';
  import { RecipeEngine } from '../modules/nutrition/RecipeEngine.js';
  import RecipeDisplayCard from './RecipeDisplayCard.svelte';

  let recipeEngine = null;
  let testResults = '';
  let loading = false;
  let error = null;
  let displayRecipe = null;

  onMount(() => {
    try {
      recipeEngine = new RecipeEngine();
      testResults = '✅ RecipeEngine loaded successfully!\n';
    } catch (err) {
      error = `Failed to load RecipeEngine: ${err.message}`;
    }
  });

  async function testRecipeGeneration() {
    if (!recipeEngine) {
      error = 'RecipeEngine not loaded!';
      return;
    }

    loading = true;
    testResults = 'Generating recipe...\n';

    try {
      const recipe = await recipeEngine.generateOMADRecipe({
        preferences: { vegetarian: false },
        mTORPhase: 'high'
      });

      testResults = `
✅ RECIPE GENERATED SUCCESSFULLY!

📋 Name: ${recipe.name}
⏰ Cooking Time: ${recipe.cookingTime} minutes
🔥 Calories: ${recipe.nutrition.calories} kcal
💪 Protein: ${recipe.nutrition.protein}g
🌱 Plants: ${recipe.metadata.plantDiversity}
🏆 CODEX Score: ${recipe.codexScore}

INGREDIENTS (${recipe.ingredients.length}):
${recipe.ingredients.map(i => `- ${i.name}: ${i.amount}${i.unit}`).join('\n')}

SHOPPING LIST (${recipe.shoppingList.length} items):
${recipe.shoppingList.map(s => `- ${s.item}: ${s.estimatedCost} RON`).join('\n')}
Total Cost: ${recipe.shoppingList.reduce((sum, i) => sum + i.estimatedCost, 0)} RON
      `;

      displayRecipe = recipe;

    } catch (err) {
      error = `Recipe generation failed: ${err.message}`;
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function testSmartGenerator() {
    loading = true;
    testResults = 'Testing SmartRecipeGenerator...\n';

    try {
      const { generateOMADRecipe } = await import('../modules/nutrition/codex/SmartRecipeGenerator.js');
      const recipe = await generateOMADRecipe({ mTORPhase: 'high' });

      testResults = `
✅ SMART GENERATOR WORKS!

📋 Name: ${recipe.name}
⏱️ Time: ${recipe.instantPotTime} min
🕖 Timing: ${recipe.timing}

NUTRITION:
- Calories: ${recipe.nutrition.calories}
- Protein: ${recipe.nutrition.protein}g
- Plants: ${recipe.nutrition.plantSpecies}
      `;
    } catch (err) {
      error = `SmartGenerator failed: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  async function testPantryData() {
    testResults = 'Checking pantry data...\n';

    const pantryData = localStorage.getItem('groceryInventory');
    if (pantryData) {
      const parsed = JSON.parse(pantryData);
      testResults = `
✅ PANTRY DATA FOUND!
Items: ${Object.keys(parsed.inventory || {}).length}

${JSON.stringify(parsed.inventory, null, 2)}
      `;
    } else {
      testResults = '❌ No pantry data in localStorage';
    }
  }

  async function testShoppingManager() {
    testResults = 'Testing smart shopping list generation...\n';

    try {
      const { shoppingListManager } = await import('../modules/nutrition/ShoppingListManager.js');

      // Create a test recipe
      const testRecipe = {
        name: 'Test OMAD Recipe',
        ingredients: [
          { name: 'somon', amount: 200, unit: 'g' },
          { name: 'broccoli', amount: 150, unit: 'g' },
          { name: 'quinoa', amount: 100, unit: 'g' },
          { name: 'avocado', amount: 1, unit: 'buc' },
          { name: 'spanac', amount: 100, unit: 'g' }
        ]
      };

      // Get pantry data
      const pantryData = localStorage.getItem('groceryInventory');
      const inventory = pantryData ? JSON.parse(pantryData).inventory : {};

      // Generate smart shopping list
      const shoppingList = shoppingListManager.generateSmartShoppingList([testRecipe], inventory);

      testResults = `
✅ SMART SHOPPING LIST GENERATED!

📊 STATISTICI:
- Magazine de vizitat: ${shoppingList.route.length}
- Total produse: ${shoppingList.items.length}
- Cost total estimat: ${shoppingList.totalCost.toFixed(2)} RON
- Timp estimat: ${shoppingList.estimatedTime} minute

🗺️ RUTĂ OPTIMIZATĂ:
${shoppingList.route.map((store, idx) =>
  `${idx + 1}. ${store} - ${shoppingList.byStore[store].items.length} produse (${shoppingList.byStore[store].subtotal.toFixed(2)} RON)`
).join('\n')}

🛒 DETALII PE MAGAZINE:
${shoppingList.route.map(store =>
  `\n📍 ${store}:\n${shoppingList.byStore[store].items.map(item =>
    `  - ${item.name}: ${item.totalAmount}${item.unit} (~${item.estimatedPrice.toFixed(2)} RON)`
  ).join('\n')}`
).join('\n')}

📋 EXPORT TEXT:
${shoppingListManager.exportToText(shoppingList)}
      `;

    } catch (error) {
      testResults = `❌ Shopping Manager error: ${error.message}`;
      console.error(error);
    }
  }

  async function testMTORAutomation() {
    testResults = 'Testing mTOR automation system...\n';

    try {
      const { mtorAutomation } = await import('../modules/nutrition/mtor/mtorTracker.js');

      // Start automation if not running
      if (!mtorAutomation.getAutomationStatus().running) {
        mtorAutomation.startAutomation();
      }

      // Get status and analytics
      const status = mtorAutomation.getAutomationStatus();
      const analytics = mtorAutomation.getCycleAnalytics();

      testResults = `
✅ mTOR AUTOMATION SYSTEM TESTED!

🤖 AUTOMATION STATUS:
- Running: ${status.running ? 'YES' : 'NO'}
- Current Day: ${status.currentDay}/14
- Current Phase: ${status.currentPhase.toUpperCase()}
- Last Check: ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('ro-RO') : 'Never'}
- Notifications: ${status.notifications}

${analytics ? `
📊 CYCLE ANALYTICS:
- Total Cycles Completed: ${analytics.totalCycles}
- Average Completion Rate: ${analytics.avgCompletionRate}%
- Trend: ${analytics.trend.toUpperCase()}
- Best Cycle: ${analytics.bestCycle?.completionRate || 'N/A'}%

🎯 PREDICTIONS:
- Next Cycle Protein Target: ${analytics.predictions?.nextCycleProteinTarget || 'N/A'}g
- Next Cycle Plant Target: ${analytics.predictions?.nextCyclePlantTarget || 'N/A'} species
- Estimated Completion Rate: ${analytics.predictions?.estimatedCompletionRate || 'N/A'}%
` : `
📊 ANALYTICS: No historical data yet
- Start using the system to see analytics
- Complete at least one cycle for predictions
`}

🔔 NOTIFICATIONS:
${JSON.parse(localStorage.getItem('mtor_notifications') || '[]')
  .slice(0, 3)
  .map(n => `- ${n.title}: ${n.message}`)
  .join('\n') || '- No notifications yet'}

💡 TIP: Visit 'mTOR Cycle' tab for full dashboard
      `;

    } catch (error) {
      testResults = `❌ mTOR Automation error: ${error.message}`;
      console.error(error);
    }
  }
</script>

<div class="test-container">
  <h1>🧪 Recipe Generator Test</h1>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="buttons">
    <button on:click={testRecipeGeneration} disabled={loading}>
      Test RecipeEngine
    </button>
    <button on:click={testSmartGenerator} disabled={loading}>
      Test SmartGenerator
    </button>
    <button on:click={testPantryData} disabled={loading}>
      Check Pantry Data
    </button>
    <button on:click={testShoppingManager} disabled={loading}>
      Test Smart Shopping
    </button>
    <button on:click={testMTORAutomation} disabled={loading}>
      Test mTOR Automation
    </button>
  </div>

  {#if loading}
    <div class="loading">Loading...</div>
  {/if}

  {#if testResults}
    <pre class="results">{testResults}</pre>
  {/if}

  {#if displayRecipe}
    <RecipeDisplayCard recipe={displayRecipe} />
  {/if}
</div>

<style>
  .test-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    background: var(--panel, white);
    border-radius: 12px;
  }

  h1 {
    color: var(--ink, #333);
    margin-bottom: 20px;
  }

  .buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* FIX CRITICAL - Rezultate vizibile */
  .results {
    background: var(--panel2, #f9f9f9);
    color: var(--ink, #333) !important; /* FORȚEAZĂ culoare text */
    padding: 20px;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    max-height: 600px;
    overflow-y: auto;
    border: 2px solid var(--border, #e0e0e0);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  }

  /* Dark mode support */
  :global(.dark-mode) .results {
    background: #2a2a2a !important;
    color: #e0e0e0 !important;
    border-color: #444;
  }

  :global(.dark-mode) .test-container {
    background: #1a1a1a;
  }

  :global(.dark-mode) h1 {
    color: #e0e0e0;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    border-left: 4px solid #f44336;
    font-weight: 500;
  }

  :global(.dark-mode) .error {
    background: #4a1c1c;
    color: #ff8a80;
    border-left-color: #ff5252;
  }

  .loading {
    text-align: center;
    color: var(--muted, #666);
    padding: 20px;
    font-size: 18px;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Scrollbar styling */
  .results::-webkit-scrollbar {
    width: 8px;
  }

  .results::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .results::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .results::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Success state styling */
  .results.success {
    border-color: #4CAF50;
    background: #f1f8e9;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .buttons {
      flex-direction: column;
    }

    button {
      width: 100%;
    }

    .test-container {
      padding: 15px;
      margin: 10px;
    }
  }
</style>