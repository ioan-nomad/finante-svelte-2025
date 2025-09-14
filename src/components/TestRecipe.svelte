<script>
  import { onMount } from 'svelte';
  import { RecipeEngine } from '../modules/nutrition/RecipeEngine.js';

  let recipeEngine = null;
  let testResults = '';
  let loading = false;
  let error = null;

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
  </div>

  {#if loading}
    <div class="loading">Loading...</div>
  {/if}

  {#if testResults}
    <pre class="results">{testResults}</pre>
  {/if}
</div>

<style>
  .test-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: #333;
    margin-bottom: 20px;
  }

  .buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  button:hover:not(:disabled) {
    background: #45a049;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .results {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 5px;
    white-space: pre-wrap;
    font-family: monospace;
    max-height: 600px;
    overflow-y: auto;
  }

  .error {
    background: #ffebee;
    color: #c62828;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
  }

  .loading {
    text-align: center;
    color: #666;
    padding: 20px;
  }
</style>