<!-- src/modules/nutrition/components/AnalyticsDashboard.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { analyticsEngine } from '../analytics/AnalyticsEngine.js';

  // State variables
  let loading = true;
  let activeTab = 'overview';
  let selectedPeriod = 30;
  let exportFormat = 'json';

  // Data containers
  let summary = null;
  let costAnalysis = null;
  let deficiencies = null;
  let shoppingPatterns = null;
  let comparisons = null;
  let recommendations = [];
  let achievements = [];

  // Chart data
  let chartData = {
    costPerNutrient: null,
    deficiencyTrends: null,
    shoppingFrequency: null,
    monthlyComparison: null
  };

  // Auto-refresh
  let refreshInterval;

  onMount(async () => {
    await loadAnalytics();

    // Auto-refresh every 5 minutes
    refreshInterval = setInterval(loadAnalytics, 5 * 60 * 1000);
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  async function loadAnalytics() {
    loading = true;

    try {
      // Load all analytics data
      [summary, costAnalysis, deficiencies, shoppingPatterns, comparisons, recommendations, achievements] =
        await Promise.all([
          analyticsEngine.generateExecutiveSummary(selectedPeriod),
          analyticsEngine.analyzeCostPerNutrient(selectedPeriod),
          analyticsEngine.analyzeDeficiencyTrends(),
          analyticsEngine.analyzeShoppingPatterns(),
          analyticsEngine.generateComparisons('monthly'),
          analyticsEngine.generateRecommendations(),
          analyticsEngine.calculateAchievements()
        ]);

      // Prepare chart data
      prepareChartData();

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      loading = false;
    }
  }

  function prepareChartData() {
    // Cost per nutrient chart
    if (costAnalysis) {
      chartData.costPerNutrient = {
        labels: Object.keys(costAnalysis.metrics),
        datasets: [{
          label: 'Cost per gram (RON)',
          data: Object.values(costAnalysis.metrics).map(m =>
            m.total > 0 ? (m.cost / m.total).toFixed(2) : 0
          ),
          backgroundColor: [
            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'
          ]
        }]
      };
    }

    // Deficiency trends
    if (deficiencies) {
      chartData.deficiencyTrends = {
        labels: deficiencies.deficiencies.map(d => d.nutrient),
        datasets: [{
          label: 'Severity Score',
          data: deficiencies.deficiencies.map(d => {
            switch(d.severity) {
              case 'severe': return 3;
              case 'moderate': return 2;
              case 'mild': return 1;
              default: return 0;
            }
          }),
          backgroundColor: deficiencies.deficiencies.map(d => {
            switch(d.severity) {
              case 'severe': return '#ff4444';
              case 'moderate': return '#ffaa00';
              case 'mild': return '#ffdd00';
              default: return '#44ff44';
            }
          })
        }]
      };
    }

    // Shopping frequency
    if (shoppingPatterns && shoppingPatterns.preferences) {
      chartData.shoppingFrequency = {
        labels: shoppingPatterns.preferences.slice(0, 10).map(p => p.name),
        datasets: [{
          label: 'Purchase Frequency (%)',
          data: shoppingPatterns.preferences.slice(0, 10).map(p => p.percentage),
          backgroundColor: '#667eea'
        }]
      };
    }

    // Monthly comparison
    if (comparisons) {
      chartData.monthlyComparison = {
        labels: comparisons.charts.cost.map(c => c.label),
        datasets: [
          {
            label: 'Total Cost (RON)',
            data: comparisons.charts.cost.map(c => c.value),
            borderColor: '#ff6384',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'CODEX Score',
            data: comparisons.charts.nutrition.map(c => c.score),
            borderColor: '#36a2eb',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      };
    }
  }

  async function exportReport() {
    try {
      const report = await analyticsEngine.generateReport(exportFormat, selectedPeriod);

      // Create download
      const blob = new Blob([report], {
        type: exportFormat === 'json' ? 'application/json' : 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nomad-analytics-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
    }
  }

  function getProgressColor(value, max) {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#ef4444';
    return '#6b7280';
  }

  function getTrendIcon(trend) {
    if (trend > 0.1) return '📈';
    if (trend < -0.1) return '📉';
    return '➡️';
  }

  function getSeverityBadge(severity) {
    const badges = {
      severe: { color: 'bg-red-500', text: 'Sever' },
      moderate: { color: 'bg-orange-500', text: 'Moderat' },
      mild: { color: 'bg-yellow-500', text: 'Ușor' },
      normal: { color: 'bg-green-500', text: 'Normal' }
    };

    return badges[severity] || badges.normal;
  }
</script>

<div class="analytics-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <h1 class="text-2xl font-bold flex items-center gap-2">
      📊 Analytics Dashboard
      {#if loading}
        <span class="loading-spinner" in:fade></span>
      {/if}
    </h1>

    <div class="controls flex gap-4">
      <!-- Period Selector -->
      <select
        bind:value={selectedPeriod}
        on:change={loadAnalytics}
        class="period-select"
      >
        <option value={7}>Ultima săptămână</option>
        <option value={30}>Ultima lună</option>
        <option value={90}>Ultimele 3 luni</option>
        <option value={365}>Ultimul an</option>
      </select>

      <!-- Export Button -->
      <div class="export-controls flex gap-2">
        <select bind:value={exportFormat} class="format-select">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="markdown">Markdown</option>
          <option value="pdf">PDF</option>
        </select>

        <button
          on:click={exportReport}
          class="export-btn"
          disabled={loading}
        >
          📥 Export Report
        </button>
      </div>

      <!-- Refresh Button -->
      <button
        on:click={loadAnalytics}
        class="refresh-btn"
        disabled={loading}
      >
        🔄 Refresh
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'overview'}
      on:click={() => activeTab = 'overview'}
    >
      📈 Overview
    </button>
    <button
      class="tab"
      class:active={activeTab === 'costs'}
      on:click={() => activeTab = 'costs'}
    >
      💰 Cost Analysis
    </button>
    <button
      class="tab"
      class:active={activeTab === 'nutrition'}
      on:click={() => activeTab = 'nutrition'}
    >
      🥗 Nutrition Trends
    </button>
    <button
      class="tab"
      class:active={activeTab === 'shopping'}
      on:click={() => activeTab = 'shopping'}
    >
      🛒 Shopping Patterns
    </button>
    <button
      class="tab"
      class:active={activeTab === 'insights'}
      on:click={() => activeTab = 'insights'}
    >
      💡 Insights & Recommendations
    </button>
  </div>

  <!-- Content -->
  <div class="tab-content">
    {#if loading}
      <div class="loading-state" in:fade>
        <div class="spinner"></div>
        <p>Analizez datele tale...</p>
      </div>
    {:else}
      <!-- Overview Tab -->
      {#if activeTab === 'overview'}
        <div class="overview-content" in:fly={{ y: 20, duration: 300 }}>
          {#if summary}
            <!-- Key Metrics Cards -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Mese</div>
                <div class="metric-value">{summary.totalMeals}</div>
                <div class="metric-trend">În ultimele {selectedPeriod} zile</div>
              </div>

              <div class="metric-card">
                <div class="metric-label">Cost Mediu/Zi</div>
                <div class="metric-value">{summary.avgDailyCost} RON</div>
                <div class="metric-trend">
                  {#if summary.avgDailyCost < 80}
                    <span class="text-green-500">✓ Sub țintă</span>
                  {:else}
                    <span class="text-orange-500">↑ Peste țintă</span>
                  {/if}
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-label">Proteine Medii</div>
                <div class="metric-value">{summary.avgProtein}g</div>
                <div class="metric-progress">
                  <div
                    class="progress-bar"
                    style="width: {Math.min(summary.avgProtein, 150)}%; background: {getProgressColor(summary.avgProtein, 100)}"
                  ></div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-label">Scor CODEX</div>
                <div class="metric-value">{summary.codexScore}/100</div>
                <div class="metric-progress">
                  <div
                    class="progress-bar"
                    style="width: {summary.codexScore}%; background: {getProgressColor(summary.codexScore, 100)}"
                  ></div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-label">Diversitate Plante</div>
                <div class="metric-value">{summary.plantDiversity}</div>
                <div class="metric-trend">
                  {#if summary.plantDiversity >= 30}
                    <span class="text-green-500">🌿 Excelent!</span>
                  {:else}
                    <span class="text-orange-500">Țintă: 30+</span>
                  {/if}
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-label">Trend General</div>
                <div class="metric-value">
                  {#if summary.trend === 'significant_improvement'}
                    📈 Îmbunătățire semnificativă
                  {:else if summary.trend === 'improving'}
                    ↗️ În creștere
                  {:else if summary.trend === 'stable'}
                    ➡️ Stabil
                  {:else if summary.trend === 'declining'}
                    ↘️ În scădere
                  {:else}
                    ⏳ Date insuficiente
                  {/if}
                </div>
              </div>
            </div>

            <!-- Achievements -->
            {#if achievements.length > 0}
              <div class="achievements-section">
                <h3 class="section-title">🏆 Achievements</h3>
                <div class="achievements-grid">
                  {#each achievements as achievement}
                    <div class="achievement-card" in:scale>
                      <div class="achievement-icon">{achievement.icon}</div>
                      <div class="achievement-content">
                        <div class="achievement-title">{achievement.title}</div>
                        <div class="achievement-desc">{achievement.description}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/if}
        </div>
      {/if}

      <!-- Other tabs content here - simplified for brevity -->
      {#if activeTab === 'costs'}
        <div class="costs-content" in:fly={{ y: 20, duration: 300 }}>
          <h3>Cost Analysis</h3>
          <p>Cost analysis details would appear here</p>
        </div>
      {/if}

      {#if activeTab === 'nutrition'}
        <div class="nutrition-content" in:fly={{ y: 20, duration: 300 }}>
          <h3>Nutrition Trends</h3>
          <p>Nutrition trends would appear here</p>
        </div>
      {/if}

      {#if activeTab === 'shopping'}
        <div class="shopping-content" in:fly={{ y: 20, duration: 300 }}>
          <h3>Shopping Patterns</h3>
          <p>Shopping patterns would appear here</p>
        </div>
      {/if}

      {#if activeTab === 'insights'}
        <div class="insights-content" in:fly={{ y: 20, duration: 300 }}>
          <h3>Insights & Recommendations</h3>
          {#if recommendations.length > 0}
            <div class="recommendations-grid">
              {#each recommendations as rec}
                <div class="recommendation-card priority-{rec.priority}">
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .analytics-dashboard {
    padding: 1.5rem;
    background: white;
    border-radius: 0.5rem;
    min-height: 600px;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .loading-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #6366f1;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .period-select,
  .format-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
  }

  .export-btn,
  .refresh-btn {
    padding: 0.5rem 1rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .export-btn:hover,
  .refresh-btn:hover {
    background: #4f46e5;
  }

  .export-btn:disabled,
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .tab {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #6366f1;
  }

  .tab.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 0;
  }

  .spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .metric-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
  }

  .metric-trend {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  .metric-progress {
    margin-top: 0.5rem;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    transition: all 0.5s ease;
  }

  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #111827;
  }

  .achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .achievement-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.5rem;
  }

  .achievement-icon {
    font-size: 2rem;
  }

  .achievement-title {
    font-weight: 600;
  }

  .achievement-desc {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .recommendations-grid {
    display: grid;
    gap: 1rem;
  }

  .recommendation-card {
    padding: 1rem;
    border-left: 4px solid;
    border-radius: 0.5rem;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .recommendation-card.priority-critical {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .recommendation-card.priority-high {
    border-color: #f97316;
    background: #fff7ed;
  }

  .recommendation-card.priority-medium {
    border-color: #eab308;
    background: #fefce8;
  }

  .recommendation-card.priority-low {
    border-color: #10b981;
    background: #f0fdf4;
  }
</style>