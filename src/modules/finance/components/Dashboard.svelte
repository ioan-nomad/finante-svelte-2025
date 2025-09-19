<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { transactions, accounts, totalBalance } from '../stores/financeStore.js';
  import ExportPanel from './ExportPanel.svelte';
  import ExcelExportButton from '../../../components/ExcelExportButton.svelte';
  import { mlPredictor } from '../../../lib/ml-predictor.js';

  let chartInstances = {};
  let chartUpdateTimeout;
  let chartsInitialized = false;
  let unsubscribeStores = [];
  let stats = {
    income: 0,
    expenses: 0,
    savings: 0,
    percentSaved: 0
  };

  // ML Predictions
  let mlInitialized = false;
  let predictions = {
    nextMonthExpenses: null,
    insights: [],
    anomalies: []
  };
  let budgets = [];

  // Calculate statistics
  function calculateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    $transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.type === 'income') {
          monthlyIncome += Math.abs(tx.amount);
        } else if (tx.type === 'expense') {
          monthlyExpenses += Math.abs(tx.amount);
        }
      }
    });

    stats.income = monthlyIncome;
    stats.expenses = monthlyExpenses;
    stats.savings = monthlyIncome - monthlyExpenses;
    stats.percentSaved = monthlyIncome > 0 ? Math.round((stats.savings / monthlyIncome) * 100) : 0;
  }

  // Initialize ML Predictor
  async function initializeMLPredictor() {
    try {
      console.log('🧠 Initializing ML Predictor...');

      // Load budgets from localStorage
      budgets = JSON.parse(localStorage.getItem('budgets') || '[]');

      // Try to load existing models first
      const modelsLoaded = mlPredictor.loadModels();

      if (!modelsLoaded || $transactions.length > 50) {
        // Initialize with current transaction data
        const success = await mlPredictor.initialize($transactions, budgets);
        if (success) {
          // Save the trained models
          mlPredictor.saveModels();
        }
      }

      mlInitialized = true;
      await updateMLPredictions();

    } catch (error) {
      console.error('❌ ML Predictor initialization failed:', error);
    }
  }

  // Update ML predictions
  async function updateMLPredictions() {
    if (!mlInitialized) return;

    try {
      // Get next month expense predictions
      predictions.nextMonthExpenses = mlPredictor.predictNextMonthExpenses();

      // Get insights and recommendations
      predictions.insights = mlPredictor.getInsights($transactions, budgets);

      // Check recent transactions for anomalies
      predictions.anomalies = $transactions
        .slice(-10)
        .map(tx => {
          const anomaly = mlPredictor.detectAnomaly(tx);
          return { transaction: tx, anomaly };
        })
        .filter(item => item.anomaly.isAnomaly);

      console.log('🔮 ML Predictions updated:', predictions);

    } catch (error) {
      console.error('❌ ML Predictions update failed:', error);
    }
  }

  // Destroy all existing charts properly
  function destroyAllCharts() {
    Object.values(chartInstances).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          // Clear any animations
          if (chart.options && chart.options.animation) {
            chart.options.animation = false;
          }
          // Stop any ongoing animations
          if (typeof chart.stop === 'function') {
            chart.stop();
          }
          // Destroy the chart instance
          chart.destroy();
        } catch (error) {
          console.error('Error destroying chart:', error);
        }
      }
    });
    chartInstances = {};

    // Force garbage collection hint (if available)
    if (typeof window !== 'undefined' && window.gc) {
      try {
        window.gc();
      } catch (e) {
        // gc() not available, ignore
      }
    }
  }

  // Chart default options to prevent memory leaks
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    elements: {
      arc: { borderWidth: 0 },
      point: { radius: 3 },
      line: { borderWidth: 2 }
    },
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: { size: 11 },
          usePointStyle: true
        }
      }
    },
    onHover: null, // Disable hover effects to reduce memory usage
    events: ['click'] // Reduce events to essential ones only
  };

  // Create all charts with error handling
  function createCharts() {
    // Prevent multiple simultaneous calls
    if (!chartsInitialized || !document.getElementById('categoryChart')) {
      console.log('Charts not ready to initialize');
      return;
    }

    console.log('🎨 Creating charts');

    // Destroy existing charts first
    destroyAllCharts();

    try {
      // 1. Expenses by Category (Pie Chart)
      const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
      if (categoryCtx) {
        const categoryData = {};
        $transactions.filter(t => t.type === 'expense').forEach(t => {
          categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

        chartInstances.category = new Chart(categoryCtx, {
          type: 'doughnut',
          data: {
            labels: Object.keys(categoryData).slice(0, 6),
            datasets: [{
              data: Object.values(categoryData).slice(0, 6),
              backgroundColor: [
                '#3b82f6', '#10b981', '#f59e0b',
                '#ef4444', '#8b5cf6', '#ec4899'
              ]
            }]
          },
          options: {
            ...chartDefaults,
            plugins: {
              ...chartDefaults.plugins,
              legend: {
                ...chartDefaults.plugins.legend,
                position: 'bottom'
              }
            }
          }
        });
      }

      // 2. Monthly Trend (Line Chart)
      const trendCtx = document.getElementById('trendChart')?.getContext('2d');
      if (trendCtx) {
        const last6Months = [];
        const incomeData = [];
        const expenseData = [];
        const savingsData = [];

        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const month = date.toLocaleDateString('ro-RO', { month: 'short' });
          last6Months.push(month);

          // Calculate for each month
          let monthIncome = 0;
          let monthExpense = 0;

          $transactions.forEach(t => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear()) {
              if (t.type === 'income') monthIncome += t.amount;
              else if (t.type === 'expense') monthExpense += t.amount;
            }
          });

          incomeData.push(monthIncome);
          expenseData.push(monthExpense);
          savingsData.push(monthIncome - monthExpense);
        }

        chartInstances.trend = new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: last6Months,
            datasets: [
              {
                label: 'Venituri',
                data: incomeData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                pointHoverRadius: 0 // Disable hover effects
              },
              {
                label: 'Cheltuieli',
                data: expenseData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                pointHoverRadius: 0
              },
              {
                label: 'Economii',
                data: savingsData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointHoverRadius: 0
              }
            ]
          },
          options: {
            ...chartDefaults,
            scales: {
              y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(156, 163, 175, 0.1)' }
              },
              x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(156, 163, 175, 0.1)' }
              }
            }
          }
        });
      }

      // 3. Top 5 Categories (Bar Chart)
      const topCtx = document.getElementById('topCategoriesChart')?.getContext('2d');
      if (topCtx) {
        const categoryTotals = {};
        $transactions.filter(t => t.type === 'expense').forEach(t => {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const sorted = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        chartInstances.topCategories = new Chart(topCtx, {
          type: 'bar',
          data: {
            labels: sorted.map(([cat]) => cat),
            datasets: [{
              label: 'Cheltuieli',
              data: sorted.map(([, amount]) => amount),
              backgroundColor: '#8b5cf6'
            }]
          },
          options: {
            ...chartDefaults,
            plugins: {
              ...chartDefaults.plugins,
              legend: { display: false }
            },
            scales: {
              y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(156, 163, 175, 0.1)' }
              },
              x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(156, 163, 175, 0.1)' }
              }
            }
          }
        });
      }

      // 4. Account Distribution (Pie Chart)
      const accountCtx = document.getElementById('accountChart')?.getContext('2d');
      if (accountCtx) {
        const accountBalances = $accounts.map(acc => ({
          name: acc.name,
          balance: acc.balance
        })).filter(acc => acc.balance > 0);

        if (accountBalances.length > 0) {
          chartInstances.accounts = new Chart(accountCtx, {
            type: 'pie',
            data: {
              labels: accountBalances.map(a => a.name),
              datasets: [{
                data: accountBalances.map(a => a.balance),
                backgroundColor: [
                  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                ]
              }]
            },
            options: {
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                legend: {
                  ...chartDefaults.plugins.legend,
                  position: 'bottom'
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  }

  // Enhanced debounced chart update to prevent excessive redraws
  function updateChartsDebounced() {
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (chartsInitialized && typeof window !== 'undefined') {
        // Check if DOM elements still exist
        const chartsExist = ['categoryChart', 'trendChart', 'topCategoriesChart', 'accountChart']
          .every(id => document.getElementById(id));

        if (chartsExist) {
          createCharts();
        } else {
          console.warn('Chart elements not found, skipping chart update');
        }
      }
    }, 500); // Increased debounce time to 500ms for better performance
  }

  onMount(async () => {
    console.log('🎯 Dashboard mounting...');

    // Calculate initial statistics
    calculateStats();

    // Initialize ML Predictor
    await initializeMLPredictor();

    // Initialize charts after DOM is ready with intersection observer for performance
    const initializeChartsWhenVisible = () => {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !chartsInitialized) {
              chartsInitialized = true;
              requestAnimationFrame(() => createCharts());
              observer.disconnect();
            }
          });
        }, { threshold: 0.1 });

        const dashboardElement = document.querySelector('.dashboard');
        if (dashboardElement) {
          observer.observe(dashboardElement);
          // Store observer for cleanup
          unsubscribeStores.push(() => observer.disconnect());
        } else {
          // Fallback if observer fails
          requestAnimationFrame(() => {
            chartsInitialized = true;
            createCharts();
          });
        }
      } else {
        // Fallback for browsers without IntersectionObserver
        requestAnimationFrame(() => {
          chartsInitialized = true;
          createCharts();
        });
      }
    };

    // Initialize charts
    initializeChartsWhenVisible();
  });

  onDestroy(() => {
    console.log('🧹 Dashboard cleanup starting...');

    // Clear all timeouts
    clearTimeout(chartUpdateTimeout);

    // Unsubscribe from all store subscriptions and observers
    unsubscribeStores.forEach(unsub => {
      try {
        if (typeof unsub === 'function') {
          unsub();
        }
      } catch (error) {
        console.warn('Error during store cleanup:', error);
      }
    });
    unsubscribeStores = [];

    // Destroy all charts with proper cleanup
    destroyAllCharts();

    // Reset flags
    chartsInitialized = false;

    console.log('✅ Dashboard cleanup completed');
  });

  // Reactive updates with enhanced debouncing and memory management
  let lastTransactionLength = 0;
  let lastAccountLength = 0;

  $: {
    // Only update if data actually changed (not just store reference)
    const currentTransactionLength = $transactions?.length || 0;
    const currentAccountLength = $accounts?.length || 0;

    if (currentTransactionLength !== lastTransactionLength ||
        currentAccountLength !== lastAccountLength) {

      lastTransactionLength = currentTransactionLength;
      lastAccountLength = currentAccountLength;

      calculateStats();

      // Update ML predictions when data changes
      if (mlInitialized) {
        updateMLPredictions();
      }

      if (typeof window !== 'undefined' && chartsInitialized) {
        updateChartsDebounced();
      }
    }
  }
</script>

<div class="dashboard">
  <div class="dashboard-header">
    <h1 class="dashboard-title">📊 Dashboard Financiar</h1>
    <div class="export-buttons">
      <ExportPanel />
      <ExcelExportButton module="finance" variant="button" />
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card income-card">
      <div class="stat-label">Venituri (luna curentă)</div>
      <div class="stat-value income">{stats.income.toFixed(2)} RON</div>
      <div class="stat-percent">+0% față de luna trecută</div>
    </div>

    <div class="stat-card expense-card">
      <div class="stat-label">Cheltuieli (luna curentă)</div>
      <div class="stat-value expense">{stats.expenses.toFixed(2)} RON</div>
      <div class="stat-percent">+0% față de luna trecută</div>
    </div>

    <div class="stat-card savings-card">
      <div class="stat-label">Economii (luna curentă)</div>
      <div class="stat-value savings">{stats.savings.toFixed(2)} RON</div>
      <div class="stat-percent">{stats.percentSaved}% din venituri</div>
    </div>

    {#if predictions.nextMonthExpenses}
      <div class="stat-card prediction-card">
        <div class="stat-label">🔮 Predicție Luna Viitoare</div>
        <div class="stat-value prediction">
          {Object.values(predictions.nextMonthExpenses).reduce((a, b) => a + b, 0).toLocaleString()} RON
        </div>
        <div class="stat-percent">Bazat pe AI</div>
      </div>
    {/if}
  </div>

  <!-- ML Insights Section -->
  {#if mlInitialized && (predictions.insights.length > 0 || predictions.anomalies.length > 0)}
    <div class="ml-insights-section">
      <h2 class="insights-title">🧠 AI Insights & Predicții</h2>

      <div class="insights-grid">
        <!-- Predictions -->
        {#if predictions.nextMonthExpenses}
          <div class="insight-card prediction-insight">
            <h3>🔮 Predicții Cheltuieli Luna Viitoare</h3>
            <div class="prediction-details">
              {#each Object.entries(predictions.nextMonthExpenses) as [category, amount]}
                {#if amount > 0}
                  <div class="prediction-item">
                    <span class="category">{category}</span>
                    <span class="amount">{amount.toLocaleString()} RON</span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <!-- Insights -->
        {#each predictions.insights as insight}
          <div class="insight-card {insight.type}-insight">
            <h3>{insight.title}</h3>
            <p>{insight.message}</p>
            {#if insight.details && insight.type === 'warning'}
              <div class="warning-details">
                <span class="risk-level">Risc: {insight.details.risk}</span>
                <span class="probability">Probabilitate: {insight.details.probability}%</span>
              </div>
            {/if}
          </div>
        {/each}

        <!-- Anomalies -->
        {#if predictions.anomalies.length > 0}
          <div class="insight-card anomaly-insight">
            <h3>⚠️ Tranzacții Neobișnuite Detectate</h3>
            <div class="anomaly-list">
              {#each predictions.anomalies as item}
                <div class="anomaly-item">
                  <span class="transaction-desc">{item.transaction.description}</span>
                  <span class="transaction-amount">{Math.abs(item.transaction.amount).toFixed(2)} RON</span>
                  <span class="confidence-badge {item.anomaly.severity}">
                    {Math.round(item.anomaly.confidence * 100)}% anomalie
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Charts Grid -->
  <div class="charts-grid">
    <div class="chart-container" id="categoryChartContainer">
      <h3>Cheltuieli pe Categorii (Luna Curentă)</h3>
      <div class="chart-wrapper">
        <canvas id="categoryChart"></canvas>
      </div>
    </div>

    <div class="chart-container" id="trendChartContainer">
      <h3>Trend Lunar (Ultimele 6 Luni)</h3>
      <div class="chart-wrapper">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <div class="chart-container" id="topCategoriesChartContainer">
      <h3>Top 5 Categorii Cheltuieli</h3>
      <div class="chart-wrapper">
        <canvas id="topCategoriesChart"></canvas>
      </div>
    </div>

    <div class="chart-container" id="accountChartContainer">
      <h3>Distribuție Conturi</h3>
      <div class="chart-wrapper">
        <canvas id="accountChart"></canvas>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Dashboard Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .dashboard-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    flex: 1;
    color: var(--text-primary);
  }

  .export-buttons {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px var(--card-shadow);
    border: 1px solid var(--card-border);
  }

  .stat-card.prediction-card {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), var(--card-bg));
    border-left: 4px solid var(--info-color);
  }

  /* Dark mode handled by CSS variables */

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  /* Dark mode handled by CSS variables */

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .stat-value.income { color: var(--success-color); }
  .stat-value.expense { color: var(--error-color); }
  .stat-value.savings { color: var(--accent-color); }
  .stat-value.prediction { color: var(--info-color); }

  .stat-percent {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .chart-container {
    position: relative;
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px var(--card-shadow);
    border: 1px solid var(--card-border);
  }


  .chart-container h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }


  .chart-wrapper {
    height: 250px;
    position: relative;
  }

  /* ML Insights Styles */
  .ml-insights-section {
    margin: 2rem 0;
  }

  .insights-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .insight-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--card-shadow);
    border-left: 4px solid;
  }

  .insight-card.prediction-insight {
    border-left-color: var(--info-color);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), var(--card-bg));
  }

  .insight-card.warning-insight {
    border-left-color: var(--warning-color);
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), var(--card-bg));
  }

  .insight-card.anomaly-insight {
    border-left-color: var(--error-color);
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), var(--card-bg));
  }

  .insight-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .prediction-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .prediction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 6px;
  }

  .prediction-item .category {
    font-weight: 500;
  }

  .prediction-item .amount {
    font-weight: 600;
    color: var(--info-color);
  }

  .warning-details {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .risk-level,
  .probability {
    background: rgba(245, 158, 11, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .anomaly-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .anomaly-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.1);
  }

  .transaction-desc {
    flex: 1;
    font-weight: 500;
  }

  .transaction-amount {
    font-weight: 600;
    margin: 0 1rem;
  }

  .confidence-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }

  .confidence-badge.critical {
    background: #dc2626;
  }

  .confidence-badge.high {
    background: #ea580c;
  }

  .confidence-badge.medium {
    background: #d97706;
  }

  .confidence-badge.low {
    background: #65a30d;
  }

  /* Dark mode handled by CSS variables */

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }

    .anomaly-item {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }

    .transaction-amount {
      margin: 0;
      text-align: center;
    }
  }
</style>