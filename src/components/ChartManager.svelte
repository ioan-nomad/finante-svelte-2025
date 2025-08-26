<script>
  import { onMount, onDestroy } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  export let data = null
  export let chartType = 'pie'
  export let height = 400
  
  let chartCanvas
  let chartInstance = null
  
  // Color palette
  const defaultColors = [
    '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#64748b', '#22c55e', '#fbbf24'
  ]
  
  onMount(() => {
    if (data) {
      createChart()
    }
  })
  
  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy()
    }
  })
  
  function createChart() {
    if (!chartCanvas || !data) return
    
    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    const ctx = chartCanvas.getContext('2d')
    const config = getChartConfig()
    
    chartInstance = new Chart(ctx, config)
  }
  
  function getChartConfig() {
    switch (chartType) {
      case 'pie':
      case 'doughnut':
        return getPieConfig()
      case 'bar':
        return getBarConfig()
      case 'line':
        return getLineConfig()
      case 'radar':
        return getRadarConfig()
      default:
        return getPieConfig()
    }
  }
  
  function getPieConfig() {
    return {
      type: chartType === 'doughnut' ? 'doughnut' : 'pie',
      data: {
        labels: data.labels || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: data.colors || defaultColors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              generateLabels: function(chart) {
                const dataset = chart.data.datasets[0]
                const total = dataset.data.reduce((a, b) => a + b, 0)
                
                return chart.data.labels.map((label, i) => {
                  const value = dataset.data[i]
                  const percentage = ((value / total) * 100).toFixed(1)
                  
                  return {
                    text: `${label}: ${formatAmount(value)} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    hidden: false,
                    index: i
                  }
                })
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((context.parsed / total) * 100).toFixed(1)
                return `${context.label}: ${formatAmount(context.parsed)} (${percentage}%)`
              }
            }
          }
        }
      }
    }
  }
  
  function getBarConfig() {
    return {
      type: 'bar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: 'Valoare',
          data: data.values || [],
          backgroundColor: data.colors || defaultColors[0],
          borderColor: data.colors || defaultColors[0],
          borderWidth: 1
        }]
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
          legend: {
            display: data.datasets && data.datasets.length > 1
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label || ''}: ${formatAmount(context.parsed.y)}`
              }
            }
          }
        }
      }
    }
  }
  
  function getLineConfig() {
    return {
      type: 'line',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: 'Trend',
          data: data.values || [],
          borderColor: defaultColors[0],
          backgroundColor: defaultColors[0] + '20',
          tension: 0.1
        }]
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
    }
  }
  
  function getRadarConfig() {
    return {
      type: 'radar',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          label: 'Valori',
          data: data.values || [],
          borderColor: defaultColors[0],
          backgroundColor: defaultColors[0] + '20'
        }]
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
    }
  }
  
  function formatAmount(value) {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  // Recreate chart when data or type changes
  $: if (chartInstance && (data || chartType)) {
    createChart()
  }
</script>

<div class="chart-wrapper" style="height: {height}px">
  <canvas bind:this={chartCanvas}></canvas>
</div>

<style>
  .chart-wrapper {
    position: relative;
    width: 100%;
    background: var(--bg-primary, white);
    border-radius: 8px;
    padding: 16px;
  }
  
  canvas {
    max-width: 100%;
  }
  
  :global(body.dark) .chart-wrapper {
    background: #1a1a1a;
  }
</style>