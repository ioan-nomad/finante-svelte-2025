<script>
  import { onMount } from 'svelte';
  import { nutritionProfile } from '../stores/nutritionStore.js';
  import { CodexScorer } from '../codex/codexScoring.js';
  import { CODEX_INGREDIENTS } from '../codex/codexDatabase.js';
  import { recipeEngine } from '../RecipeEngine.js';
  
  const scorer = new CodexScorer();
  
  let selectedRecipe = null;
  let recipeScore = null;
  let showScientificDetails = false;
  let generatedRecipe = null;
  let isGenerating = false;
  
  // Evidence-based recipes with CODEX scoring
  const codexRecipes = [
    {
      id: 'longevity_bowl_v2',
      name: 'Longevity Bowl Evidence-Based',
      category: 'anti-inflammatory',
      servings: 2,
      totalCalories: 2500,
      
      ingredients: [
        { name: 'turmeric', amount: 5, unit: 'g', carbs: 3.2 },
        { name: 'ginger', amount: 15, unit: 'g', carbs: 2.7 },
        { name: 'black pepper', amount: 2, unit: 'g', carbs: 1.3 },
        { name: 'red lentils', amount: 200, unit: 'g', carbs: 40 },
        { name: 'quinoa', amount: 150, unit: 'g', carbs: 30 },
        { name: 'spinach', amount: 200, unit: 'g', carbs: 7 },
        { name: 'broccoli', amount: 150, unit: 'g', carbs: 10 },
        { name: 'sweet potato', amount: 300, unit: 'g', carbs: 60 },
        { name: 'walnuts', amount: 30, unit: 'g', carbs: 4 },
        { name: 'garlic', amount: 10, unit: 'g', carbs: 3 },
        { name: 'lemon', amount: 30, unit: 'ml', carbs: 3 },
        { name: 'olive oil', amount: 30, unit: 'ml', carbs: 0 }
      ],
      
      evidence: {
        antiInflammatory: {
          score: 94,
          mechanism: "Curcumin inhibits NF-κB, IL-6, TNF-α",
          pmid: "27533649",
          clinicalEffect: "CRP reduction 1.5mg/L in 8 weeks"
        },
        glycemicLoad: {
          value: 18,
          category: "Medium",
          pmid: "34506976",
          effect: "Stable glucose, no spikes >140mg/dL"
        },
        microbiome: {
          plantCount: 9,
          fiberGrams: 28,
          pmid: "29795809",
          effect: "Increased Akkermansia, Bifidobacterium"
        }
      },
      
      instantPot: {
        layers: [
          "Layer 1: Sauté garlic, ginger in olive oil (3 min)",
          "Layer 2: Add turmeric, black pepper (30 sec)",
          "Layer 3: Add lentils, quinoa with 600ml water",
          "Layer 4: Sweet potato chunks on trivet above",
          "Layer 5: Broccoli, spinach in steamer basket",
          "NO STIRRING - maintains stratification"
        ],
        settings: "High Pressure 12 min, Natural Release 10 min",
        pmid: "35294969"
      },
      
      getTotalNutrients() {
        return {
          protein: 38,
          fiber: 28,
          omega3: 2.8,
          vitaminA: 15000,
          vitaminC: 120,
          vitaminE: 8,
          calcium: 450,
          iron: 12,
          magnesium: 380,
          potassium: 2800,
          saturatedFat: 4,
          sugar: 12,
          sodium: 180
        };
      },
      
      getTotalCalories() {
        return 2500;
      }
    },
    
    {
      id: 'mtor_cycling_high',
      name: 'mTOR Activation Bowl (High Protein Day)',
      category: 'muscle-synthesis',
      servings: 2,
      totalCalories: 2500,
      
      ingredients: [
        { name: 'chicken breast', amount: 300, unit: 'g', carbs: 0 },
        { name: 'white rice', amount: 200, unit: 'g', carbs: 56 },
        { name: 'black beans', amount: 150, unit: 'g', carbs: 27 },
        { name: 'eggs', amount: 100, unit: 'g', carbs: 1 },
        { name: 'greek yogurt', amount: 150, unit: 'g', carbs: 6 },
        { name: 'almonds', amount: 40, unit: 'g', carbs: 8 },
        { name: 'kale', amount: 100, unit: 'g', carbs: 6 },
        { name: 'cherry tomatoes', amount: 150, unit: 'g', carbs: 6 },
        { name: 'avocado', amount: 100, unit: 'g', carbs: 9 },
        { name: 'olive oil', amount: 20, unit: 'ml', carbs: 0 }
      ],
      
      evidence: {
        mTOR: {
          activation: "3g leucine threshold met",
          pmid: "28388417",
          window: "4-hour anabolic window post-meal"
        },
        proteinSynthesis: {
          rate: "280% increase MPS",
          pmid: "35166330",
          leucine: "3.2g per serving"
        }
      },
      
      instantPot: {
        layers: [
          "Layer 1: Chicken with herbs at bottom",
          "Layer 2: Rice with 400ml bone broth",
          "Layer 3: Black beans on trivet",
          "Layer 4: Eggs in silicone cups",
          "Post-cooking: Add fresh vegetables"
        ],
        settings: "High Pressure 8 min, Quick Release"
      },
      
      getTotalNutrients() {
        return {
          protein: 95,
          fiber: 18,
          omega3: 0.8,
          leucine: 6.4,
          vitaminD: 80,
          calcium: 380,
          iron: 8,
          magnesium: 290,
          saturatedFat: 12,
          sugar: 8,
          sodium: 420
        };
      },
      
      getTotalCalories() {
        return 2500;
      }
    }
  ];
  
  function scoreRecipe(recipe) {
    recipeScore = scorer.scoreRecipe(recipe);
    console.log('CODEX Score:', recipeScore);
  }
  
  function selectRecipe(recipe) {
    selectedRecipe = recipe;
    scoreRecipe(recipe);
  }
  
  function getIngredientInfo(name) {
    return CODEX_INGREDIENTS[name.toLowerCase().replace(' ', '')] || null;
  }

  async function generateRealOMADRecipe() {
    isGenerating = true;
    console.log('🚀 Generating REAL OMAD recipe with unified RecipeEngine v3.0...');
    
    try {
      const preferences = {
        vegetarian: false,
        targetCalories: 2400,
        antiInflammatory: true,
        maxIngredients: 12
      };
      
      // Generate recipe with real pantry integration
      generatedRecipe = await recipeEngine.generateOMADRecipe(preferences);
      console.log('✅ Generated recipe with pantry integration:', generatedRecipe);
      
      // Auto-select the generated recipe for display
      selectedRecipe = {
        id: 'generated_omad_v3',
        name: generatedRecipe.name,
        category: 'generated_real',
        servings: 1,
        totalCalories: Math.round(generatedRecipe.nutrition.calories),
        ingredients: generatedRecipe.ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          carbs: ing.nutrientData?.nutrition?.carbs || 0,
          source: ing.pantrySource ? '📦 Pantry' : '🛒 Buy',
          freshness: ing.freshness
        })),
        evidence: {
          codexScore: {
            score: generatedRecipe.codexScore,
            mechanism: "Real pantry + nutrition optimization",
            clinicalEffect: `${generatedRecipe.metadata.plantDiversity} plants, ${Math.round(generatedRecipe.nutrition.protein)}g protein, DRI: ${generatedRecipe.driPercentages.protein}%`
          },
          pantryIntegration: {
            fromPantry: generatedRecipe.ingredients.filter(i => i.pantrySource).length,
            needToBuy: generatedRecipe.shoppingList.length,
            totalCost: generatedRecipe.shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0)
          }
        },
        instantPot: {
          layers: generatedRecipe.instantPotLayers.instructions.map(inst => 
            `${inst.step}. ${inst.action}: ${inst.details}`
          ),
          settings: `High Pressure ${generatedRecipe.cookingTime} min, Natural Release`,
          pmid: "PMID_31813824 - Instant Pot nutrient retention"
        },
        shoppingList: generatedRecipe.shoppingList,
        driPercentages: generatedRecipe.driPercentages,
        getTotalNutrients() {
          return generatedRecipe.nutrition;
        },
        getTotalCalories() {
          return Math.round(generatedRecipe.nutrition.calories);
        }
      };
      
      scoreRecipe(selectedRecipe);
      
    } catch (error) {
      console.error('❌ Error generating recipe:', error);
      alert('Recipe generation failed. Check console for details.');
    } finally {
      isGenerating = false;
    }
  }
</script>

<div class="recipe-suggester">
  <div class="codex-header">
    <h2>🧬 CODEX Recipe System v2.0</h2>
    <p class="subtitle">Evidence-Based Nutritional Engineering</p>
    <div class="principles">
      <span class="principle">Longevity: IGF-1 below 100 ng/mL</span>
      <span class="principle">Inflammation: hs-CRP below 1.0 mg/L</span>
      <span class="principle">Metabolic: HbA1c below 5.5%</span>
    </div>
    <div class="generate-section">
      <button 
        class="generate-btn" 
        on:click={generateRealOMADRecipe}
        disabled={isGenerating}
      >
        {#if isGenerating}
          🔄 Generating...
        {:else}
          ⚡ Generate Real OMAD Recipe
        {/if}
      </button>
    </div>
  </div>

  <div class="recipes-grid">
    {#each codexRecipes as recipe}
      <div class="recipe-card" on:click={() => selectRecipe(recipe)}>
        <h3>{recipe.name}</h3>
        <div class="recipe-meta">
          <span class="calories">🔥 {recipe.totalCalories} kcal</span>
          <span class="servings">👥 {recipe.servings} servings</span>
        </div>
        <div class="evidence-badges">
          {#if recipe.evidence.antiInflammatory}
            <span class="badge anti-inflam">
              Anti-Inflammatory: {recipe.evidence.antiInflammatory.score}
            </span>
          {/if}
          {#if recipe.evidence.mTOR}
            <span class="badge mtor">mTOR Optimized</span>
          {/if}
          {#if recipe.evidence.microbiome}
            <span class="badge microbiome">
              {recipe.evidence.microbiome.plantCount} plants
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if selectedRecipe && recipeScore}
    <div class="recipe-detail">
      <div class="score-panel">
        <h3>CODEX Scoring Analysis</h3>
        <div class="overall-score">
          <div class="score-circle" data-score={recipeScore.overall}>
            <span class="score-value">{recipeScore.overall}</span>
            <span class="score-label">Overall Score</span>
          </div>
        </div>
        
        <div class="score-breakdown">
          <div class="metric">
            <span class="metric-name">Anti-Inflammatory</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: {recipeScore.breakdown.antiInflammatory}%"></div>
            </div>
            <span class="metric-value">{recipeScore.breakdown.antiInflammatory.toFixed(1)}/100</span>
            <span class="metric-ref">PMID: 24172307</span>
          </div>
          
          <div class="metric">
            <span class="metric-name">Nutrient Density</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: {recipeScore.breakdown.nutrientDensity}%"></div>
            </div>
            <span class="metric-value">{recipeScore.breakdown.nutrientDensity.toFixed(1)}/100</span>
            <span class="metric-ref">PMID: 31111871</span>
          </div>
          
          <div class="metric">
            <span class="metric-name">Glycemic Impact</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: {recipeScore.breakdown.glycemicImpact}%"></div>
            </div>
            <span class="metric-value">{recipeScore.breakdown.glycemicImpact.toFixed(1)}/100</span>
            <span class="metric-ref">PMID: 34506976</span>
          </div>
          
          <div class="metric">
            <span class="metric-name">Microbiome Support</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: {recipeScore.breakdown.microbiome}%"></div>
            </div>
            <span class="metric-value">{recipeScore.breakdown.microbiome.toFixed(1)}/100</span>
            <span class="metric-ref">PMID: 29795809</span>
          </div>
          
          <div class="metric">
            <span class="metric-name">Bioavailability</span>
            <div class="metric-bar">
              <div class="metric-fill" style="width: {recipeScore.breakdown.bioavailability}%"></div>
            </div>
            <span class="metric-value">{recipeScore.breakdown.bioavailability.toFixed(1)}/100</span>
            <span class="metric-ref">PMID: 36678332</span>
          </div>
        </div>
      </div>

      <div class="ingredients-scientific">
        <h3>Ingredients with Scientific Data</h3>
        <div class="ingredients-list">
          {#each selectedRecipe.ingredients as ingredient}
            {@const info = getIngredientInfo(ingredient.name)}
            <div class="ingredient-row">
              <span class="ing-name">{ingredient.name}</span>
              <span class="ing-amount">{ingredient.amount}{ingredient.unit}</span>
              {#if info}
                <button class="info-btn" on:click={() => showScientificDetails = !showScientificDetails}>
                  📚 Research
                </button>
              {/if}
            </div>
            
            {#if info && showScientificDetails}
              <div class="scientific-details">
                {#if info.therapeutic}
                  <div class="detail-section">
                    <h4>Therapeutic Properties</h4>
                    {#each Object.entries(info.therapeutic) as [key, value]}
                      <p><strong>{key}:</strong> {value.mechanism || value.efficacy}</p>
                      <p class="pmid">PMID: {value.pmid}</p>
                    {/each}
                  </div>
                {/if}
                
                {#if info.ayurveda}
                  <div class="detail-section">
                    <h4>Ayurvedic Classification</h4>
                    <p><strong>Rasa:</strong> {info.ayurveda.rasa}</p>
                    <p><strong>Dosha:</strong> {info.ayurveda.dosha}</p>
                    <p class="source">{info.ayurveda.source}</p>
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>

      <div class="instant-pot-protocol">
        <h3>Instant Pot Protocol (Evidence-Based)</h3>
        <div class="protocol-steps">
          {#each selectedRecipe.instantPot.layers as step, i}
            <div class="step">
              <span class="step-number">{i + 1}</span>
              <span class="step-text">{step}</span>
            </div>
          {/each}
          <div class="settings">
            <strong>Settings:</strong> {selectedRecipe.instantPot.settings}
          </div>
          {#if selectedRecipe.instantPot.pmid}
            <div class="reference">
              Nutrient retention study: PMID {selectedRecipe.instantPot.pmid}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .recipe-suggester {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .codex-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 5px 0 15px;
  }

  .principles {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .principle {
    background: rgba(255,255,255,0.2);
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 13px;
  }

  .generate-section {
    margin-top: 20px;
    text-align: center;
  }

  .generate-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .generate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .generate-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .recipes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .recipe-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .recipe-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border-color: #667eea;
  }

  .recipe-meta {
    display: flex;
    gap: 15px;
    margin: 10px 0;
    font-size: 14px;
    color: #64748b;
  }

  .evidence-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .badge.anti-inflam {
    background: #fef3c7;
    color: #92400e;
  }

  .badge.mtor {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge.microbiome {
    background: #d1fae5;
    color: #065f46;
  }

  .recipe-detail {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }

  .score-panel {
    margin-bottom: 40px;
  }

  .overall-score {
    text-align: center;
    margin: 30px 0;
  }

  .score-circle {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  }

  .score-value {
    font-size: 48px;
    font-weight: bold;
  }

  .score-label {
    font-size: 12px;
    opacity: 0.9;
  }

  .score-breakdown {
    display: grid;
    gap: 20px;
  }

  .metric {
    display: grid;
    grid-template-columns: 150px 1fr 80px 100px;
    align-items: center;
    gap: 15px;
  }

  .metric-name {
    font-weight: 600;
    font-size: 14px;
  }

  .metric-bar {
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }

  .metric-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.6s ease;
  }

  .metric-value {
    text-align: right;
    font-weight: 600;
    font-size: 14px;
  }

  .metric-ref {
    font-size: 11px;
    color: #64748b;
    text-align: right;
  }

  .ingredients-scientific {
    margin: 40px 0;
  }

  .ingredients-list {
    margin-top: 20px;
  }

  .ingredient-row {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    gap: 15px;
  }

  .ing-name {
    flex: 1;
    font-weight: 500;
  }

  .ing-amount {
    color: #64748b;
    font-size: 14px;
  }

  .info-btn {
    padding: 4px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .info-btn:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  .scientific-details {
    background: #f8fafc;
    padding: 15px;
    margin: 10px 0;
    border-radius: 8px;
    font-size: 13px;
  }

  .detail-section {
    margin-bottom: 15px;
  }

  .detail-section h4 {
    color: #667eea;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .pmid {
    color: #64748b;
    font-size: 11px;
    font-style: italic;
  }

  .instant-pot-protocol {
    background: #f8fafc;
    padding: 25px;
    border-radius: 12px;
    margin-top: 30px;
  }

  .protocol-steps {
    margin-top: 20px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;
    gap: 15px;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    font-size: 14px;
    flex-shrink: 0;
  }

  .step-text {
    flex: 1;
    line-height: 1.6;
  }

  .settings {
    margin-top: 20px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    border: 2px solid #667eea;
  }

  .reference {
    margin-top: 10px;
    font-size: 12px;
    color: #64748b;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .recipes-grid {
      grid-template-columns: 1fr;
    }
    
    .metric {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .metric-ref {
      text-align: left;
    }
  }
</style>