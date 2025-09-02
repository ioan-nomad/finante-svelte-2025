<!-- components/Dashboard.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import Chart from 'chart.js/auto';
  import { 
    transactions, 
    accounts,
    monthStats,
    computeAccountBalance,
    CATEGORY_COLORS,
    fmt,
    currentMonth,
    lastMonth
  } from '../lib/store.js';
  import AdvancedCharts from './AdvancedCharts.svelte';

  let showAdvancedCharts = false;
  
  // Chart instances
  let charts = {};
  
  // Canvas elements
  let pieCanvas, lineCanvas, barCanvas, donutCanvas;
  
  // Reactive data for charts
  $: currentMonthExpenses = getCategoryExpenses($transactions);
  $: last6MonthsData = getLast6MonthsData($transactions);
  $: top5Categories = getTop5Categories(currentMonthExpenses);
  $: accountDistribution = getAccountDistribution($accounts);
  
  function getCategoryExpenses(txs) {
    const current = currentMonth();
    const expenses = txs.filter(t => 
      t.type === 'expense' && 
      t.date && 
      t.date.startsWith(current)
    );
    
    const byCategory = {};
    expenses.forEach(t => {
      const cat = t.category || 'Altele';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    });
    
    return byCategory;
  }
  
  function getLast6MonthsData(txs) {
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const savingsData = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toISOString().slice(0, 7);
      const monthName = d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' });
      months.push(monthName);
      
      const monthTx = txs.filter(t => t.date && t.date.startsWith(month));
      const inc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      incomeData.push(inc);
      expenseData.push(exp);
      savingsData.push(inc - exp);
    }
    
    return { months, incomeData, expenseData, savingsData };
  }
  
  function getTop5Categories(categoryExpenses) {
    return Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }
  
  function getAccountDistribution(accs) {
    return accs
      .filter(a => a.currency === 'RON')
      .map(a => ({
        name: a.name,
        balance: Math.abs(computeAccountBalance(a))
      }));
  }
  
  function drawCharts() {
    // Get dark mode colors
    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#e6e9ff' : '#374151'
    const mutedColor = isDark ? '#9aa3b2' : '#6b7280'
    const gridColor = isDark ? 'rgba(154, 163, 178, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    const borderColor = isDark ? '#1a1a1a' : '#fff'
    
    // Destroy existing charts
    Object.values(charts).forEach(chart => chart?.destroy());
    charts = {};
    
    // 1. Pie chart - expenses by category
    if (pieCanvas && Object.keys(currentMonthExpenses).length > 0) {
      charts.pie = new Chart(pieCanvas, {
        type: 'pie',
        data: {
          labels: Object.keys(currentMonthExpenses),
          datasets: [{
            data: Object.values(currentMonthExpenses),
            backgroundColor: Object.keys(currentMonthExpenses).map(c => CATEGORY_COLORS[c] || '#999'),
            borderWidth: 2,
            borderColor: borderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                color: textColor,
                font: {
                  size: 11,
                  family: 'Inter, ui-sans-serif'
                }
              }
            },
            tooltip: {
              titleColor: textColor,
              bodyColor: textColor,
              backgroundColor: tooltipBg,
              borderColor: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = fmt(context.raw);
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percent = ((context.raw / total) * 100).toFixed(1);
                  return `${label}: ${value} RON (${percent}%)`;
                }
              }
            }
          }
        }
      });
    }
    
    // 2. Line chart - trend last 6 months
    if (lineCanvas) {
      const data = last6MonthsData;
      charts.line = new Chart(lineCanvas, {
        type: 'line',
        data: {
          labels: data.months,
          datasets: [
            {
              label: 'Venituri',
              data: data.incomeData,
              borderColor: '#10b981',
              backgroundColor: '#10b98120',
              tension: 0.3
            },
            {
              label: 'Cheltuieli',
              data: data.expenseData,
              borderColor: '#ef4444',
              backgroundColor: '#ef444420',
              tension: 0.3
            },
            {
              label: 'Economii',
              data: data.savingsData,
              borderColor: '#fbbf24',
              backgroundColor: '#fbbf2420',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                color: textColor,
                font: {
                  size: 11,
                  family: 'Inter, ui-sans-serif'
                }
              }
            },
            tooltip: {
              titleColor: textColor,
              bodyColor: textColor,
              backgroundColor: tooltipBg,
              borderColor: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context) => `${context.dataset.label}: ${fmt(context.raw)} RON`
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: mutedColor
              },
              grid: {
                color: gridColor
              }
            },
            y: { 
              beginAtZero: true,
              ticks: {
                color: mutedColor
              },
              grid: {
                color: gridColor
              }
            }
          }
        }
      });
    }
    
    // 3. Bar chart - top 5 categories
    if (barCanvas && top5Categories.length > 0) {
      charts.bar = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: top5Categories.map(([cat]) => cat),
          datasets: [{
            label: 'Cheltuieli',
            data: top5Categories.map(([, amount]) => amount),
            backgroundColor: top5Categories.map(([cat]) => CATEGORY_COLORS[cat] || '#999')
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              titleColor: textColor,
              bodyColor: textColor,
              backgroundColor: tooltipBg,
              borderColor: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context) => `${fmt(context.raw)} RON`
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: mutedColor
              },
              grid: {
                color: gridColor
              }
            },
            y: { 
              beginAtZero: true,
              ticks: {
                color: mutedColor
              },
              grid: {
                color: gridColor
              }
            }
          }
        }
      });
    }
    
    // 4. Donut chart - account distribution
    if (donutCanvas && accountDistribution.length > 0) {
      const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#f472b6', '#fbbf24', '#a855f7', '#64748b'
      ];
      
      charts.donut = new Chart(donutCanvas, {
        type: 'doughnut',
        data: {
          labels: accountDistribution.map(a => a.name),
          datasets: [{
            data: accountDistribution.map(a => a.balance),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: borderColor
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: {
                color: textColor,
                font: {
                  size: 11,
                  family: 'Inter, ui-sans-serif'
                }
              }
            },
            tooltip: {
              titleColor: textColor,
              bodyColor: textColor,
              backgroundColor: tooltipBg,
              borderColor: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              callbacks: {
                label: (context) => `${context.label}: ${fmt(context.raw)} RON`
              }
            }
          }
        }
      });
    }
  }
  
  // Redraw charts when data changes
  $: if (pieCanvas && lineCanvas && barCanvas && donutCanvas) {
    drawCharts();
  }
  
  onMount(() => {
    // Charts will be drawn when canvases are ready
    
    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      if (Object.keys(charts).length > 0) {
        drawCharts() // Redraw charts with new colors
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Store observer for cleanup
    window._dashboardChartObserver = observer
  });
  
  onDestroy(() => {
    Object.values(charts).forEach(chart => chart?.destroy());
    
    // Clean up observer
    if (window._dashboardChartObserver) {
      window._dashboardChartObserver.disconnect()
      delete window._dashboardChartObserver
    }
  });
</script>

<div class="dashboard">
  <!-- Summary cards -->
  <div class="summary-grid">
    <div class="summary-card income">
      <h3>Venituri (luna curentă)</h3>
      <div class="value">{fmt($monthStats.currentIncome)}</div>
      <div class="percent">
        {$monthStats.incomeChange > 0 ? '+' : ''}{$monthStats.incomeChange}% față de luna trecută
      </div>
    </div>
    
    <div class="summary-card expense">
      <h3>Cheltuieli (luna curentă)</h3>
      <div class="value">{fmt($monthStats.currentExpense)}</div>
      <div class="percent">
        {$monthStats.expenseChange > 0 ? '+' : ''}{$monthStats.expenseChange}% față de luna trecută
      </div>
    </div>
    
    <div class="summary-card savings">
      <h3>Economii (luna curentă)</h3>
      <div class="value">{fmt($monthStats.currentSavings)}</div>
      <div class="percent">{$monthStats.savingsPercent}% din venituri</div>
    </div>
  </div>

  <!-- Charts grid -->
  <div class="charts-grid">
    <div class="chart-card">
      <h2>Cheltuieli pe Categorii (Luna Curentă)</h2>
      <div class="chart-container">
        <canvas bind:this={pieCanvas}></canvas>
      </div>
    </div>
    
    <div class="chart-card">
      <h2>Trend Lunar (Ultimele 6 Luni)</h2>
      <div class="chart-container">
        <canvas bind:this={lineCanvas}></canvas>
      </div>
    </div>
    
    <div class="chart-card">
      <h2>Top 5 Categorii Cheltuieli</h2>
      <div class="chart-container">
        <canvas bind:this={barCanvas}></canvas>
      </div>
    </div>
    
    <div class="chart-card">
      <h2>Distribuție Conturi</h2>
      <div class="chart-container">
        <canvas bind:this={donutCanvas}></canvas>
      </div>
    </div>
  </div>

  <div class="dashboard-controls">
    <button on:click={() => showAdvancedCharts = !showAdvancedCharts}>
      {showAdvancedCharts ? '🔼' : '🔽'} Grafice Avansate
    </button>
  </div>

  {#if showAdvancedCharts}
    <div transition:slide>
      <AdvancedCharts />
    </div>
  {/if}
</div>

<style>
  .dashboard {
    padding: 0;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin: 20px 0;
  }
  
  .summary-card {
    background: linear-gradient(135deg, var(--panel) 0%, var(--panel2) 100%);
    border-radius: 14px;
    padding: 16px;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .summary-card h3 {
    margin: 0 0 8px;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .summary-card .value {
    font-size: 1.8rem;
    font-weight: 900;
    margin-bottom: 8px;
  }
  
  .summary-card .percent {
    font-size: 0.85rem;
    color: var(--muted);
  }
  
  .summary-card.income {
    border-color: var(--ok);
  }
  
  .summary-card.income .value {
    color: var(--ok);
  }
  
  .summary-card.expense {
    border-color: var(--err);
  }
  
  .summary-card.expense .value {
    color: var(--err);
  }
  
  .summary-card.savings {
    border-color: var(--warn);
  }
  
  .summary-card.savings .value {
    color: var(--warn);
  }
  
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .chart-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
  }
  
  .chart-card h2 {
    margin: 0 0 16px;
    color: var(--acc);
    font-size: 1.1rem;
  }
  
  .chart-container {
    height: 300px;
    position: relative;
  }
  
  .dashboard-controls {
    display: flex;
    gap: 10px;
    margin: 20px 0;
    justify-content: center;
  }

  .dashboard-controls button {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .dashboard-controls button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  }

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>