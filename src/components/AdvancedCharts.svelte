<script>
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  
  let predictiveChart, heatmapChart, radarChart;
  
  onMount(() => {
    createPredictiveChart();
    createHeatmapChart();
    createRadarChart();
  });
  
  function createPredictiveChart() {
    const ctx = document.getElementById('predictiveChart').getContext('2d');
    const historicalData = { 
      labels: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun'],
      values: [3200, 2800, 3500, 3100, 3300, 3400]
    };
    
    const trend = (historicalData.values[5] - historicalData.values[0]) / 5;
    const lastValue = historicalData.values[historicalData.values.length - 1];
    const predictions = [lastValue + trend, lastValue + trend*2, lastValue + trend*3];
    
    predictiveChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...historicalData.labels, 'Iul', 'Aug', 'Sep'],
        datasets: [
          {
            label: 'Cheltuieli Reale',
            data: [...historicalData.values, null, null, null],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
          },
          {
            label: 'Predicție',
            data: [...Array(5).fill(null), lastValue, ...predictions],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '📈 Predicție Cheltuieli (Trend Analysis)'
          }
        }
      }
    });
  }
  
  function createHeatmapChart() {
    const ctx = document.getElementById('heatmapChart').getContext('2d');
    const data = [];
    
    for (let week = 0; week < 5; week++) {
      for (let day = 0; day < 7; day++) {
        data.push({
          x: day,
          y: week,
          v: Math.floor(Math.random() * 500)
        });
      }
    }
    
    heatmapChart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Cheltuieli Zilnice',
          data: data,
          backgroundColor: (context) => {
            const value = context.raw.v;
            const alpha = Math.min(value / 500, 1);
            return `rgba(102, 126, 234, ${alpha})`;
          },
          pointRadius: 15
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '🗓️ Heatmap Cheltuieli (Ultimele 30 zile)'
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 6,
            ticks: {
              callback: (value) => ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'][value]
            }
          },
          y: {
            type: 'linear',
            min: 0,
            max: 4,
            ticks: {
              callback: (value) => `Săpt. ${5 - value}`
            }
          }
        }
      }
    });
  }
  
  function createRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Alimente', 'Transport', 'Utilități', 'Divertisment', 'Economii', 'Altele'],
        datasets: [
          {
            label: 'Buget Planificat',
            data: [800, 300, 500, 200, 1000, 400],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)'
          },
          {
            label: 'Cheltuieli Reale',
            data: [750, 420, 480, 150, 800, 350],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '🎯 Bugete vs Realitate'
          }
        }
      }
    });
  }
</script>

<div class="charts-grid">
  <div class="chart-container">
    <canvas id="predictiveChart"></canvas>
  </div>
  <div class="chart-container">
    <canvas id="heatmapChart"></canvas>
  </div>
  <div class="chart-container">
    <canvas id="radarChart"></canvas>
  </div>
</div>

<style>
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .chart-container {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  :global(html.dark) .chart-container {
    background: #2d2d2d;
  }
</style>