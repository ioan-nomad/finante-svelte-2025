<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { transactions, accounts, totalBalance } from '../modules/finance/stores/financeStore.js';
  import ExportPanel from '../modules/finance/components/ExportPanel.svelte';
  import ExcelExportButton from './ExcelExportButton.svelte';
  
  let chartInstances = {};
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
  
  // Create all charts
  function createCharts() {
    console.log('🎨 createCharts() called');
    console.log('Chart available?', typeof Chart !== 'undefined');
    
    // Destroy existing charts
    console.log('🗑️ Destroying existing charts:', Object.keys(chartInstances));
    Object.values(chartInstances).forEach(chart => chart?.destroy());
    
    // 1. Expenses by Category (Pie Chart)
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    console.log('📊 Category chart element found?', !!categoryCtx);
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
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#9ca3af', font: { size: 11 } }
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
              tension: 0.4
            },
            {
              label: 'Cheltuieli',
              data: expenseData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4
            },
            {
              label: 'Economii',
              data: savingsData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#9ca3af', font: { size: 11 } }
            }
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
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#9ca3af', font: { size: 11 } }
              }
            }
          }
        });
      }
    }
  }
  
  onMount(async () => {
    console.log('🎯 Dashboard mounting...');
    console.log('Chart.js available?', typeof Chart !== 'undefined');
    console.log('Transactions store:', $transactions.length, 'transactions');
    console.log('Accounts store:', $accounts.length, 'accounts');
    
    // Forțează încărcarea Chart.js
    if (typeof Chart === 'undefined') {
      console.log('⏳ Loading Chart.js...');
      try {
        const ChartModule = await import('chart.js/auto');
        window.Chart = ChartModule.default || ChartModule.Chart;
        console.log('✅ Chart.js loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load Chart.js:', error);
      }
    }
    
    // Calculează statistici
    calculateStats();
    console.log('📊 Stats calculated:', stats);
    
    // Delay pentru DOM
    setTimeout(() => {
      console.log('📊 Creating charts...');
      createCharts();
      console.log('Chart instances:', Object.keys(chartInstances));
    }, 500);
  });
  
  // Reactive updates
  $: if ($transactions) {
    calculateStats();
    if (typeof window !== 'undefined') {
      setTimeout(createCharts, 100);
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
      <div class="stat-percent">0% față de luna trecută</div>
    </div>
    
    <div class="stat-card expense-card">
      <div class="stat-label">Cheltuieli (luna curentă)</div>
      <div class="stat-value expense">{stats.expenses.toFixed(2)}</div>
      <div class="stat-percent">0% față de luna trecută</div>
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
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }
  
  :global(.dark-mode) .chart-container {
    background: #2d3748;
    border-color: #4a5568;
  }
  
  .chart-container h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  :global(.dark-mode) .chart-container h3 {
    color: #e2e8f0;
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