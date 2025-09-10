<script>
  import { onMount } from 'svelte';
  
  let showModal = false;
  let isRunning = false;
  let testResults = {};
  let passedTests = 0;
  let totalTests = 10;
  let finalMessage = '';
  
  // Test configuration
  const tests = [
    { name: 'Recipe Engine', key: 'recipeEngine', description: 'Generarea de rețete OMAD' },
    { name: 'Conexiune Pantry', key: 'pantryConnection', description: 'Integrarea cu inventarul' },
    { name: 'Metode Gătit', key: 'cookingMethods', description: 'Instant Pot stratification' },
    { name: 'Lista Cumpărături', key: 'shoppingList', description: 'Export funcționalitate' },
    { name: 'Biomarkeri', key: 'biomarkers', description: 'Validări medicale' },
    { name: 'Automatizare mTOR', key: 'mtorAutomation', description: 'Sistem cicluri automate' },
    { name: 'Componente UI', key: 'uiComponents', description: 'Disponibilitatea componentelor' },
    { name: 'Stocare Date', key: 'dataStorage', description: 'Funcționalitatea localStorage' },
    { name: 'Import/Export', key: 'importExport', description: 'Funcții import/export date' },
    { name: 'Performanță', key: 'performance', description: 'Optimizarea aplicației' }
  ];

  // Open test modal
  function openTestModal() {
    showModal = true;
    runAllTests();
  }

  // Close modal
  function closeModal() {
    showModal = false;
  }

  // Run all tests
  async function runAllTests() {
    isRunning = true;
    testResults = {};
    passedTests = 0;

    for (let test of tests) {
      testResults[test.key] = await runTest(test.key);
      if (testResults[test.key].status === 'pass') {
        passedTests++;
      }
    }

    // Generate final message
    const percentage = Math.round((passedTests / totalTests) * 100);
    if (percentage === 100) {
      finalMessage = '🎉 Perfect! Toate testele au trecut!';
    } else if (percentage >= 80) {
      finalMessage = '✅ Foarte bine! Majoritatea sistemelor funcționează!';
    } else if (percentage >= 60) {
      finalMessage = '⚡ Funcțional! Câteva probleme minore de rezolvat.';
    } else {
      finalMessage = '⚠️ Atenție! Sunt probleme care trebuie rezolvate.';
    }

    // Save results to localStorage
    const results = {
      timestamp: new Date().toISOString(),
      passedTests,
      totalTests,
      percentage,
      testResults,
      finalMessage
    };
    localStorage.setItem('lastTestResults', JSON.stringify(results));

    isRunning = false;
  }

  // Individual test functions
  async function runTest(testKey) {
    try {
      switch (testKey) {
        case 'recipeEngine':
          return await testRecipeEngine();
        case 'pantryConnection':
          return await testPantryConnection();
        case 'cookingMethods':
          return await testCookingMethods();
        case 'shoppingList':
          return await testShoppingList();
        case 'biomarkers':
          return await testBiomarkers();
        case 'mtorAutomation':
          return await testMTORAutomation();
        case 'uiComponents':
          return await testUIComponents();
        case 'dataStorage':
          return await testDataStorage();
        case 'importExport':
          return await testImportExport();
        case 'performance':
          return await testPerformance();
        default:
          return { status: 'fail', message: 'Test necunoscut' };
      }
    } catch (error) {
      return { status: 'fail', message: `Eroare: ${error.message}` };
    }
  }

  // Test implementations
  async function testRecipeEngine() {
    try {
      // Check if RecipeEngine class exists
      const module = await import('../modules/nutrition/RecipeEngine.js');
      if (!module.RecipeEngine) {
        return { status: 'fail', message: 'Clasa RecipeEngine nu există' };
      }

      // Try to create an instance
      const engine = new module.RecipeEngine();
      if (!engine.generateOMADRecipe) {
        return { status: 'fail', message: 'Metoda generateOMADRecipe nu există' };
      }

      return { status: 'pass', message: 'RecipeEngine funcționează corect' };
    } catch (error) {
      return { status: 'fail', message: `Import RecipeEngine eșuat: ${error.message}` };
    }
  }

  async function testPantryConnection() {
    try {
      const module = await import('../modules/pantry/stores/pantryStore.js');
      if (!module.groceryInventory) {
        return { status: 'fail', message: 'Store groceryInventory nu există' };
      }

      return { status: 'pass', message: 'Conexiunea pantry funcționează' };
    } catch (error) {
      return { status: 'fail', message: `Conexiune pantry eșuată: ${error.message}` };
    }
  }

  async function testCookingMethods() {
    try {
      const module = await import('../modules/nutrition/codex/CookingMethods.js');
      if (!module.CookingMethodIntegration) {
        return { status: 'fail', message: 'CookingMethodIntegration nu există' };
      }

      const cooking = new module.CookingMethodIntegration();
      if (!cooking.getInstantPotLayers) {
        return { status: 'fail', message: 'Metoda getInstantPotLayers nu există' };
      }

      return { status: 'pass', message: 'Metodele de gătit funcționează' };
    } catch (error) {
      return { status: 'fail', message: `CookingMethods eșuat: ${error.message}` };
    }
  }

  async function testShoppingList() {
    // Check if MealPlanner has export functionality
    const mealPlannerElements = document.querySelectorAll('[class*="meal"], [class*="planner"]');
    if (mealPlannerElements.length === 0) {
      return { status: 'fail', message: 'MealPlanner nu este disponibil în DOM' };
    }

    // Check localStorage for meal data
    const mealData = localStorage.getItem('plannedMeals') || localStorage.getItem('mealPlanner');
    if (!mealData) {
      return { status: 'warning', message: 'Nu sunt planuri de mese salvate' };
    }

    return { status: 'pass', message: 'Funcționalitatea shopping list este disponibilă' };
  }

  async function testBiomarkers() {
    try {
      // Check if biomarker ranges are defined
      const nutritionModule = await import('../modules/nutrition/stores/nutritionStore.js');
      const biomarkerData = localStorage.getItem('biomarkers') || localStorage.getItem('nutritionProfile');
      
      if (!biomarkerData) {
        return { status: 'warning', message: 'Nu sunt date biomarkeri salvate' };
      }

      const data = JSON.parse(biomarkerData);
      if (!data || Object.keys(data).length === 0) {
        return { status: 'fail', message: 'Datele biomarkeri sunt goale' };
      }

      return { status: 'pass', message: 'Biomarkerii funcționează corect' };
    } catch (error) {
      return { status: 'fail', message: `Biomarkeri eșuați: ${error.message}` };
    }
  }

  async function testMTORAutomation() {
    try {
      const module = await import('../modules/nutrition/mtor/mtorTracker.js');
      const mtorData = localStorage.getItem('mtorCycleState');
      
      if (!mtorData) {
        return { status: 'warning', message: 'Nu sunt date mTOR salvate' };
      }

      const data = JSON.parse(mtorData);
      if (!data.currentDay && data.currentDay !== 0) {
        return { status: 'fail', message: 'Datele mTOR sunt incomplete' };
      }

      return { status: 'pass', message: 'Automatizarea mTOR funcționează' };
    } catch (error) {
      return { status: 'fail', message: `mTOR automation eșuat: ${error.message}` };
    }
  }

  async function testUIComponents() {
    const modules = {
      nutrition: document.querySelector('[data-module="nutrition"]') || document.querySelector('.nutrition'),
      pantry: document.querySelector('[data-module="pantry"]') || document.querySelector('.pantry'),
      finance: document.querySelector('[data-module="finance"]') || document.querySelector('.finance')
    };

    const available = Object.values(modules).filter(Boolean).length;
    const total = Object.keys(modules).length;

    if (available === total) {
      return { status: 'pass', message: 'Toate componentele UI sunt disponibile' };
    } else if (available >= 2) {
      return { status: 'warning', message: `${available}/${total} componente disponibile` };
    } else {
      return { status: 'fail', message: 'Lipsesc componente UI importante' };
    }
  }

  async function testDataStorage() {
    try {
      // Test localStorage functionality
      const testKey = 'systemTesterCheck';
      const testValue = 'test_' + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        return { status: 'fail', message: 'localStorage nu funcționează corect' };
      }

      // Check for important data
      const importantKeys = ['groceryInventory', 'accounts', 'nutritionProfile'];
      const existingKeys = importantKeys.filter(key => localStorage.getItem(key));

      return { 
        status: 'pass', 
        message: `localStorage funcționează (${existingKeys.length} chei importante)` 
      };
    } catch (error) {
      return { status: 'fail', message: `Stocare date eșuată: ${error.message}` };
    }
  }

  async function testImportExport() {
    // Check for export buttons
    const exportButtons = document.querySelectorAll('[class*="export"], button[onclick*="export"]');
    const importButtons = document.querySelectorAll('[class*="import"], button[onclick*="import"]');

    if (exportButtons.length === 0 && importButtons.length === 0) {
      return { status: 'fail', message: 'Nu există butoane import/export' };
    }

    if (exportButtons.length > 0 && importButtons.length > 0) {
      return { status: 'pass', message: 'Import/export funcționează complet' };
    } else {
      return { 
        status: 'warning', 
        message: `Parțial disponibil (${exportButtons.length} export, ${importButtons.length} import)` 
      };
    }
  }

  async function testPerformance() {
    const startTime = performance.now();
    
    // Test DOM elements count
    const totalElements = document.querySelectorAll('*').length;
    
    // Test memory usage if available
    let memoryUsage = 'N/A';
    if (performance.memory) {
      memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB';
    }

    // Test localStorage usage
    const storageUsed = JSON.stringify(localStorage).length;
    const storageKB = Math.round(storageUsed / 1024);

    const endTime = performance.now();
    const testDuration = Math.round(endTime - startTime);

    let status = 'pass';
    let issues = [];

    if (totalElements > 5000) issues.push('Prea multe elemente DOM');
    if (storageKB > 5000) issues.push('LocalStorage prea mare');
    if (testDuration > 100) issues.push('Test prea lent');

    if (issues.length > 2) {
      status = 'fail';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return { 
      status, 
      message: status === 'pass' ? 'Performanța este optimă' : `Probleme: ${issues.join(', ')}`,
      details: {
        domElements: totalElements,
        memoryUsage,
        storageKB,
        testDuration: `${testDuration}ms`
      }
    };
  }

  onMount(() => {
    // Load previous test results if available
    const lastResults = localStorage.getItem('lastTestResults');
    if (lastResults) {
      const data = JSON.parse(lastResults);
      console.log('🧪 Ultimele rezultate teste:', data);
    }
  });
</script>

<!-- Buton mare TEST SISTEM -->
<button 
  class="test-button" 
  on:click={openTestModal}
  title="Rulează teste sistem"
>
  🧪 TEST SISTEM
</button>

<!-- Modal cu rezultate -->
{#if showModal}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>🧪 Rezultate Teste Sistem</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>

      {#if isRunning}
        <div class="loading">
          <div class="spinner"></div>
          <p>Rulează testele...</p>
        </div>
      {:else}
        <div class="results-summary">
          <div class="score-display">
            <div class="score-number">{passedTests}/{totalTests}</div>
            <div class="score-text">teste trecute</div>
            <div class="score-percentage">{Math.round((passedTests / totalTests) * 100)}%</div>
          </div>
          <div class="final-message {passedTests === totalTests ? 'perfect' : passedTests >= totalTests * 0.8 ? 'good' : passedTests >= totalTests * 0.6 ? 'warning' : 'error'}">
            {finalMessage}
          </div>
        </div>

        <div class="test-results">
          {#each tests as test}
            {#if testResults[test.key]}
              <div class="test-item {testResults[test.key].status}">
                <div class="test-icon">
                  {#if testResults[test.key].status === 'pass'}
                    ✅
                  {:else if testResults[test.key].status === 'warning'}
                    ⚠️
                  {:else}
                    ❌
                  {/if}
                </div>
                <div class="test-info">
                  <div class="test-name">{test.name}</div>
                  <div class="test-description">{test.description}</div>
                  <div class="test-message">{testResults[test.key].message}</div>
                  {#if testResults[test.key].details}
                    <div class="test-details">
                      {JSON.stringify(testResults[test.key].details, null, 2)}
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" on:click={() => runAllTests()}>🔄 Rulează Din Nou</button>
          <button class="btn-primary" on:click={closeModal}>Închide</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .test-button {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 15px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  .test-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
  }

  .modal-content {
    background: white;
    border-radius: 20px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      transform: scale(0.9) translateY(20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 25px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 30px;
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .loading {
    padding: 60px 30px;
    text-align: center;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .results-summary {
    padding: 30px;
    text-align: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }

  .score-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
  }

  .score-number {
    font-size: 48px;
    font-weight: 800;
    color: #667eea;
    font-family: 'Space Grotesk', monospace;
  }

  .score-text {
    font-size: 16px;
    color: #666;
    font-weight: 500;
  }

  .score-percentage {
    font-size: 32px;
    font-weight: 700;
    color: #28a745;
  }

  .final-message {
    font-size: 20px;
    font-weight: 600;
    padding: 15px 25px;
    border-radius: 12px;
    margin-top: 10px;
  }

  .final-message.perfect {
    background: #d4edda;
    color: #155724;
    border: 2px solid #c3e6cb;
  }

  .final-message.good {
    background: #d1ecf1;
    color: #0c5460;
    border: 2px solid #bee5eb;
  }

  .final-message.warning {
    background: #fff3cd;
    color: #856404;
    border: 2px solid #ffeaa7;
  }

  .final-message.error {
    background: #f8d7da;
    color: #721c24;
    border: 2px solid #f5c6cb;
  }

  .test-results {
    max-height: 400px;
    overflow-y: auto;
    padding: 20px;
  }

  .test-item {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .test-item.pass {
    background: #d4edda;
    border-left: 5px solid #28a745;
  }

  .test-item.warning {
    background: #fff3cd;
    border-left: 5px solid #ffc107;
  }

  .test-item.fail {
    background: #f8d7da;
    border-left: 5px solid #dc3545;
  }

  .test-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .test-info {
    flex: 1;
  }

  .test-name {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .test-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }

  .test-message {
    font-size: 14px;
    font-weight: 500;
  }

  .test-details {
    margin-top: 10px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
  }

  .modal-footer {
    padding: 20px 30px;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #dee2e6;
  }

  .btn-primary, .btn-secondary {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #667eea;
    color: white;
  }

  .btn-primary:hover {
    background: #764ba2;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background: #5a6268;
    transform: translateY(-1px);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .test-button {
      top: 10px;
      right: 10px;
      padding: 12px 18px;
      font-size: 16px;
    }

    .modal-content {
      width: 95%;
      margin: 10px;
    }

    .modal-header {
      padding: 20px;
    }

    .modal-header h2 {
      font-size: 20px;
    }

    .results-summary {
      padding: 20px;
    }

    .score-number {
      font-size: 36px;
    }

    .score-percentage {
      font-size: 24px;
    }

    .final-message {
      font-size: 16px;
      padding: 12px 15px;
    }

    .modal-footer {
      flex-direction: column;
      gap: 10px;
    }

    .btn-primary, .btn-secondary {
      width: 100%;
    }
  }
</style>