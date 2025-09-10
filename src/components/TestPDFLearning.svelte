<script>
  import { onMount } from 'svelte';
  import pdfLearningEngine from '../services/pdfLearningEngine.js';
  
  let isVisible = false;
  let analytics = null;
  let isLoading = false;
  let selectedBank = '';
  let trainingMode = false;
  let newBankName = '';
  let sampleTransaction = {
    descriere: '',
    suma: '',
    data: '',
    categorie: ''
  };

  // Mock data pentru demonstrație
  let mockTransactions = [
    {
      descriere: "POS KAUFLAND ROMANIA SRL BUCURESTI RRN 123456",
      suma: "45.67",
      data: "15/09/2025",
      categorie: "",
      banca: "BCR"
    },
    {
      descriere: "CARD McDONALDS 1234 BUCURESTI 15/09 12:34",
      suma: "23.50",
      data: "15/09/2025", 
      categorie: "",
      banca: "BRD"
    },
    {
      descriere: "PLATA eMag Marketplace SRL REF 789012",
      suma: "156.99",
      data: "14/09/2025",
      categorie: "",
      banca: "ING"
    }
  ];

  onMount(() => {
    loadAnalytics();
  });

  function showModal() {
    isVisible = true;
    loadAnalytics();
  }

  function hideModal() {
    isVisible = false;
    trainingMode = false;
  }

  async function loadAnalytics() {
    isLoading = true;
    try {
      analytics = pdfLearningEngine.getAnalytics();
    } catch (error) {
      console.error('Error loading analytics:', error);
      analytics = {
        overview: {
          totalImports: 0,
          overallAccuracy: 0,
          merchantsLearned: 0,
          banksSupported: 0,
          feedbackProcessed: 0
        },
        bankAccuracy: {},
        topMerchants: [],
        recentLearnings: []
      };
    }
    isLoading = false;
  }

  function testTransaction(transaction) {
    const prediction = pdfLearningEngine.predictAndEnhance(transaction.banca, transaction);
    
    // Simulez învățarea pentru demonstrație
    const learned = pdfLearningEngine.learnFromTransaction(transaction.banca, {
      ...transaction,
      ...prediction.enhancedTransaction
    });
    
    // Reîncarcă analytics după învățare
    loadAnalytics();
    
    return {
      ...prediction,
      learned
    };
  }

  function resetLearningData() {
    if (confirm('Sigur vrei să resetezi toate datele învățate? Această acțiune nu poate fi anulată.')) {
      pdfLearningEngine.reset();
      loadAnalytics();
      alert('Datele de învățare au fost resetate!');
    }
  }

  function exportLearningData() {
    const data = pdfLearningEngine.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-learning-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function startTraining() {
    trainingMode = true;
  }

  function trainNewPattern() {
    if (!newBankName.trim() || !sampleTransaction.descriere.trim()) {
      alert('Te rog completează numele băncii și descrierea tranzacției!');
      return;
    }

    // Convertește suma la număr
    const transaction = {
      ...sampleTransaction,
      suma: parseFloat(sampleTransaction.suma) || 0
    };

    // Învață pattern-ul nou
    const result = pdfLearningEngine.learnFromTransaction(newBankName, transaction);
    
    if (result.learned) {
      alert(`Pattern învățat cu succes!\nConfidence: ${Math.round(result.confidence * 100)}%\nPattern-uri bancă: ${result.patternsCount}\nComercianti: ${result.merchantsCount}`);
      
      // Reset form
      newBankName = '';
      sampleTransaction = {
        descriere: '',
        suma: '',
        data: '',
        categorie: ''
      };
      
      // Reîncarcă analytics
      loadAnalytics();
    } else {
      alert('Eroare la învățarea pattern-ului!');
    }
  }

  function getAccuracyColor(accuracy) {
    if (accuracy >= 80) return '#10b981'; // verde
    if (accuracy >= 60) return '#f59e0b'; // galben
    return '#ef4444'; // roșu
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('ro-RO');
    } catch {
      return dateStr;
    }
  }

  // Test live cu mock data
  let liveTestResults = {};
  
  function runLiveTest(transaction, index) {
    const result = testTransaction(transaction);
    liveTestResults[index] = result;
    liveTestResults = { ...liveTestResults }; // Trigger reactivity
  }
</script>

<!-- Test Button în pagina principală -->
{#if !isVisible}
  <button class="test-pdf-learning-btn" on:click={showModal}>
    🧠 PDF Learning Test
  </button>
{/if}

<!-- Modal Principal -->
{#if isVisible}
  <div class="modal-overlay" on:click={hideModal}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>🧠 PDF Machine Learning Intelligence</h2>
        <button class="close-btn" on:click={hideModal}>×</button>
      </div>

      <div class="modal-body">
        {#if isLoading}
          <div class="loading">
            <div class="spinner"></div>
            <p>Se încarcă datele de învățare...</p>
          </div>
        {:else if analytics}
          
          <!-- Overview Section -->
          <div class="section overview">
            <h3>📊 Statistici Generale</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">{analytics.overview.totalImports}</div>
                <div class="stat-label">Import-uri procesate</div>
              </div>
              <div class="stat-card">
                <div class="stat-number" style="color: {getAccuracyColor(analytics.overview.overallAccuracy)}">{analytics.overview.overallAccuracy}%</div>
                <div class="stat-label">Accuracy General</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{analytics.overview.merchantsLearned}</div>
                <div class="stat-label">Comercianți învățați</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{analytics.overview.banksSupported}</div>
                <div class="stat-label">Bănci suportate</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{analytics.overview.feedbackProcessed}</div>
                <div class="stat-label">Feedback-uri procesate</div>
              </div>
            </div>
          </div>

          <!-- Bank Accuracy Section -->
          {#if Object.keys(analytics.bankAccuracy).length > 0}
            <div class="section bank-accuracy">
              <h3>🏦 Accuracy pe Bancă</h3>
              <div class="bank-list">
                {#each Object.entries(analytics.bankAccuracy) as [bank, stats]}
                  <div class="bank-item">
                    <div class="bank-name">{bank.toUpperCase()}</div>
                    <div class="bank-stats">
                      <span class="accuracy" style="color: {getAccuracyColor(Math.round(stats.accuracy * 100))}">{Math.round(stats.accuracy * 100)}%</span>
                      <span class="count">({stats.successful}/{stats.total})</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: {stats.accuracy * 100}%; background: {getAccuracyColor(Math.round(stats.accuracy * 100))}"></div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Top Merchants Section -->
          {#if analytics.topMerchants.length > 0}
            <div class="section merchants">
              <h3>🏪 Top Comercianți Recunoscuți</h3>
              <div class="merchants-list">
                {#each analytics.topMerchants.slice(0, 10) as merchant}
                  <div class="merchant-item">
                    <div class="merchant-info">
                      <div class="merchant-name">{merchant.name}</div>
                      <div class="merchant-category">{merchant.category || 'Necategorizat'}</div>
                    </div>
                    <div class="merchant-stats">
                      <span class="confidence" style="color: {getAccuracyColor(merchant.confidence)}">{merchant.confidence}%</span>
                      <span class="occurrences">({merchant.occurrences}×)</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Live Testing Section -->
          <div class="section live-testing">
            <h3>🚀 Test Live cu Date Mock</h3>
            <p class="section-desc">Testează învățarea în timp real cu tranzacții sample:</p>
            <div class="test-transactions">
              {#each mockTransactions as transaction, i}
                <div class="test-transaction">
                  <div class="transaction-info">
                    <div class="transaction-desc">{transaction.descriere}</div>
                    <div class="transaction-details">
                      <span class="amount">{transaction.suma} RON</span>
                      <span class="bank">{transaction.banca}</span>
                      <span class="date">{transaction.data}</span>
                    </div>
                  </div>
                  <button class="test-btn" on:click={() => runLiveTest(transaction, i)}>
                    🧪 Testează
                  </button>
                  
                  {#if liveTestResults[i]}
                    <div class="test-result">
                      <div class="result-header">
                        <span class="confidence" style="color: {getAccuracyColor(Math.round(liveTestResults[i].confidence * 100))}">
                          Confidence: {Math.round(liveTestResults[i].confidence * 100)}%
                        </span>
                        {#if liveTestResults[i].learned.learned}
                          <span class="learned">✅ Învățat</span>
                        {/if}
                      </div>
                      
                      {#if liveTestResults[i].improvements.length > 0}
                        <div class="improvements">
                          <strong>Îmbunătățiri:</strong>
                          {#each liveTestResults[i].improvements as improvement}
                            <div class="improvement">• {improvement}</div>
                          {/each}
                        </div>
                      {/if}
                      
                      {#if liveTestResults[i].merchantData}
                        <div class="merchant-info">
                          <strong>Comerciant:</strong> {liveTestResults[i].merchantData.name}
                          ({liveTestResults[i].merchantData.occurrences} apariții)
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Training Section -->
          <div class="section training">
            <h3>🎓 Antrenare Manuală Pattern Nou</h3>
            {#if !trainingMode}
              <button class="train-btn" on:click={startTraining}>
                📚 Începe Antrenarea
              </button>
            {:else}
              <div class="training-form">
                <div class="form-row">
                  <label>Numele Băncii:</label>
                  <input type="text" bind:value={newBankName} placeholder="ex: Banca Transilvania">
                </div>
                <div class="form-row">
                  <label>Descriere Tranzacție:</label>
                  <input type="text" bind:value={sampleTransaction.descriere} placeholder="ex: POS MEGA IMAGE SRL BUCURESTI">
                </div>
                <div class="form-row">
                  <label>Suma:</label>
                  <input type="number" step="0.01" bind:value={sampleTransaction.suma} placeholder="ex: 25.50">
                </div>
                <div class="form-row">
                  <label>Data:</label>
                  <input type="text" bind:value={sampleTransaction.data} placeholder="ex: 15/09/2025">
                </div>
                <div class="form-row">
                  <label>Categorie:</label>
                  <input type="text" bind:value={sampleTransaction.categorie} placeholder="ex: Alimentar">
                </div>
                <div class="form-actions">
                  <button class="train-submit-btn" on:click={trainNewPattern}>
                    🧠 Învață Pattern
                  </button>
                  <button class="cancel-btn" on:click={() => trainingMode = false}>
                    Anulează
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <!-- Recent Learnings -->
          {#if analytics.recentLearnings.length > 0}
            <div class="section recent">
              <h3>🕒 Învățări Recente</h3>
              <div class="learnings-list">
                {#each analytics.recentLearnings as learning}
                  <div class="learning-item">
                    <div class="learning-date">{formatDate(learning.timestamp)}</div>
                    <div class="learning-desc">{learning.original.descriere}</div>
                    {#if learning.corrected.categorie}
                      <div class="learning-correction">→ {learning.corrected.categorie}</div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Actions -->
          <div class="section actions">
            <h3>🔧 Acțiuni</h3>
            <div class="action-buttons">
              <button class="export-btn" on:click={exportLearningData}>
                📥 Export Date Învățare
              </button>
              <button class="refresh-btn" on:click={loadAnalytics}>
                🔄 Reîmprospătează
              </button>
              <button class="reset-btn" on:click={resetLearningData}>
                🗑️ Reset Date
              </button>
            </div>
          </div>

        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .test-pdf-learning-btn {
    position: fixed;
    top: 120px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 20px;
    border-radius: 15px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
  }

  .test-pdf-learning-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  }

  .modal-content {
    background: #1a1d29;
    border-radius: 20px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .modal-body {
    padding: 0;
    max-height: calc(90vh - 80px);
    overflow-y: auto;
  }

  .section {
    padding: 25px;
    border-bottom: 1px solid #2d3748;
  }

  .section:last-child {
    border-bottom: none;
  }

  .section h3 {
    color: #e2e8f0;
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .section-desc {
    color: #a0aec0;
    margin-bottom: 20px;
    font-size: 14px;
  }

  /* Overview Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }

  .stat-card {
    background: rgba(102, 126, 234, 0.1);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    border: 1px solid rgba(102, 126, 234, 0.2);
  }

  .stat-number {
    font-size: 32px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 8px;
  }

  .stat-label {
    color: #a0aec0;
    font-size: 12px;
    font-weight: 500;
  }

  /* Bank Accuracy */
  .bank-list {
    space-y: 15px;
  }

  .bank-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 10px;
  }

  .bank-name {
    color: #e2e8f0;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .bank-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .accuracy {
    font-weight: 700;
    font-size: 16px;
  }

  .count {
    color: #a0aec0;
    font-size: 12px;
  }

  .progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  /* Merchants */
  .merchants-list {
    space-y: 10px;
  }

  .merchant-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .merchant-info {
    flex: 1;
  }

  .merchant-name {
    color: #e2e8f0;
    font-weight: 500;
    font-size: 14px;
  }

  .merchant-category {
    color: #a0aec0;
    font-size: 12px;
    margin-top: 2px;
  }

  .merchant-stats {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .confidence {
    font-weight: 600;
    font-size: 13px;
  }

  .occurrences {
    color: #a0aec0;
    font-size: 11px;
  }

  /* Live Testing */
  .test-transactions {
    space-y: 15px;
  }

  .test-transaction {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .transaction-info {
    margin-bottom: 12px;
  }

  .transaction-desc {
    color: #e2e8f0;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .transaction-details {
    display: flex;
    gap: 15px;
    font-size: 12px;
  }

  .amount {
    color: #10b981;
    font-weight: 600;
  }

  .bank {
    color: #667eea;
    font-weight: 500;
  }

  .date {
    color: #a0aec0;
  }

  .test-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .test-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .test-result {
    margin-top: 15px;
    padding: 12px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 8px;
    border-left: 3px solid #10b981;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .learned {
    background: #10b981;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
  }

  .improvements {
    margin-bottom: 10px;
  }

  .improvement {
    color: #a0aec0;
    font-size: 12px;
    margin-top: 4px;
  }

  .merchant-info {
    color: #e2e8f0;
    font-size: 12px;
  }

  /* Training Form */
  .training-form {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
  }

  .form-row {
    margin-bottom: 15px;
  }

  .form-row label {
    display: block;
    color: #e2e8f0;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .form-row input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px;
    color: #e2e8f0;
    font-size: 14px;
  }

  .form-row input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }

  .train-btn, .train-submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .train-btn:hover, .train-submit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .cancel-btn {
    background: rgba(255, 255, 255, 0.1);
    color: #a0aec0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  /* Recent Learnings */
  .learnings-list {
    space-y: 10px;
  }

  .learning-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
  }

  .learning-date {
    color: #a0aec0;
    font-size: 11px;
    margin-bottom: 5px;
  }

  .learning-desc {
    color: #e2e8f0;
    font-size: 13px;
    margin-bottom: 3px;
  }

  .learning-correction {
    color: #10b981;
    font-size: 12px;
    font-weight: 500;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .export-btn, .refresh-btn, .reset-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .export-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
  }

  .refresh-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
  }

  .reset-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: none;
  }

  .export-btn:hover, .refresh-btn:hover, .reset-btn:hover {
    transform: translateY(-1px);
  }

  /* Loading */
  .loading {
    text-align: center;
    padding: 40px 20px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(102, 126, 234, 0.3);
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading p {
    color: #a0aec0;
    font-size: 14px;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .test-pdf-learning-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      top: auto;
    }

    .modal-overlay {
      padding: 10px;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .form-actions {
      flex-direction: column;
    }

    .action-buttons {
      flex-direction: column;
    }

    .transaction-details {
      flex-direction: column;
      gap: 5px;
    }
  }
</style>