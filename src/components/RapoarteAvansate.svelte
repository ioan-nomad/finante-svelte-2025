<script>
  import { onMount, onDestroy } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  let transactions = []
  let accounts = []
  
  // Categorii complete cu culori reprezentative
  const categories = {
    'Alimente': '#10b981',
    'Restaurant/Comenzi': '#f97316', 
    'Transport': '#3b82f6',
    'Consumabile casă': '#84cc16',
    'Facturi': '#f59e0b',
    'Abonamente': '#a855f7',
    'Achiziții diverse': '#06b6d4',
    'Concediu/Vacanță': '#ec4899',
    'Investiții': '#eab308',
    'Economii': '#22c55e',
    'Zile naștere': '#f43f5e',
    'Asigurări': '#6366f1',
    'Revizii mașină': '#8b5cf6',
    'Reparații casă': '#737373',
    'Telefon/Laptop': '#0ea5e9',
    'Electrocasnice': '#14b8a6',
    'Firmă Nico': '#4f46e5',
    'Donații': '#dc2626',
    'Nunți': '#e11d48',
    'Mobilier casă': '#7c3aed',
    'Sănătate': '#ef4444',
    'Scule': '#64748b',
    'Salariu': '#10b981',
    'Freelance': '#3b82f6',
    'Cadouri': '#ec4899',
    'Vânzări': '#06b6d4',
    'Cashback': '#84cc16',
    'ATM Cash': '#6b7280',
    'Altele': '#9ca3af'
  }
  
  // State pentru filtre
  let selectedCategories = Object.keys(categories)
  let startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  let endDate = new Date().toISOString().split('T')[0]
  let granularity = 'month' // 'day', 'month', 'year'
  let chartType = 'pie' // 'pie', 'donut', 'bar', 'line', 'radar'
  let showPercentages = true
  let showAmounts = true
  
  // Charts instances
  let pieChart = null
  let barChart = null
  let lineChart = null
  let radarChart = null
  
  // Refs pentru canvas
  let pieCanvas, barCanvas, lineCanvas, radarCanvas
  
  onMount(() => {
    loadData()
    createCharts()
  })
  
  onDestroy(() => {
    // Destroy charts on component unmount
    if (pieChart) pieChart.destroy()
    if (barChart) barChart.destroy()
    if (lineChart) lineChart.destroy()
    if (radarChart) radarChart.destroy()
  })
  
  function loadData() {
    const stored = localStorage.getItem('financeData')
    if (stored) {
      const data = JSON.parse(stored)
      transactions = data.transactions || []
      accounts = data.accounts || []
    }
  }
  
  // Calculează datele pentru grafice
  $: chartData = calculateChartData(transactions, selectedCategories, startDate, endDate, granularity)
  
  function calculateChartData(txs, cats, start, end, gran) {
    // Filtrare tranzacții după dată
    const filtered = txs.filter(t => {
      const txDate = new Date(t.date)
      return txDate >= new Date(start) && txDate <= new Date(end) && 
             cats.includes(t.category)
    })
    
    // Grupare după categorie
    const byCategory = {}
    const totals = { income: 0, expense: 0 }
    
    filtered.forEach(t => {
      if (!t.category) return
      
      if (!byCategory[t.category]) {
        byCategory[t.category] = { income: 0, expense: 0, count: 0 }
      }
      
      if (t.type === 'income') {
        byCategory[t.category].income += t.amount
        totals.income += t.amount
      } else if (t.type === 'expense') {
        byCategory[t.category].expense += t.amount
        totals.expense += t.amount
      }
      
      byCategory[t.category].count++
    })
    
    // Pregătire date pentru grafice
    const labels = Object.keys(byCategory)
    const expenseData = labels.map(cat => byCategory[cat].expense)
    const incomeData = labels.map(cat => byCategory[cat].income)
    const colors = labels.map(cat => categories[cat] || '#999')
    
    // Calculare procente
    const percentages = expenseData.map(val => 
      totals.expense > 0 ? ((val / totals.expense) * 100).toFixed(1) : 0
    )
    
    return {
      labels,
      expenseData,
      incomeData,
      colors,
      percentages,
      totals,
      byCategory,
      savings: totals.income - totals.expense
    }
  }
  
  // Actualizare grafice când se schimbă datele
  $: if (chartData && pieChart) updateCharts()
  
  function createCharts() {
    // Pie/Donut Chart
    const pieCtx = pieCanvas?.getContext('2d')
    if (pieCtx) {
      pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: []
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                generateLabels: function(chart) {
                  const data = chart.data
                  return data.labels.map((label, i) => ({
                    text: `${label}: ${formatAmount(data.datasets[0].data[i])} (${chartData.percentages[i]}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    hidden: false,
                    index: i
                  }))
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed
                  const percentage = chartData.percentages[context.dataIndex]
                  return `${context.label}: ${formatAmount(value)} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    }
    
    // Bar Chart
    const barCtx = barCanvas?.getContext('2d')
    if (barCtx) {
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Cheltuieli',
              data: [],
              backgroundColor: '#ef4444'
            },
            {
              label: 'Venituri',
              data: [],
              backgroundColor: '#10b981'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatAmount(value)
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${formatAmount(context.parsed.y)}`
                }
              }
            }
          }
        }
      })
    }
    
    // Line Chart
    const lineCtx = lineCanvas?.getContext('2d')
    if (lineCtx) {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatAmount(value)
                }
              }
            }
          }
        }
      })
    }
    
    // Radar Chart
    const radarCtx = radarCanvas?.getContext('2d')
    if (radarCtx) {
      radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatAmount(value)
                }
              }
            }
          }
        }
      })
    }
  }
  
  function updateCharts() {
    // Update Pie/Donut
    if (pieChart) {
      pieChart.data.labels = chartData.labels
      pieChart.data.datasets[0].data = chartData.expenseData
      pieChart.data.datasets[0].backgroundColor = chartData.colors
      pieChart.options.cutout = chartType === 'donut' ? '50%' : '0%'
      pieChart.update()
    }
    
    // Update Bar
    if (barChart) {
      barChart.data.labels = chartData.labels
      barChart.data.datasets[0].data = chartData.expenseData
      barChart.data.datasets[1].data = chartData.incomeData
      barChart.data.datasets[0].backgroundColor = chartData.colors
      barChart.data.datasets[1].backgroundColor = chartData.colors.map(c => c + '80')
      barChart.update()
    }
    
    // Update Line
    if (lineChart) {
      lineChart.data.labels = generateTimeLabels()
      lineChart.data.datasets = generateTimeSeriesData()
      lineChart.update()
    }
    
    // Update Radar
    if (radarChart) {
      radarChart.data.labels = chartData.labels.slice(0, 8) // Max 8 pentru radar
      radarChart.data.datasets = [
        {
          label: 'Cheltuieli',
          data: chartData.expenseData.slice(0, 8),
          borderColor: '#ef4444',
          backgroundColor: '#ef444420'
        },
        {
          label: 'Venituri',
          data: chartData.incomeData.slice(0, 8),
          borderColor: '#10b981',
          backgroundColor: '#10b98120'
        }
      ]
      radarChart.update()
    }
  }
  
  function generateTimeLabels() {
    const labels = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (granularity === 'day') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        labels.push(d.toLocaleDateString('ro-RO'))
      }
    } else if (granularity === 'month') {
      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        labels.push(d.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' }))
      }
    } else if (granularity === 'year') {
      for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
        labels.push(y.toString())
      }
    }
    
    return labels
  }
  
  function generateTimeSeriesData() {
    // Generează date pentru graficul de trend
    const datasets = []
    const mainCategories = selectedCategories.slice(0, 5) // Max 5 linii
    
    mainCategories.forEach(cat => {
      const data = generateCategoryTimeSeries(cat)
      datasets.push({
        label: cat,
        data: data,
        borderColor: categories[cat],
        backgroundColor: categories[cat] + '20',
        tension: 0.1
      })
    })
    
    return datasets
  }
  
  function generateCategoryTimeSeries(category) {
    // Simplu exemplu - în producție ar trebui calculat real
    const labels = generateTimeLabels()
    return labels.map(() => Math.random() * 1000)
  }
  
  function formatAmount(amount) {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount)
  }
  
  function toggleCategory(cat) {
    const index = selectedCategories.indexOf(cat)
    if (index > -1) {
      selectedCategories = selectedCategories.filter(c => c !== cat)
    } else {
      selectedCategories = [...selectedCategories, cat]
    }
  }
  
  function selectAllCategories() {
    selectedCategories = Object.keys(categories)
  }
  
  function deselectAllCategories() {
    selectedCategories = []
  }
  
  // Export functions
  async function exportPDF() {
    // Pentru export PDF real, ar trebui să folosim o librărie precum jsPDF
    alert('Export PDF va fi implementat cu jsPDF')
  }
  
  function exportExcel() {
    // Export Excel cu toate datele
    alert('Export Excel va fi implementat cu SheetJS')
  }
  
  function exportCSV() {
    let csv = 'Categorie,Venituri,Cheltuieli,Balanță,Procent\n'
    
    chartData.labels.forEach((label, i) => {
      const income = chartData.incomeData[i]
      const expense = chartData.expenseData[i]
      const balance = income - expense
      const percent = chartData.percentages[i]
      
      csv += `"${label}",${income},${expense},${balance},${percent}%\n`
    })
    
    // Adaugă totaluri
    csv += `\nTOTAL,${chartData.totals.income},${chartData.totals.expense},${chartData.savings},100%\n`
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `raport_${startDate}_${endDate}.csv`
    link.click()
  }
</script>

<div class="reports-container">
  <!-- Header cu filtre principale -->
  <div class="reports-header">
    <h2>📊 Rapoarte Avansate</h2>
    
    <div class="quick-stats">
      <div class="stat-card income">
        <div class="stat-label">Venituri totale</div>
        <div class="stat-value">{formatAmount(chartData.totals.income)}</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-label">Cheltuieli totale</div>
        <div class="stat-value">{formatAmount(chartData.totals.expense)}</div>
      </div>
      <div class="stat-card savings">
        <div class="stat-label">Economii</div>
        <div class="stat-value">{formatAmount(chartData.savings)}</div>
      </div>
    </div>
  </div>
  
  <!-- Filtre -->
  <div class="filters-panel">
    <div class="filter-section">
      <h3>📅 Perioadă</h3>
      <div class="date-filters">
        <input type="date" bind:value={startDate} />
        <span>→</span>
        <input type="date" bind:value={endDate} />
        
        <select bind:value={granularity}>
          <option value="day">Zilnic</option>
          <option value="month">Lunar</option>
          <option value="year">Anual</option>
        </select>
      </div>
    </div>
    
    <div class="filter-section">
      <h3>🏷️ Categorii ({selectedCategories.length}/{Object.keys(categories).length})</h3>
      <div class="category-actions">
        <button on:click={selectAllCategories}>Selectează toate</button>
        <button on:click={deselectAllCategories}>Deselectează toate</button>
      </div>
      
      <div class="category-grid">
        {#each Object.entries(categories) as [cat, color]}
          <label class="category-checkbox">
            <input 
              type="checkbox" 
              checked={selectedCategories.includes(cat)}
              on:change={() => toggleCategory(cat)}
            />
            <span class="category-label" style="background-color: {color}20; color: {color}">
              {cat}
            </span>
          </label>
        {/each}
      </div>
    </div>
    
    <div class="filter-section">
      <h3>📈 Tip grafic</h3>
      <div class="chart-type-selector">
        <button class:active={chartType === 'pie'} on:click={() => chartType = 'pie'}>
          Pie
        </button>
        <button class:active={chartType === 'donut'} on:click={() => chartType = 'donut'}>
          Donut
        </button>
        <button class:active={chartType === 'bar'} on:click={() => chartType = 'bar'}>
          Bar
        </button>
        <button class:active={chartType === 'line'} on:click={() => chartType = 'line'}>
          Line
        </button>
        <button class:active={chartType === 'radar'} on:click={() => chartType = 'radar'}>
          Radar
        </button>
      </div>
      
      <div class="display-options">
        <label>
          <input type="checkbox" bind:checked={showAmounts} />
          Afișează sume
        </label>
        <label>
          <input type="checkbox" bind:checked={showPercentages} />
          Afișează procente
        </label>
      </div>
    </div>
  </div>
  
  <!-- Grafice -->
  <div class="charts-grid">
    <div class="chart-container" class:hidden={chartType !== 'pie' && chartType !== 'donut'}>
      <h3>Distribuție cheltuieli</h3>
      <canvas bind:this={pieCanvas}></canvas>
    </div>
    
    <div class="chart-container" class:hidden={chartType !== 'bar'}>
      <h3>Comparație venituri vs cheltuieli</h3>
      <canvas bind:this={barCanvas}></canvas>
    </div>
    
    <div class="chart-container" class:hidden={chartType !== 'line'}>
      <h3>Trend în timp</h3>
      <canvas bind:this={lineCanvas}></canvas>
    </div>
    
    <div class="chart-container" class:hidden={chartType !== 'radar'}>
      <h3>Analiză radar</h3>
      <canvas bind:this={radarCanvas}></canvas>
    </div>
  </div>
  
  <!-- Tabel detaliat -->
  <div class="details-table">
    <h3>📋 Detalii pe categorii</h3>
    <table>
      <thead>
        <tr>
          <th>Categorie</th>
          <th>Venituri</th>
          <th>Cheltuieli</th>
          <th>Balanță</th>
          <th>% din total</th>
          <th>Tranzacții</th>
        </tr>
      </thead>
      <tbody>
        {#each chartData.labels as label, i}
          <tr>
            <td>
              <span class="category-badge" style="background-color: {chartData.colors[i]}20; color: {chartData.colors[i]}">
                {label}
              </span>
            </td>
            <td class="amount income">{formatAmount(chartData.incomeData[i])}</td>
            <td class="amount expense">{formatAmount(chartData.expenseData[i])}</td>
            <td class="amount {chartData.incomeData[i] - chartData.expenseData[i] >= 0 ? 'positive' : 'negative'}">
              {formatAmount(chartData.incomeData[i] - chartData.expenseData[i])}
            </td>
            <td>{chartData.percentages[i]}%</td>
            <td>{chartData.byCategory[label]?.count || 0}</td>
          </tr>
        {/each}
        <tr class="total-row">
          <td><strong>TOTAL</strong></td>
          <td class="amount income"><strong>{formatAmount(chartData.totals.income)}</strong></td>
          <td class="amount expense"><strong>{formatAmount(chartData.totals.expense)}</strong></td>
          <td class="amount {chartData.savings >= 0 ? 'positive' : 'negative'}">
            <strong>{formatAmount(chartData.savings)}</strong>
          </td>
          <td><strong>100%</strong></td>
          <td><strong>{transactions.length}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Export buttons -->
  <div class="export-section">
    <h3>💾 Export</h3>
    <div class="export-buttons">
      <button class="export-btn pdf" on:click={exportPDF}>
        📄 Export PDF
      </button>
      <button class="export-btn excel" on:click={exportExcel}>
        📊 Export Excel
      </button>
      <button class="export-btn csv" on:click={exportCSV}>
        📋 Export CSV
      </button>
    </div>
  </div>
</div>

<style>
  .reports-container {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .reports-header {
    margin-bottom: 24px;
  }
  
  .reports-header h2 {
    margin-bottom: 16px;
  }
  
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .stat-card.income .stat-value {
    color: #10b981;
  }
  
  .stat-card.expense .stat-value {
    color: #ef4444;
  }
  
  .stat-card.savings .stat-value {
    color: #3b82f6;
  }
  
  .filters-panel {
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .filter-section {
    margin-bottom: 20px;
  }
  
  .filter-section h3 {
    margin-bottom: 12px;
    font-size: 1.1rem;
  }
  
  .date-filters {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .date-filters input, .date-filters select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--text-primary);
  }
  
  .category-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .category-actions button {
    padding: 6px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .category-actions button:hover {
    background: var(--primary);
    color: white;
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .category-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  
  .category-checkbox input {
    margin-right: 8px;
  }
  
  .category-label {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .chart-type-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .chart-type-selector button {
    padding: 8px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
  }
  
  .chart-type-selector button.active {
    background: var(--primary);
    color: white;
  }
  
  .display-options {
    display: flex;
    gap: 16px;
  }
  
  .display-options label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .chart-container {
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 400px;
  }
  
  .chart-container.hidden {
    display: none;
  }
  
  .chart-container h3 {
    margin-bottom: 16px;
  }
  
  .chart-container canvas {
    max-height: 350px;
  }
  
  .details-table {
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
  }
  
  .details-table h3 {
    margin-bottom: 16px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th {
    text-align: left;
    padding: 12px;
    background: var(--bg-secondary);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-muted);
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .category-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  
  .amount {
    font-weight: 500;
  }
  
  .amount.income {
    color: #10b981;
  }
  
  .amount.expense {
    color: #ef4444;
  }
  
  .amount.positive {
    color: #3b82f6;
  }
  
  .amount.negative {
    color: #f59e0b;
  }
  
  .total-row {
    background: var(--bg-secondary);
    font-weight: 600;
  }
  
  .export-section {
    background: var(--bg-primary);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .export-section h3 {
    margin-bottom: 16px;
  }
  
  .export-buttons {
    display: flex;
    gap: 12px;
  }
  
  .export-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .export-btn.pdf {
    background: #dc2626;
    color: white;
  }
  
  .export-btn.excel {
    background: #10b981;
    color: white;
  }
  
  .export-btn.csv {
    background: #3b82f6;
    color: white;
  }
  
  .export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  /* Dark mode support */
  :global(body.dark) .stat-card,
  :global(body.dark) .filters-panel,
  :global(body.dark) .chart-container,
  :global(body.dark) .details-table,
  :global(body.dark) .export-section {
    background: #1a1a1a;
  }
  
  :global(body.dark) th {
    background: #2a2a2a;
  }
  
  :global(body.dark) td {
    border-bottom-color: #333;
  }
  
  :global(body.dark) .category-actions button,
  :global(body.dark) .chart-type-selector button {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  :global(body.dark) input,
  :global(body.dark) select {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .chart-container {
      min-height: 300px;
    }
    
    .export-buttons {
      flex-direction: column;
    }
    
    .category-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
  }
</style>