<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { transactions, accounts, totalBalance } from '../stores/financeStore.js';
  import ExportPanel from './ExportPanel.svelte';
  import ExcelExportButton from '../../../components/ExcelExportButton.svelte';

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
          monthlyIncome += tx.amount;
        } else if (tx.type === 'expense') {
          monthlyExpenses += tx.amount;
        }
      }
    });

    stats.income = monthlyIncome;
    stats.expenses = monthlyExpenses;
    stats.savings = monthlyIncome - monthlyExpenses;
    stats.percentSaved = monthlyIncome > 0 ? Math.round((stats.savings / monthlyIncome) * 100) : 0;
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

  onMount(() => {
    console.log('🎯 Dashboard mounting...');

    // Calculate initial statistics
    calculateStats();

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
      <div class="stat-value income">{stats.income.toFixed(2)}</div>
      <div class="stat-percent">+0% față de luna trecută</div>
    </div>

    <div class="stat-card expense-card">
      <div class="stat-label">Cheltuieli (luna curentă)</div>
      <div class="stat-value expense">{stats.expenses.toFixed(2)}</div>
      <div class="stat-percent">+0% față de luna trecută</div>
    </div>

    <div class="stat-card savings-card">
      <div class="stat-label">Economii (luna curentă)</div>
      <div class="stat-value savings">{stats.savings.toFixed(2)}</div>
      <div class="stat-percent">{stats.percentSaved}% din venituri</div>
    </div>
  </div>

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
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  :global(.dark-mode) .stat-card {
    background: #2d3748;
    border-color: #4a5568;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  :global(.dark-mode) .stat-label {
    color: #a0aec0;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .stat-value.income { color: #10b981; }
  .stat-value.expense { color: #ef4444; }
  .stat-value.savings { color: #3b82f6; }

  .stat-percent {
    font-size: 0.75rem;
    color: #9ca3af;
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
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

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>