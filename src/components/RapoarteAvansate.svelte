<script>
  import { onMount } from 'svelte'
  import FilterPanel from './FilterPanel.svelte'
  import ChartManager from './ChartManager.svelte'
  import jsPDF from 'jspdf'
  import 'jspdf-autotable'
  import * as XLSX from 'xlsx'
  
  let transactions = []
  let accounts = []
  let chartData = {}
  let selectedChart = 'pie'
  let filters = {}
  
  // Categories with colors
  const categories = [
    { name: 'Alimente', color: '#10b981' },
    { name: 'Restaurant/Comenzi', color: '#f97316' },
    { name: 'Transport', color: '#3b82f6' },
    { name: 'Consumabile casă', color: '#84cc16' },
    { name: 'Facturi', color: '#f59e0b' },
    { name: 'Abonamente', color: '#a855f7' },
    { name: 'Achiziții diverse', color: '#06b6d4' },
    { name: 'Concediu/Vacanță', color: '#ec4899' },
    { name: 'Investiții', color: '#eab308' },
    { name: 'Economii', color: '#22c55e' },
    { name: 'Zile naștere', color: '#f43f5e' },
    { name: 'Asigurări', color: '#6366f1' },
    { name: 'Revizii mașină', color: '#8b5cf6' },
    { name: 'Reparații casă', color: '#737373' },
    { name: 'Telefon/Laptop', color: '#0ea5e9' },
    { name: 'Electrocasnice', color: '#14b8a6' },
    { name: 'Firmă Nico', color: '#4f46e5' },
    { name: 'Donații', color: '#dc2626' },
    { name: 'Nunți', color: '#e11d48' },
    { name: 'Mobilier casă', color: '#7c3aed' },
    { name: 'Sănătate', color: '#ef4444' },
    { name: 'Scule', color: '#64748b' },
    { name: 'Salariu', color: '#10b981' },
    { name: 'Freelance', color: '#3b82f6' },
    { name: 'Altele', color: '#9ca3af' }
  ]
  
  onMount(() => {
    loadData()
  })
  
  function loadData() {
    const stored = localStorage.getItem('financeData')
    if (stored) {
      const data = JSON.parse(stored)
      transactions = data.transactions || []
      accounts = data.accounts || []
    }
    calculateData()
  }
  
  function handleFilterChange(event) {
    filters = event.detail
    calculateData()
  }
  
  function calculateData() {
    if (!transactions.length) return
    
    // Apply filters
    let filtered = [...transactions]
    
    // Date filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(t => 
        t.date >= filters.startDate && t.date <= filters.endDate
      )
    }
    
    // Type filter
    if (filters.selectedType && filters.selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === filters.selectedType)
    }
    
    // Person filter
    if (filters.selectedPerson && filters.selectedPerson !== 'all') {
      filtered = filtered.filter(t => t.person === filters.selectedPerson)
    }
    
    // Categories filter
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      filtered = filtered.filter(t => 
        filters.selectedCategories.includes(t.category)
      )
    }
    
    // Accounts filter
    if (filters.selectedAccounts && filters.selectedAccounts.length > 0) {
      filtered = filtered.filter(t => 
        filters.selectedAccounts.includes(t.fromAccount) ||
        filters.selectedAccounts.includes(t.toAccount)
      )
    }
    
    // Process data for charts
    processChartData(filtered)
  }
  
  function processChartData(filtered) {
    // Group by category
    const byCategory = {}
    let totalIncome = 0
    let totalExpense = 0
    
    filtered.forEach(t => {
      const cat = t.category || 'Altele'
      if (!byCategory[cat]) {
        byCategory[cat] = { income: 0, expense: 0, count: 0 }
      }
      
      if (t.type === 'income') {
        byCategory[cat].income += t.amount
        totalIncome += t.amount
      } else if (t.type === 'expense') {
        byCategory[cat].expense += t.amount
        totalExpense += t.amount
      }
      
      byCategory[cat].count++
    })
    
    // Sort by total amount
    const sortedCategories = Object.entries(byCategory)
      .sort(([,a], [,b]) => (b.income + b.expense) - (a.income + a.expense))
      .slice(0, 15) // Top 15
    
    // Prepare chart data
    const labels = sortedCategories.map(([cat]) => cat)
    const values = sortedCategories.map(([,data]) => 
      filters.selectedType === 'income' ? data.income :
      filters.selectedType === 'expense' ? data.expense :
      data.income + data.expense
    )
    const colors = sortedCategories.map(([cat]) => 
      categories.find(c => c.name === cat)?.color || '#999'
    )
    
    // Time series data
    const timeSeries = processTimeSeries(filtered)
    
    // Update chart data
    chartData = {
      pie: {
        labels,
        values,
        colors
      },
      bar: {
        labels,
        datasets: [
          {
            label: 'Cheltuieli',
            data: sortedCategories.map(([,d]) => d.expense),
            backgroundColor: '#ef4444'
          },
          {
            label: 'Venituri', 
            data: sortedCategories.map(([,d]) => d.income),
            backgroundColor: '#10b981'
          }
        ]
      },
      line: timeSeries,
      summary: {
        totalIncome,
        totalExpense,
        savings: totalIncome - totalExpense,
        transactionCount: filtered.length,
        categories: sortedCategories,
        byCategory
      }
    }
  }
  
  function processTimeSeries(filtered) {
    if (!filters.granularity) return { labels: [], datasets: [] }
    
    // Group by time period
    const timeGroups = {}
    
    filtered.forEach(t => {
      const date = new Date(t.date)
      let key
      
      switch (filters.granularity) {
        case 'day':
          key = t.date
          break
        case 'week':
          const week = getWeek(date)
          key = `${date.getFullYear()}-S${week}`
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1
          key = `${date.getFullYear()}-T${quarter}`
          break
        case 'year':
          key = date.getFullYear().toString()
          break
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      if (!timeGroups[key]) {
        timeGroups[key] = { income: 0, expense: 0 }
      }
      
      if (t.type === 'income') {
        timeGroups[key].income += t.amount
      } else if (t.type === 'expense') {
        timeGroups[key].expense += t.amount
      }
    })
    
    // Sort by date and prepare datasets
    const sortedKeys = Object.keys(timeGroups).sort()
    
    return {
      labels: sortedKeys,
      datasets: [
        {
          label: 'Venituri',
          data: sortedKeys.map(k => timeGroups[k].income),
          borderColor: '#10b981',
          backgroundColor: '#10b98120',
          tension: 0.1
        },
        {
          label: 'Cheltuieli',
          data: sortedKeys.map(k => timeGroups[k].expense),
          borderColor: '#ef4444',
          backgroundColor: '#ef444420',
          tension: 0.1
        }
      ]
    }
  }
  
  function getWeek(date) {
    const onejan = new Date(date.getFullYear(), 0, 1)
    return Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7)
  }
  
  function formatAmount(amount) {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount)
  }
  
  // Export functions
  async function exportPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    // Header
    pdf.setFontSize(20)
    pdf.text('Raport Financiar', pageWidth / 2, 20, { align: 'center' })
    
    pdf.setFontSize(12)
    const period = filters.startDate && filters.endDate ? 
      `${filters.startDate} - ${filters.endDate}` : 'Toate tranzacțiile'
    pdf.text(`Perioada: ${period}`, pageWidth / 2, 30, { align: 'center' })
    
    // Summary
    pdf.setFontSize(10)
    pdf.text(`Venituri: ${formatAmount(chartData.summary.totalIncome)}`, 20, 45)
    pdf.text(`Cheltuieli: ${formatAmount(chartData.summary.totalExpense)}`, 80, 45)
    pdf.text(`Economii: ${formatAmount(chartData.summary.savings)}`, 140, 45)
    
    // Table
    const tableData = chartData.summary.categories.map(([cat, data]) => [
      cat,
      formatAmount(data.income),
      formatAmount(data.expense),
      formatAmount(data.income - data.expense),
      data.count
    ])
    
    pdf.autoTable({
      head: [['Categorie', 'Venituri', 'Cheltuieli', 'Balanță', 'Nr.']],
      body: tableData,
      startY: 55,
      theme: 'grid'
    })
    
    pdf.save(`raport_${filters.startDate}_${filters.endDate}.pdf`)
  }
  
  function exportExcel() {
    const wb = XLSX.utils.book_new()
    
    // Summary sheet
    const summaryData = [
      ['Raport Financiar'],
      [`Perioada: ${filters.startDate || 'Început'} - ${filters.endDate || 'Prezent'}`],
      [],
      ['Indicator', 'Valoare'],
      ['Venituri totale', chartData.summary.totalIncome],
      ['Cheltuieli totale', chartData.summary.totalExpense],
      ['Economii', chartData.summary.savings],
      ['Număr tranzacții', chartData.summary.transactionCount]
    ]
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, ws1, 'Sumar')
    
    // Categories sheet
    const categoriesData = [
      ['Categorie', 'Venituri', 'Cheltuieli', 'Balanță', 'Nr. tranzacții']
    ]
    
    chartData.summary.categories.forEach(([cat, data]) => {
      categoriesData.push([
        cat,
        data.income,
        data.expense,
        data.income - data.expense,
        data.count
      ])
    })
    
    const ws2 = XLSX.utils.aoa_to_sheet(categoriesData)
    XLSX.utils.book_append_sheet(wb, ws2, 'Categorii')
    
    XLSX.writeFile(wb, `raport_${filters.startDate}_${filters.endDate}.xlsx`)
  }
  
  function exportCSV() {
    let csv = 'Categorie,Venituri,Cheltuieli,Balanță,Tranzacții\n'
    
    chartData.summary.categories.forEach(([cat, data]) => {
      csv += `"${cat}",${data.income},${data.expense},${data.income - data.expense},${data.count}\n`
    })
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `raport_${filters.startDate}_${filters.endDate}.csv`
    link.click()
  }
</script>

<div class="reports-container">
  <h2>📊 Rapoarte Avansate</h2>
  
  {#if chartData.summary}
    <div class="summary-cards">
      <div class="card income">
        <div class="label">Venituri</div>
        <div class="value">{formatAmount(chartData.summary.totalIncome)}</div>
      </div>
      <div class="card expense">
        <div class="label">Cheltuieli</div>
        <div class="value">{formatAmount(chartData.summary.totalExpense)}</div>
      </div>
      <div class="card savings">
        <div class="label">Economii</div>
        <div class="value">{formatAmount(chartData.summary.savings)}</div>
      </div>
      <div class="card count">
        <div class="label">Tranzacții</div>
        <div class="value">{chartData.summary.transactionCount}</div>
      </div>
    </div>
  {/if}
  
  <div class="main-grid">
    <div class="filters-column">
      <FilterPanel 
        {categories} 
        {accounts}
        on:filterChange={handleFilterChange}
      />
    </div>
    
    <div class="charts-column">
      <div class="chart-controls">
        <div class="chart-tabs">
          <button 
            class:active={selectedChart === 'pie'}
            on:click={() => selectedChart = 'pie'}
          >
            Pie Chart
          </button>
          <button 
            class:active={selectedChart === 'bar'}
            on:click={() => selectedChart = 'bar'}
          >
            Bar Chart
          </button>
          <button 
            class:active={selectedChart === 'line'}
            on:click={() => selectedChart = 'line'}
          >
            Trend
          </button>
        </div>
        
        <div class="export-buttons">
          <button class="export-btn pdf" on:click={exportPDF}>📄 PDF</button>
          <button class="export-btn excel" on:click={exportExcel}>📊 Excel</button>
          <button class="export-btn csv" on:click={exportCSV}>📋 CSV</button>
        </div>
      </div>
      
      <div class="chart-container">
        {#if selectedChart === 'pie' && chartData.pie}
          <ChartManager 
            data={{
              labels: chartData.pie.labels,
              datasets: [{
                data: chartData.pie.values,
                backgroundColor: chartData.pie.colors,
                borderWidth: 1,
                borderColor: '#fff'
              }]
            }} 
            chartType="doughnut" 
            height={400} 
          />
        {:else if selectedChart === 'bar' && chartData.bar}
          <ChartManager 
            data={chartData.bar}
            chartType="bar" 
            height={400} 
          />
        {:else if selectedChart === 'line' && chartData.line}
          <ChartManager 
            data={chartData.line}
            chartType="line" 
            height={400} 
          />
        {:else}
          <div class="no-data">
            <p>Nu există date pentru perioada selectată</p>
            <p>Selectează filtre sau adaugă tranzacții</p>
          </div>
        {/if}
      </div>
      
      {#if chartData.summary && chartData.summary.categories.length > 0}
        <div class="details-table">
          <h3>Detalii pe categorii</h3>
          <table>
            <thead>
              <tr>
                <th>Categorie</th>
                <th>Venituri</th>
                <th>Cheltuieli</th>
                <th>Balanță</th>
                <th>Nr.</th>
              </tr>
            </thead>
            <tbody>
              {#each chartData.summary.categories as [cat, data]}
                <tr>
                  <td>{cat}</td>
                  <td class="income">{formatAmount(data.income)}</td>
                  <td class="expense">{formatAmount(data.expense)}</td>
                  <td class:positive={data.income - data.expense >= 0}>
                    {formatAmount(data.income - data.expense)}
                  </td>
                  <td>{data.count}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .reports-container {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  h2 {
    margin-bottom: 24px;
  }
  
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .card {
    background: var(--bg-primary, white);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .card .label {
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
    margin-bottom: 8px;
  }
  
  .card .value {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .card.income .value { color: #10b981; }
  .card.expense .value { color: #ef4444; }
  .card.savings .value { color: #3b82f6; }
  .card.count .value { color: #6b7280; }
  
  .main-grid {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
  }
  
  .chart-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .chart-tabs {
    display: flex;
    gap: 8px;
  }
  
  .chart-tabs button {
    padding: 8px 16px;
    background: var(--bg-secondary, #f8f9fa);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .chart-tabs button:hover {
    background: var(--primary-light, #dbeafe);
  }
  
  .chart-tabs button.active {
    background: var(--primary, #3b82f6);
    color: white;
    border-color: var(--primary, #3b82f6);
  }
  
  .export-buttons {
    display: flex;
    gap: 8px;
  }
  
  .export-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    color: white;
    transition: all 0.2s;
  }
  
  .export-btn.pdf { background: #dc2626; }
  .export-btn.excel { background: #10b981; }
  .export-btn.csv { background: #3b82f6; }
  
  .export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .chart-container {
    background: var(--bg-primary, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-height: 450px;
    margin-bottom: 24px;
  }
  
  .no-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    color: var(--text-secondary, #666);
  }
  
  .details-table {
    background: var(--bg-primary, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    background: var(--bg-secondary, #f8f9fa);
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-secondary, #666);
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  td.income { color: #10b981; }
  td.expense { color: #ef4444; }
  td.positive { color: #3b82f6; }
  
  :global(body.dark) .card,
  :global(body.dark) .chart-container,
  :global(body.dark) .details-table {
    background: #1a1a1a;
  }
  
  :global(body.dark) th {
    background: #2a2a2a;
  }
  
  :global(body.dark) td {
    border-bottom-color: #333;
  }
  
  @media (max-width: 1024px) {
    .main-grid {
      grid-template-columns: 1fr;
    }
    
    .filters-column {
      margin-bottom: 24px;
    }
  }
  
  @media (max-width: 768px) {
    .summary-cards {
      grid-template-columns: 1fr 1fr;
    }
    
    .chart-controls {
      flex-direction: column;
      gap: 12px;
    }
    
    .export-buttons {
      width: 100%;
      justify-content: center;
    }
  }
</style>