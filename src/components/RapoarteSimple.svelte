<script>
  import { onMount } from 'svelte'
  
  let transactions = []
  let accounts = []
  let chartData = null
  let selectedPeriod = 'month' // month, year, all
  let selectedType = 'all' // all, income, expense
  
  // Categorii cu culori
  const categoryColors = {
    'Alimente': '#10b981',
    'Restaurant/Comenzi': '#f97316',
    'Transport': '#3b82f6',
    'Facturi': '#f59e0b',
    'Abonamente': '#a855f7',
    'Shopping': '#06b6d4',
    'Sănătate': '#ef4444',
    'Salariu': '#10b981',
    'Freelance': '#3b82f6',
    'Altele': '#6b7280'
  }
  
  onMount(() => {
    loadData()
    if (transactions.length === 0) {
      generateTestData()
    }
    calculateChartData()
  })
  
  function loadData() {
    const stored = localStorage.getItem('financeData')
    if (stored) {
      const data = JSON.parse(stored)
      transactions = data.transactions || []
      accounts = data.accounts || []
    }
  }
  
  function generateTestData() {
    // Generăm date de test pentru ultimele 3 luni
    const categories = Object.keys(categoryColors)
    const testTransactions = []
    const today = new Date()
    
    // Generăm 50 tranzacții random
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 90) // ultimele 90 zile
      const date = new Date(today)
      date.setDate(date.getDate() - daysAgo)
      
      const isIncome = Math.random() > 0.7 // 30% venituri
      const category = isIncome ? 
        (Math.random() > 0.5 ? 'Salariu' : 'Freelance') :
        categories[Math.floor(Math.random() * (categories.length - 2))]
      
      testTransactions.push({
        id: `test_${i}`,
        type: isIncome ? 'income' : 'expense',
        amount: isIncome ? 
          Math.floor(Math.random() * 3000) + 2000 : // venituri 2000-5000
          Math.floor(Math.random() * 500) + 50, // cheltuieli 50-550
        category: category,
        description: `Test ${category}`,
        date: date.toISOString().split('T')[0],
        person: ['Ioan', 'Nico', 'Comun'][Math.floor(Math.random() * 3)]
      })
    }
    
    transactions = testTransactions
    
    // Salvăm în localStorage
    const data = JSON.parse(localStorage.getItem('financeData') || '{}')
    data.transactions = transactions
    localStorage.setItem('financeData', JSON.stringify(data))
    
    alert('Am generat 50 tranzacții de test pentru demonstrație!')
  }
  
  function calculateChartData() {
    if (!transactions.length) return
    
    // Filtrare după perioadă
    const now = new Date()
    let filtered = [...transactions]
    
    if (selectedPeriod === 'month') {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === now.getMonth() && 
               tDate.getFullYear() === now.getFullYear()
      })
    } else if (selectedPeriod === 'year') {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === now.getFullYear()
      })
    }
    
    // Filtrare după tip
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType)
    }
    
    // Grupare pe categorii
    const byCategory = {}
    let totalIncome = 0
    let totalExpense = 0
    
    filtered.forEach(t => {
      if (!t.category) return
      
      if (!byCategory[t.category]) {
        byCategory[t.category] = {
          amount: 0,
          count: 0,
          type: t.type
        }
      }
      
      byCategory[t.category].amount += t.amount
      byCategory[t.category].count++
      
      if (t.type === 'income') {
        totalIncome += t.amount
      } else {
        totalExpense += t.amount
      }
    })
    
    // Sortare după sumă
    const sorted = Object.entries(byCategory)
      .sort(([,a], [,b]) => b.amount - a.amount)
      .slice(0, 10) // Top 10
    
    chartData = {
      categories: sorted,
      totalIncome,
      totalExpense,
      savings: totalIncome - totalExpense,
      transactionCount: filtered.length
    }
  }
  
  // Recalculare când se schimbă filtrele
  $: selectedPeriod, selectedType, calculateChartData()
  
  function formatAmount(amount) {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount)
  }
  
  function getPercentage(amount, total) {
    if (total === 0) return '0'
    return ((amount / total) * 100).toFixed(1)
  }
  
  function clearTestData() {
    if (confirm('Ștergi toate datele de test?')) {
      transactions = []
      const data = JSON.parse(localStorage.getItem('financeData') || '{}')
      data.transactions = []
      localStorage.setItem('financeData', JSON.stringify(data))
      chartData = null
      alert('Date șterse!')
    }
  }
  
  function exportCSV() {
    if (!chartData) return
    
    let csv = 'Categorie,Sumă,Procent,Nr. Tranzacții\n'
    chartData.categories.forEach(([cat, data]) => {
      const total = data.type === 'income' ? chartData.totalIncome : chartData.totalExpense
      const percent = getPercentage(data.amount, total)
      csv += `"${cat}",${data.amount},${percent}%,${data.count}\n`
    })
    
    csv += `\nTOTAL VENITURI,${chartData.totalIncome},,\n`
    csv += `TOTAL CHELTUIELI,${chartData.totalExpense},,\n`
    csv += `ECONOMII,${chartData.savings},,\n`
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `raport_${selectedPeriod}.csv`
    link.click()
  }
</script>

<div class="reports-container">
  <div class="header">
    <h2>📊 Rapoarte Simple</h2>
    
    <div class="actions">
      {#if transactions.length === 0}
        <button class="btn-primary" on:click={generateTestData}>
          🎲 Generează date test
        </button>
      {:else}
        <button class="btn-secondary" on:click={clearTestData}>
          🗑️ Șterge date test
        </button>
      {/if}
    </div>
  </div>
  
  {#if chartData}
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card income">
        <div class="card-label">Venituri</div>
        <div class="card-value">{formatAmount(chartData.totalIncome)}</div>
      </div>
      
      <div class="card expense">
        <div class="card-label">Cheltuieli</div>
        <div class="card-value">{formatAmount(chartData.totalExpense)}</div>
      </div>
      
      <div class="card savings">
        <div class="card-label">Economii</div>
        <div class="card-value">{formatAmount(chartData.savings)}</div>
      </div>
      
      <div class="card count">
        <div class="card-label">Tranzacții</div>
        <div class="card-value">{chartData.transactionCount}</div>
      </div>
    </div>
    
    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Perioadă:</label>
        <select bind:value={selectedPeriod}>
          <option value="month">Luna curentă</option>
          <option value="year">Anul curent</option>
          <option value="all">Toate</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Tip:</label>
        <select bind:value={selectedType}>
          <option value="all">Toate</option>
          <option value="income">Doar venituri</option>
          <option value="expense">Doar cheltuieli</option>
        </select>
      </div>
      
      <button class="btn-export" on:click={exportCSV}>
        📥 Export CSV
      </button>
    </div>
    
    <!-- Visual Chart (simple bars) -->
    <div class="chart-container">
      <h3>Top categorii</h3>
      
      <div class="chart-bars">
        {#each chartData.categories as [category, data]}
          {@const maxAmount = Math.max(...chartData.categories.map(([,d]) => d.amount))}
          {@const percentage = (data.amount / maxAmount) * 100}
          {@const total = data.type === 'income' ? chartData.totalIncome : chartData.totalExpense}
          
          <div class="bar-row">
            <div class="bar-label">
              <span class="category-name" style="color: {categoryColors[category] || '#666'}">
                {category}
              </span>
              <span class="category-count">({data.count})</span>
            </div>
            
            <div class="bar-container">
              <div 
                class="bar {data.type}"
                style="width: {percentage}%; background-color: {categoryColors[category] || '#666'}"
              >
              </div>
            </div>
            
            <div class="bar-values">
              <span class="amount">{formatAmount(data.amount)}</span>
              <span class="percent">{getPercentage(data.amount, total)}%</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Detailed Table -->
    <div class="table-container">
      <h3>Detalii categorii</h3>
      
      <table>
        <thead>
          <tr>
            <th>Categorie</th>
            <th>Tip</th>
            <th>Sumă</th>
            <th>Procent</th>
            <th>Nr. tranzacții</th>
          </tr>
        </thead>
        <tbody>
          {#each chartData.categories as [category, data]}
            {@const total = data.type === 'income' ? chartData.totalIncome : chartData.totalExpense}
            <tr>
              <td>
                <span style="color: {categoryColors[category] || '#666'}">
                  {category}
                </span>
              </td>
              <td>
                <span class="type-badge {data.type}">
                  {data.type === 'income' ? 'Venit' : 'Cheltuială'}
                </span>
              </td>
              <td class="amount">{formatAmount(data.amount)}</td>
              <td>{getPercentage(data.amount, total)}%</td>
              <td>{data.count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="empty-state">
      <p>Nu există tranzacții pentru a genera rapoarte.</p>
      <p>Adaugă tranzacții sau generează date de test.</p>
    </div>
  {/if}
</div>

<style>
  .reports-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .header h2 {
    margin: 0;
  }
  
  .actions {
    display: flex;
    gap: 12px;
  }
  
  .btn-primary, .btn-secondary, .btn-export {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-secondary {
    background: #ef4444;
    color: white;
  }
  
  .btn-export {
    background: #10b981;
    color: white;
  }
  
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  
  .card-label {
    font-size: 0.9rem;
    color: var(--text-muted, #666);
    margin-bottom: 8px;
  }
  
  .card-value {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .card.income .card-value {
    color: #10b981;
  }
  
  .card.expense .card-value {
    color: #ef4444;
  }
  
  .card.savings .card-value {
    color: #3b82f6;
  }
  
  .card.count .card-value {
    color: #6b7280;
  }
  
  .filters {
    display: flex;
    gap: 16px;
    align-items: end;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--bg-primary, white);
    border-radius: 8px;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .filter-group label {
    font-size: 0.9rem;
    color: var(--text-muted, #666);
  }
  
  select {
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 4px;
    background: var(--input-bg, white);
    color: var(--text-primary, #333);
  }
  
  .chart-container, .table-container {
    background: var(--bg-primary, white);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .chart-container h3, .table-container h3 {
    margin: 0 0 20px 0;
  }
  
  .chart-bars {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .bar-row {
    display: grid;
    grid-template-columns: 150px 1fr 150px;
    gap: 16px;
    align-items: center;
  }
  
  .bar-label {
    text-align: right;
  }
  
  .category-name {
    font-weight: 500;
  }
  
  .category-count {
    font-size: 0.85rem;
    color: var(--text-muted, #666);
    margin-left: 4px;
  }
  
  .bar-container {
    background: var(--bg-secondary, #f3f4f6);
    height: 30px;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .bar-values {
    display: flex;
    gap: 12px;
    font-size: 0.9rem;
  }
  
  .amount {
    font-weight: 600;
  }
  
  .percent {
    color: var(--text-muted, #666);
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
    color: var(--text-muted, #666);
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .type-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  
  .type-badge.income {
    background: #10b98120;
    color: #10b981;
  }
  
  .type-badge.expense {
    background: #ef444420;
    color: #ef4444;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted, #666);
  }
  
  .empty-state p {
    margin: 8px 0;
  }
  
  /* Dark mode */
  :global(body.dark) .card,
  :global(body.dark) .filters,
  :global(body.dark) .chart-container,
  :global(body.dark) .table-container {
    background: #1a1a1a;
  }
  
  :global(body.dark) .bar-container {
    background: #2a2a2a;
  }
  
  :global(body.dark) th {
    background: #2a2a2a;
  }
  
  :global(body.dark) td {
    border-bottom-color: #333;
  }
  
  :global(body.dark) select {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  @media (max-width: 768px) {
    .bar-row {
      grid-template-columns: 100px 1fr 100px;
      font-size: 0.85rem;
    }
    
    .filters {
      flex-direction: column;
    }
  }
</style>