<script>
  import { onMount } from 'svelte';
  import { generateOMADRecipe } from '../codex/SmartRecipeGenerator.js';
  
  export let mTORPhase = 'high';
  
  let currentRecipe = null;
  let loading = false;
  
  onMount(() => {
    generateRecipe();
  });
  
  async function generateRecipe() {
    loading = true;
    try {
      currentRecipe = await generateOMADRecipe({ mTORPhase });
    } catch (error) {
      console.error('Recipe generation failed:', error);
    }
    loading = false;
  }
</script>

<div class="recipe-display">
  {#if loading}
    <div class="loading">Generating OMAD recipe...</div>
  {:else if currentRecipe}
    <div class="recipe-card">
      <h2>{currentRecipe.name}</h2>
      <div class="timing">🕖 {currentRecipe.timing} | ⏱️ {currentRecipe.instantPotTime} min</div>
      
      <div class="layers">
        <h3>Instant Pot Layers:</h3>
        {#each Object.entries(currentRecipe.layers) as [layer, ingredients]}
          <div class="layer {layer}">
            <h4>{layer}:</h4>
            {#each ingredients as item}
              <span class:unavailable={!item.available}>
                {item.ingredient} - {item.amount}
              </span>
            {/each}
          </div>
        {/each}
      </div>
      
      <div class="nutrition">
        <h3>Nutrition:</h3>
        <div class="stats">
          <span>🔥 {currentRecipe.nutrition.calories} cal</span>
          <span>💪 {currentRecipe.nutrition.protein}g protein</span>
          <span>🌱 {currentRecipe.nutrition.plantSpecies} plants</span>
        </div>
      </div>
      
      <button on:click={generateRecipe}>Generate New Recipe</button>
    </div>
  {/if}
</div>

<style>
  .recipe-display {
    padding: 20px;
    max-width: 600px;
  }
  
  .recipe-card {
    background: var(--panel);
    border-radius: 12px;
    padding: 24px;
  }
  
  .unavailable {
    opacity: 0.5;
    text-decoration: line-through;
  }
  
  .layer {
    margin: 12px 0;
    padding: 12px;
    background: var(--panel2);
    border-radius: 8px;
  }
  
  .nutrition .stats {
    display: flex;
    gap: 20px;
    margin-top: 12px;
  }
</style>