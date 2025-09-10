<!-- src/components/MLDashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { mlEngine } from '../lib/ml/MLEngine.js';
  
  let metrics = {
    patternsLearned: 0,
    merchantsKnown: 0,
    averageAccuracy: 0,
    modelVersion: 'N/A',
    totalTransactions: 0,
    modelsCount: 0,
    dbSize: '0 MB'
  };
  
  let isTraining = false;
  let trainingProgress = 0;
  let modelDetails = [];
  let recentActivity = [];
  let showAdvancedMetrics = false;
  
  onMount(async () => {
    try {
      await mlEngine.initialize();
      await loadMetrics();
      loadRecentActivity();
      
      // Actualizare automată la 30 de secunde
      setInterval(loadMetrics, 30000);
    } catch (error) {
      console.error('Eroare la inițializarea ML Dashboard:', error);
    }
  });
  
  async function loadMetrics() {
    try {
      // Obține metrici de la ML Engine
      metrics.patternsLearned = await mlEngine.getPatternCount();
      metrics.merchantsKnown = await mlEngine.getMerchantCount();
      metrics.averageAccuracy = await mlEngine.getAverageAccuracy();
      metrics.modelVersion = await mlEngine.getModelVersion();
      metrics.totalTransactions = await mlEngine.getTotalProcessedTransactions();
      metrics.modelsCount = await mlEngine.getModelsCount();
      metrics.dbSize = await mlEngine.getDatabaseSize();
      
      // Actualizează detaliile modelelor
      modelDetails = await mlEngine.getModelDetails();
    } catch (error) {
      console.warn('Eroare la încărcarea metricilor ML:', error);
    }
  }
  
  async function loadRecentActivity() {
    try {
      recentActivity = await mlEngine.getRecentActivity(10);
    } catch (error) {
      console.warn('Eroare la încărcarea activității recente:', error);
    }
  }
  
  async function trainNewPattern() {
    isTraining = true;
    trainingProgress = 0;
    
    try {
      // Simulează training cu progres real
      const interval = setInterval(() => {
        trainingProgress += Math.random() * 10;
        if (trainingProgress >= 100) {
          clearInterval(interval);
          trainingProgress = 100;
          isTraining = false;
          loadMetrics(); // Reîmprospătează metricile
        }
      }, 200);
      
      // Antrenare reală de pattern-uri
      await mlEngine.retrainModels();
      
    } catch (error) {
      console.error('Eroare la antrenarea pattern-urilor:', error);
      isTraining = false;
    }
  }
  
  async function exportMLData() {
    try {
      const data = await mlEngine.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ml-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Eroare la exportul datelor ML:', error);
    }
  }
  
  async function clearMLData() {
    if (confirm('Sigur vrei să ștergi toate datele ML? Această acțiune nu poate fi anulată.')) {
      try {
        await mlEngine.clearAllData();
        await loadMetrics();
        loadRecentActivity();
        alert('Datele ML au fost șterse cu succes.');
      } catch (error) {
        console.error('Eroare la ștergerea datelor ML:', error);
      }
    }
  }
  
  function getAccuracyColor(accuracy) {
    if (accuracy >= 0.9) return '#10b981';
    if (accuracy >= 0.7) return '#f59e0b';
    return '#ef4444';
  }
  
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('ro-RO');
  }
</script>

<div class="ml-dashboard">
  <div class="dashboard-header">
    <h2>🤖 Machine Learning Dashboard</h2>
    <div class="dashboard-actions">
      <button class="btn-secondary" on:click={() => showAdvancedMetrics = !showAdvancedMetrics}>
        {showAdvancedMetrics ? '📊 Simplu' : '🔬 Avansat'}
      </button>
      <button class="btn-primary" on:click={trainNewPattern} disabled={isTraining}>
        {isTraining ? '🔄 Training...' : '🧠 Antrenează'}
      </button>
    </div>
  </div>
  
  <div class="metrics-grid">
    <div class="metric-card primary">
      <div class="metric-icon">🧠</div>
      <div class="metric-content">
        <span class="metric-value">{metrics.patternsLearned}</span>
        <span class="metric-label">Pattern-uri învățate</span>
      </div>
    </div>
    
    <div class="metric-card secondary">
      <div class="metric-icon">👤</div>
      <div class="metric-content">
        <span class="metric-value">{metrics.merchantsKnown}</span>
        <span class="metric-label">Comercianți recunoscuți</span>
      </div>
    </div>
    
    <div class="metric-card success">
      <div class="metric-icon">🎯</div>
      <div class="metric-content">
        <span class="metric-value" style="color: {getAccuracyColor(metrics.averageAccuracy)}">
          {(metrics.averageAccuracy * 100).toFixed(1)}%
        </span>
        <span class="metric-label">Acuratețe medie</span>
      </div>
    </div>
    
    <div class="metric-card info">
      <div class="metric-icon">🏷️</div>
      <div class="metric-content">
        <span class="metric-value">{metrics.modelVersion}</span>
        <span class="metric-label">Versiune model</span>
      </div>
    </div>
    
    {#if showAdvancedMetrics}
      <div class="metric-card warning">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <span class="metric-value">{metrics.totalTransactions}</span>
          <span class="metric-label">Total tranzacții</span>
        </div>
      </div>
      
      <div class="metric-card info">
        <div class="metric-icon">⚡</div>
        <div class="metric-content">
          <span class="metric-value">{metrics.modelsCount}</span>
          <span class="metric-label">Modele active</span>
        </div>
      </div>
      
      <div class="metric-card secondary">
        <div class="metric-icon">💾</div>
        <div class="metric-content">
          <span class="metric-value">{metrics.dbSize}</span>
          <span class="metric-label">Dimensiune BD</span>
        </div>
      </div>
    {/if}
  </div>
  
  {#if isTraining}
    <div class="training-section">
      <div class="training-header">
        <h3>🔄 Antrenare în curs...</h3>
        <span class="training-percentage">{Math.round(trainingProgress)}%</span>
      </div>
      <div class="training-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {trainingProgress}%"></div>
        </div>
        <span class="training-status">Actualizare modele neural networks...</span>
      </div>
    </div>
  {/if}
  
  {#if showAdvancedMetrics}
    <div class="advanced-section">
      <div class="section-row">
        <!-- Model Details -->
        <div class="section-card">
          <h3>🔧 Detalii Modele</h3>
          <div class="model-list">
            {#each modelDetails as model}
              <div class="model-item">
                <div class="model-info">
                  <span class="model-name">{model.name}</span>
                  <span class="model-accuracy" style="color: {getAccuracyColor(model.accuracy)}">
                    {(model.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div class="model-meta">
                  <span class="model-size">{model.size}</span>
                  <span class="model-updated">Updated: {formatDate(model.lastUpdated)}</span>
                </div>
              </div>
            {/each}
            
            {#if modelDetails.length === 0}
              <div class="empty-state">Nu sunt modele disponibile</div>
            {/if}
          </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="section-card">
          <h3>📊 Activitate Recentă</h3>
          <div class="activity-list">
            {#each recentActivity as activity}
              <div class="activity-item">
                <div class="activity-time">{formatDate(activity.timestamp)}</div>
                <div class="activity-description">{activity.description}</div>
                {#if activity.accuracy}
                  <div class="activity-accuracy" style="color: {getAccuracyColor(activity.accuracy)}">
                    {(activity.accuracy * 100).toFixed(1)}%
                  </div>
                {/if}
              </div>
            {/each}
            
            {#if recentActivity.length === 0}
              <div class="empty-state">Nu există activitate recentă</div>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Advanced Controls -->
      <div class="controls-section">
        <h3>🛠️ Controluri Avansate</h3>
        <div class="controls-grid">
          <button class="btn-export" on:click={exportMLData}>
            📥 Export Date ML
          </button>
          <button class="btn-danger" on:click={clearMLData}>
            🗑️ Șterge Date ML
          </button>
          <button class="btn-info" on:click={loadMetrics}>
            🔄 Actualizează Metrici
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .ml-dashboard {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .dashboard-header h2 {
    margin: 0;
    color: #1f2937;
    font-size: 28px;
  }
  
  .dashboard-actions {
    display: flex;
    gap: 12px;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .metric-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-left: 4px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
  
  .metric-card.primary { border-left-color: #3b82f6; }
  .metric-card.secondary { border-left-color: #6b7280; }
  .metric-card.success { border-left-color: #10b981; }
  .metric-card.info { border-left-color: #06b6d4; }
  .metric-card.warning { border-left-color: #f59e0b; }
  
  .metric-icon {
    font-size: 24px;
    background: #f3f4f6;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .metric-content {
    flex: 1;
  }
  
  .metric-value {
    display: block;
    font-size: 24px;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 4px;
  }
  
  .metric-label {
    color: #6b7280;
    font-size: 14px;
  }
  
  .training-section {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 32px;
  }
  
  .training-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .training-header h3 {
    margin: 0;
    color: #ea580c;
  }
  
  .training-percentage {
    font-weight: bold;
    color: #ea580c;
    font-size: 18px;
  }
  
  .progress-bar {
    background: #fed7aa;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    background: #ea580c;
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .training-status {
    color: #9a3412;
    font-size: 14px;
  }
  
  .advanced-section {
    margin-top: 32px;
  }
  
  .section-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .section-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .section-card h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
  }
  
  .model-item, .activity-item {
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  
  .model-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  
  .model-name {
    font-weight: 600;
    color: #1f2937;
  }
  
  .model-accuracy {
    font-weight: bold;
  }
  
  .model-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #6b7280;
  }
  
  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }
  
  .activity-time {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }
  
  .activity-description {
    flex: 1;
    font-size: 14px;
  }
  
  .activity-accuracy {
    font-weight: bold;
    white-space: nowrap;
  }
  
  .controls-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .controls-section h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
  }
  
  .controls-grid {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .empty-state {
    text-align: center;
    color: #9ca3af;
    padding: 20px;
    font-style: italic;
  }
  
  /* Button Styles */
  .btn-primary, .btn-secondary, .btn-export, .btn-danger, .btn-info {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #1f2937;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-export {
    background: #10b981;
    color: white;
  }
  
  .btn-export:hover {
    background: #059669;
  }
  
  .btn-danger {
    background: #ef4444;
    color: white;
  }
  
  .btn-danger:hover {
    background: #dc2626;
  }
  
  .btn-info {
    background: #06b6d4;
    color: white;
  }
  
  .btn-info:hover {
    background: #0891b2;
  }
  
  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .section-row {
      grid-template-columns: 1fr;
    }
    
    .controls-grid {
      flex-direction: column;
    }
    
    .activity-item {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>