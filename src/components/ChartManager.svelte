<script>
  import { onMount, onDestroy } from 'svelte'
  import { Chart, registerables } from 'chart.js'
  
  Chart.register(...registerables)
  
  export let data = null
  export let chartType = 'pie'
  export let height = 400
  
  let chartCanvas
  let chartInstance = null
  let observer = null
  let updateTimeout = null
  let canvasContext = null
  
  // Theme color memoization
  let cachedThemeColors = null
  let lastTheme = null
  
  // Color palette
  const defaultColors = [
    '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#64748b', '#22c55e', '#fbbf24'
  ]
  
  onMount(() => {
    if (isValidData(data)) {
      createChart()
    }
    
    // Listen for dark mode changes only
    observer = new MutationObserver((mutations) => {
      let themeChanged = false
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark')
          if (lastTheme !== isDark) {
            themeChanged = true
            lastTheme = isDark
            cachedThemeColors = null // Invalidate cache
          }
        }
      })
      
      if (themeChanged && chartInstance) {
        debouncedChartUpdate()
      }
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  })
  
  onDestroy(() => {
    // Clean up chart instance
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
    
    // Clean up observer
    if (observer) {
      observer.disconnect()
      observer = null
    }
    
    // Clean up timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout)
      updateTimeout = null
    }
    
    // Clean up cached context
    canvasContext = null
    cachedThemeColors = null
  })
  
  // Data validation
  function isValidData(data) {
    if (!data) return false
    
    // Check if we have either labels+values or datasets
    const hasLabelsAndValues = data.labels?.length > 0 && data.values?.length > 0
    const hasDatasets = data.datasets?.length > 0 && 
                       data.datasets[0]?.data?.length > 0
    
    return hasLabelsAndValues || hasDatasets
  }
  
  // Security: Sanitize user input
  function sanitizeLabel(label) {
    if (typeof label !== 'string') return String(label)
    return label.replace(/[<>'"&]/g, (match) => {
      const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }
      return map[match]
    })
  }
  
  // Performance: Get canvas context with caching
  function getCanvasContext() {
    if (!canvasContext && chartCanvas) {
      canvasContext = chartCanvas.getContext('2d')
    }
    return canvasContext
  }
  
  // Performance: Debounced chart update
  function debouncedChartUpdate() {
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }
    updateTimeout = setTimeout(() => {
      if (chartCanvas && isValidData(data)) {
        createChart()
      }
    }, 50)
  }
  
  // Performance: Memoized theme colors
  function getThemeColors() {
    const isDark = document.documentElement.classList.contains('dark')
    
    if (lastTheme === isDark && cachedThemeColors) {
      return cachedThemeColors
    }
    
    const colors = {
      textColor: isDark ? '#e6e9ff' : '#374151',
      mutedColor: isDark ? '#9aa3b2' : '#6b7280',
      gridColor: isDark ? 'rgba(154, 163, 178, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      tooltipBg: isDark ? 'rgba(23, 26, 43, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? '#1a1a1a' : '#fff',
      tooltipBorder: isDark ? 'rgba(128, 184, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
    }
    
    lastTheme = isDark
    cachedThemeColors = colors
    return colors
  }

  function createChart() {
    if (!chartCanvas || !isValidData(data)) return
    
    // Destroy existing chart
    if (chartInstance) {
      chartInstance.destroy()
      chartInstance = null
    }
    
    const ctx = getCanvasContext()
    if (!ctx) return
    
    const config = getChartConfig()
    
    try {
      chartInstance = new Chart(ctx, config)
    } catch (error) {
      console.error('Error creating chart:', error)
    }
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
    const colors = getThemeColors()
    
    return {
      type: chartType === 'doughnut' ? 'doughnut' : 'pie',
      data: {
        labels: (data.labels || []).map(sanitizeLabel),
        datasets: data.datasets || [{
          data: data.values || [],
          backgroundColor: data.colors || defaultColors,
          borderWidth: 2,
          borderColor: colors.borderColor
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
              color: colors.textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              },
              generateLabels: function(chart) {
                const dataset = chart.data.datasets[0]
                if (!dataset || !dataset.data || dataset.data.length === 0) {
                  return []
                }
                
                const total = dataset.data.reduce((a, b) => (a || 0) + (b || 0), 0)
                if (total === 0) return []
                
                return chart.data.labels.map((label, i) => {
                  const value = dataset.data[i] || 0
                  const percentage = ((value / total) * 100).toFixed(1)
                  
                  return {
                    text: `${sanitizeLabel(label)}: ${formatAmount(value)} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    fontColor: colors.textColor,
                    hidden: false,
                    index: i
                  }
                })
              }
            }
          },
          tooltip: {
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => (a || 0) + (b || 0), 0)
                if (total === 0) return `${sanitizeLabel(context.label)}: ${formatAmount(context.parsed)}`
                
                const percentage = ((context.parsed / total) * 100).toFixed(1)
                return `${sanitizeLabel(context.label)}: ${formatAmount(context.parsed)} (${percentage}%)`
              }
            }
          }
        }
      }
    }
  }
  
  function getBarConfig() {
    const colors = getThemeColors()
    
    return {
      type: 'bar',
      data: {
        labels: (data.labels || []).map(sanitizeLabel),
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
              color: colors.mutedColor
            },
            grid: {
              color: colors.gridColor
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: colors.mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: colors.gridColor
            }
          }
        },
        plugins: {
          legend: {
            display: data.datasets && data.datasets.length > 1,
            labels: {
              color: colors.textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              }
            }
          },
          tooltip: {
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${sanitizeLabel(context.dataset.label) || ''}: ${formatAmount(context.parsed.y)}`
              }
            }
          }
        }
      }
    }
  }
  
  function getLineConfig() {
    const colors = getThemeColors()
    
    return {
      type: 'line',
      data: {
        labels: (data.labels || []).map(sanitizeLabel),
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
              color: colors.mutedColor
            },
            grid: {
              color: colors.gridColor
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: colors.mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: colors.gridColor
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: colors.textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              }
            }
          },
          tooltip: {
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${sanitizeLabel(context.dataset.label)}: ${formatAmount(context.parsed.y)}`
              }
            }
          }
        }
      }
    }
  }
  
  function getRadarConfig() {
    const colors = getThemeColors()
    
    return {
      type: 'radar',
      data: {
        labels: (data.labels || []).map(sanitizeLabel),
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
              color: colors.mutedColor,
              callback: function(value) {
                return formatAmount(value)
              }
            },
            grid: {
              color: colors.gridColor
            },
            pointLabels: {
              color: colors.textColor,
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
              color: colors.textColor,
              font: {
                size: 12,
                family: 'Inter, ui-sans-serif'
              }
            }
          },
          tooltip: {
            titleColor: colors.textColor,
            bodyColor: colors.textColor,
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
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
  
  // Recreate chart when data or type changes (optimized)
  $: if (chartInstance && isValidData(data)) {
    debouncedChartUpdate()
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