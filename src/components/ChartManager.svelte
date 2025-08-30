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
    
    // Listen for dark mode changes
    const observer = new MutationObserver(() => {
      if (chartInstance) {
        createChart() // Recreate chart with new colors
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Store observer for cleanup
    window._chartObserver = observer
  })
  
  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy()
    }
    
    // Clean up observer
    if (window._chartObserver) {
      window._chartObserver.disconnect()
      delete window._chartObserver
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
    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#e6e9ff' : '#374151'
    const tooltipBg = isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    
    return {
      type: chartType === 'doughnut' ? 'doughnut' : 'pie',
      data: {
        labels: data.labels || [],
        datasets: data.datasets || [{
          data: data.values || [],
          backgroundColor: data.colors || defaultColors,
          borderWidth: 2,
          borderColor: isDark ? '#1a1a1a' : '#fff'
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
              color: textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              },
              generateLabels: function(chart) {
                const dataset = chart.data.datasets[0]
                const total = dataset.data.reduce((a, b) => a + b, 0)
                
                return chart.data.labels.map((label, i) => {
                  const value = dataset.data[i]
                  const percentage = ((value / total) * 100).toFixed(1)
                  
                  return {
                    text: `${label}: ${formatAmount(value)} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    fontColor: textColor,
                    hidden: false,
                    index: i
                  }
                })
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
    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#e6e9ff' : '#374151'
    const mutedColor = isDark ? '#9aa3b2' : '#6b7280'
    const gridColor = isDark ? 'rgba(154, 163, 178, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    
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
              color: mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: gridColor
            }
          }
        },
        plugins: {
          legend: {
            display: data.datasets && data.datasets.length > 1,
            labels: {
              color: textColor,
              font: {
                size: 12,
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
    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#e6e9ff' : '#374151'
    const mutedColor = isDark ? '#9aa3b2' : '#6b7280'
    const gridColor = isDark ? 'rgba(154, 163, 178, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    
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
              color: mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: gridColor
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: {
                size: 12,
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
    const isDark = document.documentElement.classList.contains('dark')
    const textColor = isDark ? '#e6e9ff' : '#374151'
    const mutedColor = isDark ? '#9aa3b2' : '#6b7280'
    const gridColor = isDark ? 'rgba(154, 163, 178, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    const tooltipBg = isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    
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
              color: mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: gridColor
            },
            pointLabels: {
              color: textColor,
              font: {
                size: 11,
                family: 'Inter, ui-sans-serif'
              }
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              }
            }
          },
          tooltip: {
            titleColor: textColor,
            bodyColor: textColor,
            backgroundColor: tooltipBg,
            borderColor: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1
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