<!-- modules/nutrition/NutritionModule.svelte -->
<script>
  import { onMount } from 'svelte';
  export let activeTab;

  // Import nutrition components
  import RecipeSuggester from './components/RecipeSuggester.svelte';
  import BiomarkerTracking from './components/BiomarkerTracking.svelte';
  import MealPlanner from './components/MealPlanner.svelte';
  import CodexDashboard from './components/CodexDashboard.svelte';
  import CodexRecipeUI from './components/CodexRecipeUI.svelte';
  
  // Import nutrition stores  
  import { 
    nutritionProfile, 
    weeklyProgress, 
    todaysRecommendations 
  } from './stores/nutritionStore.js';

  // Future components (placeholders)
  let CodexDatabase = null;
  let NutritionTracker = null;

  onMount(async () => {
    // Load future components dynamically when they're created
    try {
      // These will be implemented later
      // CodexDatabase = (await import('./components/CodexDatabase.svelte')).default;
      // NutritionTracker = (await import('./components/NutritionTracker.svelte')).default;
    } catch (error) {
      console.log('Future nutrition components not yet available');
    }
  });

  // Check pantry module availability for enhanced integration
  let pantryAvailable = false;
  onMount(async () => {
    try {
      await import('../../stores/groceryStore.js');
      pantryAvailable = true;
    } catch {
      pantryAvailable = false;
    }
  });
</script>

<div class="nutrition-module">
  {#if activeTab === 'recipes'}
    <div class="tab-content">
      <div class="module-header">
        <div class="header-info">
          <h2>👨‍🍳 Recipe Suggester</h2>
          <p>Rețete inteligente bazate pe principiile CODEX N-OMAD</p>
        </div>
        
        <div class="codex-status">
          <div class="cycle-info">
            <span class="label">Ciclu mTOR:</span>
            <span class="phase {$nutritionProfile.currentPhase}">
              {$nutritionProfile.currentPhase === 'high' ? '🔥 High Protein' : '🌿 Plant Focus'}
            </span>
            <span class="day">Ziua {$nutritionProfile.cycleDay}/14</span>
          </div>
          
          <div class="plant-progress">
            <span class="label">Plante săptămana:</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: {$weeklyProgress.plantProgress}%"></div>
              <span class="progress-text">
                {$weeklyProgress.plantsAchieved}/30
              </span>
            </div>
          </div>
        </div>
      </div>

      <RecipeSuggester />
    </div>

  {:else if activeTab === 'biomarkers'}
    <div class="tab-content">
      <BiomarkerTracking />
    </div>

  {:else if activeTab === 'meals'}
    <div class="tab-content">
      <MealPlanner />
    </div>

  {:else if activeTab === 'dashboard'}
    <CodexDashboard />

  {:else if activeTab === 'generator'}
    <div class="tab-content">
      <CodexRecipeUI />
    </div>

  {:else if activeTab === 'meals_old'}
    <div class="tab-content placeholder">
        <div class="coming-soon">
          <h2>🍽️ Meal Planner</h2>
          <p>Planificarea meselor bazată pe ciclul mTOR și obiectivele nutriționale.</p>
          <div class="features-preview">
            <h3>Features în dezvoltare:</h3>
            <ul>
              <li>📅 Planificare săptămânală automată</li>
              <li>🔄 Sincronizare cu ciclul mTOR</li>
              <li>🛒 Generare listă cumpărături</li>
              <li>📊 Tracking macro și micro nutrienți</li>
              <li>⚡ Integrare Instant Pot</li>
            </ul>
          </div>
          
          <div class="current-recommendations">
            <h3>Recomandări pentru astăzi:</h3>
            <div class="recommendations-grid">
              <div class="recommendation">
                <span class="icon">🎯</span>
                <div class="content">
                  <strong>Proteină țintă:</strong>
                  <span>{$todaysRecommendations.targetProtein}</span>
                </div>
              </div>
              <div class="recommendation">
                <span class="icon">🌱</span>
                <div class="content">
                  <strong>Plante țintă:</strong>
                  <span>{$todaysRecommendations.targetPlants}</span>
                </div>
              </div>
              <div class="recommendation">
                <span class="icon">🍽️</span>
                <div class="content">
                  <strong>Masa recomandată:</strong>
                  <span>{$todaysRecommendations.mealType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>

  {:else if activeTab === 'codex'}
    <div class="tab-content placeholder">
      {#if CodexDatabase}
        <svelte:component this={CodexDatabase} />
      {:else}
        <div class="coming-soon">
          <h2>📚 CODEX Alimente</h2>
          <p>Baza de date completă cu informații nutriționale și proprietăți funcționale.</p>
          
          <div class="codex-principles">
            <h3>🧬 Principiile CODEX N-OMAD:</h3>
            <div class="principles-grid">
              <div class="principle">
                <h4>🔄 mTOR Cycling</h4>
                <p>Alternarea între zile cu proteină ridicată (1-3, 8-10) și zile cu focus pe plante (4-7, 11-14) într-un ciclu de 14 zile.</p>
              </div>
              
              <div class="principle">
                <h4>🌿 Diversitatea Plantelor</h4>
                <p>Obiectiv de 30+ plante diferite pe săptămână pentru maximizarea microbiotei intestinale.</p>
              </div>
              
              <div class="principle">
                <h4>🔥 Anti-Inflammatory</h4>
                <p>Prioritizarea alimentelor cu proprietăți anti-inflamatoare: turmeric, ghimbir, afine, salmón.</p>
              </div>
              
              <div class="principle">
                <h4>⚡ Instant Pot Strategy</h4>
                <p>Stratificare corectă în Instant Pot pentru păstrarea nutrienților și texturii.</p>
              </div>
              
              <div class="principle">
                <h4>🧠 Longevitate</h4>
                <p>Alimentele care promovează sănătatea cerebrală și longevitatea: nuci, avocado, broccoli.</p>
              </div>
              
              <div class="principle">
                <h4>⏰ Sincronizare Circadiană</h4>
                <p>Aliniera tipurilor de mese cu ritmurile naturale ale corpului.</p>
              </div>
            </div>
          </div>

          <div class="database-preview">
            <h3>Preview Database:</h3>
            <div class="food-categories">
              <div class="category">
                <h4>🥩 Proteine Animale</h4>
                <p>Salmón, sardine, ouă, pui organic</p>
              </div>
              <div class="category">
                <h4>🌱 Proteine Vegetale</h4>
                <p>Linte, naut, quinoa, semințe</p>
              </div>
              <div class="category">
                <h4>🥬 Super Greens</h4>
                <p>Kale, spanac, rucola, broccoli</p>
              </div>
              <div class="category">
                <h4>🫐 Antioxidanți</h4>
                <p>Afine, mure, rodie, cacao</p>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  {:else if activeTab === 'tracking'}
    <div class="tab-content placeholder">
      {#if NutritionTracker}
        <svelte:component this={NutritionTracker} />
      {:else}
        <div class="coming-soon">
          <h2>📊 Nutrition Tracker</h2>
          <p>Urmărirea detaliată a progresului nutrițional și a obiectivelor CODEX.</p>
          
          <div class="current-stats">
            <h3>Statusul actual:</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <h4>Ciclul mTOR</h4>
                <div class="cycle-visual">
                  <div class="cycle-days">
                    {#each Array(14).fill(0) as _, i}
                      <div class="day {$nutritionProfile.cycleDay - 1 === i ? 'active' : ''} {i < 3 || (i >= 7 && i < 10) ? 'high-protein' : 'low-protein'}">
                        {i + 1}
                      </div>
                    {/each}
                  </div>
                  <div class="cycle-legend">
                    <span class="high-protein">🔥 High Protein</span>
                    <span class="low-protein">🌿 Plant Focus</span>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <h4>Progres Plante</h4>
                <div class="plant-chart">
                  <div class="circular-progress">
                    <div class="progress-circle" style="--progress: {$weeklyProgress.plantProgress}%">
                      <span class="progress-number">{$weeklyProgress.plantsAchieved}</span>
                      <span class="progress-total">/30</span>
                    </div>
                  </div>
                  <p>Plante diferite săptămâna aceasta</p>
                </div>
              </div>

              <div class="stat-card">
                <h4>Risc Inflamație</h4>
                <div class="risk-meter">
                  <div class="meter-bar">
                    <div class="risk-fill" style="width: {$nutritionProfile.inflammationRisk * 100}%"></div>
                  </div>
                  <span class="risk-level">
                    {$nutritionProfile.inflammationRisk < 0.3 ? '🟢 Scăzut' : 
                     $nutritionProfile.inflammationRisk < 0.7 ? '🟡 Moderat' : '🔴 Ridicat'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="integration-status">
            <h3>Integrări active:</h3>
            <div class="integrations">
              {#if pantryAvailable}
                <div class="integration active">
                  <span class="icon">📦</span>
                  <span>Pantry Module - Inventory aware recipes</span>
                </div>
              {:else}
                <div class="integration inactive">
                  <span class="icon">📦</span>
                  <span>Pantry Module - Standalone mode</span>
                </div>
              {/if}
              
              <div class="integration active">
                <span class="icon">🧬</span>
                <span>CODEX Principles - Active</span>
              </div>
              
              <div class="integration active">
                <span class="icon">⚡</span>
                <span>Instant Pot Optimization - Enabled</span>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>

  {:else}
    <div class="tab-content">
      <div class="nutrition-dashboard">
        <h2>🍽️ Nutrition Module Dashboard</h2>
        <p>Bun venit în modulul de nutriție bazat pe principiile CODEX N-OMAD!</p>
        
        <div class="quick-actions">
          <button class="action-card" on:click={() => activeTab = 'recipes'}>
            <span class="icon">👨‍🍳</span>
            <h3>Recipe Suggester</h3>
            <p>Găsește rețete personalizate</p>
          </button>
          
          <button class="action-card" on:click={() => activeTab = 'biomarkers'}>
            <span class="icon">🔬</span>
            <h3>Biomarker Tracking</h3>
            <p>Monitorizează markerii de sănătate</p>
          </button>
          
          <button class="action-card" on:click={() => activeTab = 'meals'}>
            <span class="icon">🍽️</span>
            <h3>Meal Planner</h3>
            <p>Planificare inteligentă de mese</p>
          </button>
          
          <button class="action-card" on:click={() => activeTab = 'dashboard'}>
            <span class="icon">🧬</span>
            <h3>CODEX Dashboard</h3>
            <p>Evidence-based monitoring system</p>
          </button>
          
          <button class="action-card" on:click={() => activeTab = 'generator'}>
            <span class="icon">🚀</span>
            <h3>Recipe Generator v4.0</h3>
            <p>Generare rețete cu workflow logic impecabil</p>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .nutrition-module {
    width: 100%;
    min-height: 500px;
  }

  .tab-content {
    padding: 20px;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    padding: 20px;
    background: var(--panel, #2d2d2d);
    border-radius: 12px;
  }

  .header-info h2 {
    margin: 0 0 5px 0;
    color: var(--acc, #80b8ff);
  }

  .header-info p {
    margin: 0;
    color: var(--muted, #9aa3b2);
  }

  .codex-status {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: flex-end;
  }

  .cycle-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .phase {
    padding: 6px 12px;
    border-radius: 6px;
    font-weight: 600;
  }

  .phase.high {
    background: #dc2626;
    color: white;
  }

  .phase.low {
    background: #16a34a;
    color: white;
  }

  .plant-progress {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-bar {
    position: relative;
    width: 150px;
    height: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #dc2626 0%, #f59e0b 50%, #16a34a 100%);
    transition: width 0.3s ease;
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
  }

  .coming-soon {
    text-align: center;
    padding: 40px 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .coming-soon h2 {
    color: var(--acc, #80b8ff);
    margin-bottom: 15px;
  }

  .features-preview {
    margin: 40px 0;
    text-align: left;
  }

  .features-preview ul {
    list-style: none;
    padding: 0;
  }

  .features-preview li {
    padding: 8px 0;
    border-bottom: 1px solid var(--border, #404040);
  }

  .current-recommendations {
    margin: 40px 0;
    padding: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 12px;
  }

  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .recommendation {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    background: var(--panel, #2d2d2d);
    border-radius: 8px;
  }

  .recommendation .icon {
    font-size: 1.5rem;
  }

  .codex-principles {
    margin: 40px 0;
    text-align: left;
  }

  .principles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .principle {
    padding: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 12px;
    border-left: 4px solid var(--acc, #80b8ff);
  }

  .principle h4 {
    margin: 0 0 10px 0;
    color: var(--acc, #80b8ff);
  }

  .database-preview {
    margin: 40px 0;
  }

  .food-categories {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .category {
    padding: 15px;
    background: var(--panel2, #1a1a1a);
    border-radius: 8px;
  }

  .category h4 {
    margin: 0 0 8px 0;
    color: var(--ink, #e6e9ff);
  }

  .current-stats {
    margin: 40px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .stat-card {
    padding: 20px;
    background: var(--panel2, #1a1a1a);
    border-radius: 12px;
  }

  .cycle-visual {
    margin-top: 15px;
  }

  .cycle-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    margin-bottom: 15px;
  }

  .day {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .day.high-protein {
    background: #dc2626;
    color: white;
  }

  .day.low-protein {
    background: #16a34a;
    color: white;
  }

  .day.active {
    ring: 2px solid var(--acc, #80b8ff);
    transform: scale(1.1);
  }

  .cycle-legend {
    display: flex;
    gap: 15px;
    font-size: 0.8rem;
  }

  .circular-progress {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 15px auto;
  }

  .progress-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(var(--acc, #80b8ff) var(--progress, 0%), var(--panel, #2d2d2d) 0%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .progress-number {
    font-size: 2rem;
    font-weight: 600;
    color: var(--acc, #80b8ff);
  }

  .progress-total {
    font-size: 0.9rem;
    color: var(--muted, #9aa3b2);
  }

  .risk-meter {
    margin-top: 15px;
  }

  .meter-bar {
    height: 20px;
    background: var(--panel, #2d2d2d);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .risk-fill {
    height: 100%;
    background: linear-gradient(90deg, #16a34a 0%, #f59e0b 50%, #dc2626 100%);
  }

  .integration-status {
    margin: 40px 0;
  }

  .integrations {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
  }

  .integration {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    background: var(--panel2, #1a1a1a);
    border-radius: 8px;
  }

  .integration.active {
    border-left: 4px solid #16a34a;
  }

  .integration.inactive {
    border-left: 4px solid #f59e0b;
    opacity: 0.7;
  }

  .nutrition-dashboard {
    text-align: center;
    padding: 40px;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 40px;
  }

  .action-card {
    padding: 30px 20px;
    background: var(--panel, #2d2d2d);
    border: 1px solid var(--border, #404040);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .action-card:hover:not(.disabled) {
    transform: translateY(-2px);
    border-color: var(--acc, #80b8ff);
  }

  .action-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-card .icon {
    font-size: 3rem;
    margin-bottom: 15px;
  }

  .action-card h3 {
    margin: 0 0 10px 0;
    color: var(--acc, #80b8ff);
  }

  .action-card p {
    margin: 0;
    color: var(--muted, #9aa3b2);
  }

  @media (max-width: 768px) {
    .module-header {
      flex-direction: column;
      gap: 20px;
    }

    .codex-status {
      align-items: flex-start;
    }

    .principles-grid,
    .stats-grid,
    .quick-actions {
      grid-template-columns: 1fr;
    }

    .recommendations-grid {
      grid-template-columns: 1fr;
    }
  }
</style>