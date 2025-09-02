<!-- UnifiedDashboard.svelte - CODEX N-OMAD Ecosystem Overview -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Import ecosystem stores
  import { unifiedMetrics, ecosystemData } from '../shared/stores/ecosystemStore.js';
  import { currentRecommendations, cycleProgress } from '../modules/nutrition/mtor/mtorTracker.js';
  import { currentWeekProgress, antiInflammatoryScore } from '../modules/nutrition/plants/plantDiversityTracker.js';
  import { accounts, transactions } from '../modules/finance/stores/financeStore.js';
  
  // Local state
  let refreshInterval;
  let isLoading = false;
  
  // Computed metrics
  $: totalBalance = $accounts.reduce((sum, acc) => sum + acc.balance, 0);
  $: monthlyFoodExpenses = $transactions
    .filter(t => 
      t.type === 'expense' && 
      t.category === 'Alimente' && 
      t.date && 
      t.date.startsWith(new Date().toISOString().slice(0, 7))
    )
    .reduce((sum, t) => sum + t.amount, 0);
  
  $: budgetUtilization = $unifiedMetrics.monthlyFoodBudget > 0 
    ? (monthlyFoodExpenses / $unifiedMetrics.monthlyFoodBudget) * 100 
    : 0;
    
  // Health score calculation
  $: overallHealthScore = calculateOverallHealthScore(
    $unifiedMetrics.codexScore,
    $unifiedMetrics.plantDiversityScore,
    $antiInflammatoryScore.score,
    $currentWeekProgress.progressPercentage
  );
  
  function calculateOverallHealthScore(codex, plants, antiInflam, progress) {
    const weights = {
      codex: 0.3,
      plants: 0.25,
      antiInflam: 0.25,
      progress: 0.2
    };
    
    return Math.round(
      (codex * weights.codex) + 
      (plants * weights.plants) + 
      (antiInflam * weights.antiInflam) + 
      (progress * weights.progress)
    );
  }
  
  function getHealthScoreColor(score) {
    if (score >= 90) return '#10b981'; // emerald-500
    if (score >= 80) return '#3b82f6'; // blue-500
    if (score >= 70) return '#f59e0b'; // amber-500
    if (score >= 60) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  }
  
  function getHealthScoreGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    return 'C';
  }
  
  function getBudgetStatus(utilization) {
    if (utilization <= 70) return { status: 'excellent', color: '#10b981', icon: '✅' };
    if (utilization <= 85) return { status: 'good', color: '#3b82f6', icon: '👍' };
    if (utilization <= 95) return { status: 'warning', color: '#f59e0b', icon: '⚠️' };
    return { status: 'critical', color: '#ef4444', icon: '🚨' };
  }
  
  function getMTORPhaseIcon(phase) {
    switch (phase) {
      case 'growth': return '💪';
      case 'maintenance': return '⚖️';
      case 'autophagy': return '🧹';
      default: return '🔄';
    }
  }
  
  async function refreshData() {
    isLoading = true;
    
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    isLoading = false;
  }
  
  onMount(() => {
    // Refresh data every 5 minutes
    refreshInterval = setInterval(refreshData, 5 * 60 * 1000);
  });
  
  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
</script>

<div class="unified-dashboard">
  <!-- Header with overall health score -->
  <div class="dashboard-header" in:fly={{ y: -50, duration: 800, easing: quintOut }}>
    <div class="health-score-display">
      <div class="score-circle" style="--score-color: {getHealthScoreColor(overallHealthScore)}">
        <span class="score-value">{overallHealthScore}</span>
        <span class="score-grade">{getHealthScoreGrade(overallHealthScore)}</span>
      </div>
      <div class="score-info">
        <h1>🏆 CODEX N-OMAD Score</h1>
        <p>Overall Health & Optimization</p>
        <button class="refresh-btn" on:click={refreshData} disabled={isLoading}>
          <span class="refresh-icon" class:spinning={isLoading}>🔄</span>
          Refresh
        </button>
      </div>
    </div>
  </div>

  <!-- Main metrics grid -->
  <div class="metrics-grid">
    
    <!-- Financial Health -->
    <div class="metric-card financial" in:scale={{ duration: 600, delay: 100 }}>
      <div class="card-header">
        <h3>💰 Financial Health</h3>
        <span class="status-badge" style="--badge-color: {getBudgetStatus(budgetUtilization).color}">
          {getBudgetStatus(budgetUtilization).icon} {getBudgetStatus(budgetUtilization).status.toUpperCase()}
        </span>
      </div>
      
      <div class="card-content">
        <div class="primary-metric">
          <span class="value">{totalBalance.toLocaleString('ro-RO')} RON</span>
          <span class="label">Total Balance</span>
        </div>
        
        <div class="secondary-metrics">
          <div class="metric-item">
            <span class="metric-value">{monthlyFoodExpenses.toLocaleString('ro-RO')} RON</span>
            <span class="metric-label">Food Spent This Month</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{budgetUtilization.toFixed(1)}%</span>
            <span class="metric-label">Budget Utilization</span>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: {Math.min(budgetUtilization, 100)}%; background: {getBudgetStatus(budgetUtilization).color}"></div>
        </div>
      </div>
    </div>

    <!-- mTOR Cycle Status -->
    <div class="metric-card mtor" in:scale={{ duration: 600, delay: 200 }}>
      <div class="card-header">
        <h3>{getMTORPhaseIcon($currentRecommendations.phase)} mTOR Cycle</h3>
        <span class="phase-badge">{$currentRecommendations.phase.toUpperCase()}</span>
      </div>
      
      <div class="card-content">
        <div class="primary-metric">
          <span class="value">Day {$currentRecommendations.dayInPhase}/7</span>
          <span class="label">{$currentRecommendations.phase} Phase</span>
        </div>
        
        <div class="secondary-metrics">
          <div class="metric-item">
            <span class="metric-value">{$currentRecommendations.proteinTarget.min}-{$currentRecommendations.proteinTarget.max}g</span>
            <span class="metric-label">Protein Target</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{$currentRecommendations.fastingWindow.recommended || $currentRecommendations.fastingWindow.max}h</span>
            <span class="metric-label">Fasting Window</span>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: {($currentRecommendations.dayInPhase / 7) * 100}%; background: var(--gradient-primary)"></div>
        </div>
        
        <div class="next-phase">
          <span>Next: {$currentRecommendations.nextPhase} in {7 - $currentRecommendations.dayInPhase} days</span>
        </div>
      </div>
    </div>

    <!-- Plant Diversity -->
    <div class="metric-card plants" in:scale={{ duration: 600, delay: 300 }}>
      <div class="card-header">
        <h3>🌱 Plant Diversity</h3>
        <span class="progress-badge" class:complete={$currentWeekProgress.isComplete}>
          {$currentWeekProgress.consumedCount}/{$currentWeekProgress.goal}
        </span>
      </div>
      
      <div class="card-content">
        <div class="primary-metric">
          <span class="value">{$currentWeekProgress.consumedCount}</span>
          <span class="label">Species This Week</span>
        </div>
        
        <div class="secondary-metrics">
          <div class="metric-item">
            <span class="metric-value">{$currentWeekProgress.progressPercentage.toFixed(1)}%</span>
            <span class="metric-label">Weekly Progress</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{$antiInflammatoryScore.score}/100</span>
            <span class="metric-label">Anti-inflammatory Score</span>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" 
               style="width: {Math.min($currentWeekProgress.progressPercentage, 100)}%; 
                      background: var(--gradient-cool)"></div>
        </div>
        
        {#if $currentWeekProgress.remaining > 0}
          <div class="remaining">
            <span>{$currentWeekProgress.remaining} more species needed</span>
          </div>
        {:else}
          <div class="achievement">
            <span>🎉 Weekly goal achieved!</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- CODEX Compliance -->
    <div class="metric-card codex" in:scale={{ duration: 600, delay: 400 }}>
      <div class="card-header">
        <h3>📋 CODEX Compliance</h3>
        <span class="score-badge" style="--score-color: {getHealthScoreColor($unifiedMetrics.codexScore)}">
          {$unifiedMetrics.codexScore}/100
        </span>
      </div>
      
      <div class="card-content">
        <div class="primary-metric">
          <span class="value">{getHealthScoreGrade($unifiedMetrics.codexScore)}</span>
          <span class="label">Current Grade</span>
        </div>
        
        <div class="secondary-metrics">
          <div class="metric-item">
            <span class="metric-value">{$ecosystemData.receiptAnalysis.length}</span>
            <span class="metric-label">Recent Meals Analyzed</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{$antiInflammatoryScore.antiInflammatoryPlants}</span>
            <span class="metric-label">Anti-inflammatory Foods</span>
          </div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" 
               style="width: {$unifiedMetrics.codexScore}%; 
                      background: {getHealthScoreColor($unifiedMetrics.codexScore)}"></div>
        </div>
      </div>
    </div>

    <!-- Inventory Status -->
    <div class="metric-card inventory" in:scale={{ duration: 600, delay: 500 }}>
      <div class="card-header">
        <h3>📦 Smart Inventory</h3>
        <span class="alert-badge" class:urgent={$unifiedMetrics.expiringItems > 5}>
          {$unifiedMetrics.expiringItems > 0 ? `⚠️ ${$unifiedMetrics.expiringItems}` : '✅ All Good'}
        </span>
      </div>
      
      <div class="card-content">
        <div class="primary-metric">
          <span class="value">{$ecosystemData.inventory.length}</span>
          <span class="label">Items in Stock</span>
        </div>
        
        <div class="secondary-metrics">
          <div class="metric-item">
            <span class="metric-value">{$unifiedMetrics.inventoryValue.toLocaleString('ro-RO')} RON</span>
            <span class="metric-label">Inventory Value</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{$unifiedMetrics.expiringItems}</span>
            <span class="metric-label">Expiring Soon</span>
          </div>
        </div>
        
        <div class="inventory-health">
          <div class="health-indicator" class:warning={$unifiedMetrics.expiringItems > 3}>
            <span>{$unifiedMetrics.expiringItems === 0 ? 'Optimal' : `${$unifiedMetrics.expiringItems} items need attention`}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="metric-card actions" in:scale={{ duration: 600, delay: 600 }}>
      <div class="card-header">
        <h3>⚡ Quick Actions</h3>
      </div>
      
      <div class="card-content">
        <div class="action-grid">
          <button class="action-btn scan">
            <span class="action-icon">📄</span>
            <span class="action-label">Scan Receipt</span>
          </button>
          
          <button class="action-btn recipe">
            <span class="action-icon">👨‍🍳</span>
            <span class="action-label">CODEX Recipe</span>
          </button>
          
          <button class="action-btn shopping">
            <span class="action-icon">🛒</span>
            <span class="action-label">Smart Shopping</span>
          </button>
          
          <button class="action-btn cycle">
            <span class="action-icon">🔄</span>
            <span class="action-label">Advance mTOR</span>
          </button>
        </div>
      </div>
    </div>

  </div>

  <!-- Integration Status -->
  <div class="integration-status" in:fade={{ duration: 800, delay: 700 }}>
    <h4>🔗 Cross-Module Integration</h4>
    <div class="integration-items">
      <div class="integration-item active">
        <span class="dot"></span>
        <span>Receipt → Finance + Inventory</span>
        <span class="timestamp">{$ecosystemData.lastSync.finance || 'Never'}</span>
      </div>
      <div class="integration-item active">
        <span class="dot"></span>
        <span>CODEX → Shopping List</span>
        <span class="timestamp">Live</span>
      </div>
      <div class="integration-item active">
        <span class="dot"></span>
        <span>Plants → Anti-inflammatory Score</span>
        <span class="timestamp">Real-time</span>
      </div>
      <div class="integration-item active">
        <span class="dot"></span>
        <span>mTOR → Nutrition Recommendations</span>
        <span class="timestamp">Daily</span>
      </div>
    </div>
  </div>
</div>

<style>
  .unified-dashboard {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
    font-family: var(--font-primary, 'Inter', sans-serif);
  }

  /* Header */
  .dashboard-header {
    background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
    border-radius: var(--radius-2xl, 24px);
    padding: 30px;
    margin-bottom: 30px;
    color: white;
    box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.1));
  }

  .health-score-display {
    display: flex;
    align-items: center;
    gap: 30px;
  }

  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--score-color);
    position: relative;
  }

  .score-value {
    font-size: 2.5rem;
    font-weight: 900;
    font-family: var(--font-monospace, 'SF Mono', monospace);
  }

  .score-grade {
    font-size: 1rem;
    font-weight: 600;
    margin-top: -5px;
  }

  .score-info h1 {
    margin: 0 0 10px 0;
    font-size: 2.2rem;
    font-weight: 800;
    font-family: var(--font-secondary, 'Space Grotesk', sans-serif);
  }

  .score-info p {
    margin: 0 0 15px 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }

  .refresh-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 16px;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: all var(--transition-normal, 0.3s);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .refresh-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .metric-card {
    background: white;
    border-radius: var(--radius-xl, 16px);
    padding: 24px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.1));
    border-left: 4px solid var(--gradient-primary);
    transition: all var(--transition-normal, 0.3s);
  }

  .metric-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.15));
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card-header h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1f2937;
  }

  .status-badge, .phase-badge, .progress-badge, .score-badge, .alert-badge {
    padding: 4px 12px;
    border-radius: var(--radius-md, 8px);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge {
    background: var(--badge-color);
    color: white;
  }

  .phase-badge {
    background: var(--gradient-secondary, linear-gradient(135deg, #f093fb 0%, #f5576c 100%));
    color: white;
  }

  .progress-badge {
    background: #e5e7eb;
    color: #374151;
  }

  .progress-badge.complete {
    background: var(--gradient-success, linear-gradient(135deg, #4facfe 0%, #00f2fe 100%));
    color: white;
  }

  .score-badge {
    background: var(--score-color);
    color: white;
  }

  .alert-badge {
    background: #f3f4f6;
    color: #374151;
  }

  .alert-badge.urgent {
    background: #fee2e2;
    color: #dc2626;
  }

  /* Card Content */
  .primary-metric {
    text-align: center;
    margin-bottom: 20px;
  }

  .primary-metric .value {
    display: block;
    font-size: 2.5rem;
    font-weight: 900;
    font-family: var(--font-monospace, 'SF Mono', monospace);
    color: #1f2937;
    line-height: 1;
  }

  .primary-metric .label {
    display: block;
    font-size: 0.9rem;
    color: #6b7280;
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .secondary-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .metric-item {
    text-align: center;
  }

  .metric-value {
    display: block;
    font-size: 1.3rem;
    font-weight: 700;
    color: #374151;
  }

  .metric-label {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 2px;
  }

  /* Progress Bars */
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 15px;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: all var(--transition-slow, 0.6s);
  }

  /* Additional Elements */
  .next-phase, .remaining, .achievement {
    text-align: center;
    font-size: 0.85rem;
    color: #6b7280;
    font-style: italic;
  }

  .achievement {
    color: #059669;
    font-weight: 600;
  }

  .health-indicator, .inventory-health {
    text-align: center;
    padding: 10px;
    border-radius: var(--radius-md, 8px);
    background: #f0fdf4;
    color: #166534;
    font-size: 0.85rem;
  }

  .health-indicator.warning, .inventory-health.warning {
    background: #fef3c7;
    color: #92400e;
  }

  /* Quick Actions */
  .action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: var(--radius-md, 8px);
    cursor: pointer;
    transition: all var(--transition-normal, 0.3s);
  }

  .action-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    transform: translateY(-2px);
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .action-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
  }

  /* Integration Status */
  .integration-status {
    background: white;
    border-radius: var(--radius-xl, 16px);
    padding: 24px;
    box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.05));
  }

  .integration-status h4 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .integration-items {
    display: grid;
    gap: 12px;
  }

  .integration-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f9fafb;
    border-radius: var(--radius-md, 8px);
  }

  .integration-item.active .dot {
    background: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    transition: all var(--transition-normal, 0.3s);
  }

  .timestamp {
    margin-left: auto;
    font-size: 0.8rem;
    color: #6b7280;
  }

  /* Dark mode support */
  :global(html.dark) .metric-card,
  :global(html.dark) .integration-status {
    background: var(--bg-secondary, #2d2d2d);
    color: var(--text-primary, #e0e0e0);
  }

  :global(html.dark) .card-header h3 {
    color: var(--text-primary, #e0e0e0);
  }

  :global(html.dark) .primary-metric .value {
    color: var(--text-primary, #e0e0e0);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .unified-dashboard {
      padding: 15px;
    }
    
    .metrics-grid {
      grid-template-columns: 1fr;
    }
    
    .health-score-display {
      flex-direction: column;
      text-align: center;
      gap: 20px;
    }
    
    .secondary-metrics {
      grid-template-columns: 1fr;
    }
  }
</style>