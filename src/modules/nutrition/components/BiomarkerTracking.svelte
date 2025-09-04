<script>
  import { onMount } from 'svelte';
  import biomarkerTracker from '../codex/biomarkerTracking.js';
  
  let currentValues = {};
  let analysis = {};
  let recommendations = [];
  let showAddForm = false;
  let selectedMarker = null;
  let chartData = null;
  
  const markers = [
    { id: 'hsCRP', name: 'hs-CRP', unit: 'mg/L', icon: '🔥' },
    { id: 'HbA1c', name: 'HbA1c', unit: '%', icon: '🩸' },
    { id: 'HOMAIR', name: 'HOMA-IR', unit: '', icon: '⚡' },
    { id: 'vitaminD', name: 'Vitamin D', unit: 'ng/ml', icon: '☀️' },
    { id: 'omega3Index', name: 'Omega-3 Index', unit: '%', icon: '🐟' },
    { id: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', icon: '💧' },
    { id: 'HDL', name: 'HDL', unit: 'mg/dL', icon: '✅' },
    { id: 'LDL', name: 'LDL', unit: 'mg/dL', icon: '⚠️' },
    { id: 'systolicBP', name: 'Blood Pressure', unit: 'mmHg', icon: '❤️' },
    { id: 'weight', name: 'Weight', unit: 'kg', icon: '⚖️' }
  ];
  
  onMount(() => {
    loadData();
  });
  
  function loadData() {
    analysis = biomarkerTracker.analyzeProgress();
    recommendations = biomarkerTracker.getRecommendations(analysis);
    updateChartData();
  }
  
  function submitBiomarkers() {
    const entry = {};
    let hasData = false;
    
    markers.forEach(marker => {
      if (currentValues[marker.id]) {
        entry[marker.id] = parseFloat(currentValues[marker.id]);
        hasData = true;
      }
    });
    
    if (hasData) {
      biomarkerTracker.addEntry(entry);
      currentValues = {};
      showAddForm = false;
      loadData();
    }
  }
  
  function getStatusColor(status) {
    switch(status) {
      case 'optimal': return '#10b981';
      case 'good': return '#fbbf24';
      case 'needs_improvement': return '#ef4444';
      default: return '#6b7280';
    }
  }
  
  function getTrendIcon(trend) {
    switch(trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  }
  
  function selectMarker(markerId) {
    selectedMarker = markerId;
    updateChartData();
  }
  
  function updateChartData() {
    if (!selectedMarker) return;
    
    const entries = biomarkerTracker.data.entries
      .filter(e => e[selectedMarker])
      .map(e => ({
        date: new Date(e.date).toLocaleDateString(),
        value: e[selectedMarker]
      }))
      .slice(-10);
    
    chartData = entries;
  }
  
  function getTarget(markerId) {
    return biomarkerTracker.data.targets[markerId];
  }
</script>

<div class="biomarker-tracking">
  <div class="tracking-header">
    <h2>🔬 Biomarker Tracking System</h2>
    <p class="subtitle">Evidence-based health optimization</p>
    <button 
      class="add-btn"
      on:click={() => showAddForm = !showAddForm}>
      {showAddForm ? '✖️ Cancel' : '➕ Add New Entry'}
    </button>
  </div>

  {#if showAddForm}
    <div class="add-form">
      <h3>Enter Your Latest Test Results</h3>
      <p class="form-note">Add only the markers you have tested</p>
      
      <div class="markers-grid">
        {#each markers as marker}
          <div class="marker-input">
            <label for={marker.id}>
              <span class="marker-icon">{marker.icon}</span>
              {marker.name}
              <span class="unit">({marker.unit})</span>
            </label>
            <input
              type="number"
              step="0.01"
              id={marker.id}
              bind:value={currentValues[marker.id]}
              placeholder="Enter value"
            />
            {#if getTarget(marker.id)}
              <span class="target">Target: {getTarget(marker.id).optimal}</span>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="form-actions">
        <button class="submit-btn" on:click={submitBiomarkers}>
          💾 Save Entry
        </button>
      </div>
    </div>
  {/if}

  {#if Object.keys(analysis).length > 0}
    <div class="analysis-section">
      <h3>📊 Current Analysis</h3>
      
      <div class="markers-overview">
        {#each Object.entries(analysis) as [markerId, data]}
          {@const marker = markers.find(m => m.id === markerId)}
          <div 
            class="marker-card"
            class:selected={selectedMarker === markerId}
            on:click={() => selectMarker(markerId)}>
            
            <div class="marker-header">
              <span class="marker-icon">{marker.icon}</span>
              <span class="marker-name">{marker.name}</span>
              <span class="trend">{getTrendIcon(data.trend)}</span>
            </div>
            
            <div class="marker-value">
              <span class="current">{data.latest.toFixed(2)}</span>
              <span class="unit">{marker.unit}</span>
            </div>
            
            <div class="marker-status">
              <div 
                class="status-bar"
                style="background-color: {getStatusColor(data.status)}">
                {data.status.replace('_', ' ')}
              </div>
            </div>
            
            <div class="marker-progress">
              {#if data.improvement !== 0}
                <span class="improvement"
                  class:positive={data.improvement < 0 && !['HDL', 'omega3Index', 'vitaminD'].includes(markerId)}
                  class:negative={data.improvement > 0 && !['HDL', 'omega3Index', 'vitaminD'].includes(markerId)}>
                  {data.improvement > 0 ? '+' : ''}{data.improvement.toFixed(1)}%
                </span>
              {/if}
              <span class="target-info">
                Target: {data.target || 'tracking'}
              </span>
            </div>
            
            <div class="reference">
              PMID: {getTarget(markerId).pmid}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if selectedMarker && chartData}
    <div class="chart-section">
      <h3>📈 Trend for {markers.find(m => m.id === selectedMarker).name}</h3>
      <div class="simple-chart">
        <div class="chart-grid">
          {#each chartData as point, i}
            <div class="chart-point" style="--index: {i}; --value: {point.value}">
              <div class="point-dot"></div>
              <div class="point-label">{point.value}</div>
              <div class="point-date">{point.date}</div>
            </div>
          {/each}
        </div>
        {#if getTarget(selectedMarker)}
          <div class="target-line" style="--target: {getTarget(selectedMarker).target}">
            Target: {getTarget(selectedMarker).target}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if recommendations.length > 0}
    <div class="recommendations-section">
      <h3>🎯 Priority Recommendations</h3>
      <div class="recommendations">
        {#each recommendations as rec}
          <div class="recommendation-card priority-{rec.priority.toLowerCase()}">
            <div class="rec-header">
              <span class="priority-badge">{rec.priority}</span>
              <span class="rec-marker">Improve {rec.marker}</span>
            </div>
            <p class="rec-action">{rec.action}</p>
            <div class="rec-evidence">
              Evidence: PMID {rec.pmid}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="evidence-footer">
    <h4>📚 Scientific References</h4>
    <div class="references-grid">
      <div class="ref-item">
        <strong>hs-CRP optimal range:</strong> Ridker et al., NEJM 2020 (PMID: 32706533)
      </div>
      <div class="ref-item">
        <strong>HbA1c targets:</strong> ADA Guidelines 2023 (PMID: 32333286)
      </div>
      <div class="ref-item">
        <strong>HOMA-IR calculation:</strong> Matthews et al., Diabetologia (PMID: 28768170)
      </div>
      <div class="ref-item">
        <strong>Omega-3 Index:</strong> Harris & Von Schacky, Prev Med (PMID: 30103329)
      </div>
    </div>
  </div>
</div>

<style>
  .biomarker-tracking {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .tracking-header {
    text-align: center;
    margin-bottom: 30px;
    padding: 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    position: relative;
  }

  .subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 5px 0 15px;
  }

  .add-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid white;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .add-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }

  .add-form {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .form-note {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .markers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }

  .marker-input {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .marker-input label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
  }

  .marker-icon {
    font-size: 18px;
  }

  .unit {
    color: #6b7280;
    font-size: 12px;
  }

  .marker-input input {
    padding: 10px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s;
  }

  .marker-input input:focus {
    outline: none;
    border-color: #667eea;
  }

  .target {
    font-size: 11px;
    color: #6b7280;
    font-style: italic;
  }

  .form-actions {
    display: flex;
    justify-content: center;
    margin-top: 25px;
  }

  .submit-btn {
    padding: 12px 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  }

  .analysis-section {
    margin-bottom: 40px;
  }

  .markers-overview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .marker-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .marker-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }

  .marker-card.selected {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .marker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .marker-name {
    font-weight: 600;
    font-size: 14px;
    flex: 1;
    margin-left: 8px;
  }

  .trend {
    font-size: 16px;
  }

  .marker-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 12px;
  }

  .current {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
  }

  .marker-status {
    margin-bottom: 10px;
  }

  .status-bar {
    padding: 4px 8px;
    border-radius: 12px;
    color: white;
    font-size: 11px;
    font-weight: 600;
    text-align: center;
    text-transform: uppercase;
  }

  .marker-progress {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .improvement {
    font-weight: 600;
  }

  .improvement.positive {
    color: #10b981;
  }

  .improvement.negative {
    color: #ef4444;
  }

  .target-info {
    color: #6b7280;
  }

  .reference {
    font-size: 10px;
    color: #9ca3af;
    font-style: italic;
    margin-top: 8px;
  }

  .chart-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .simple-chart {
    position: relative;
    height: 300px;
    margin-top: 30px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
  }

  .chart-grid {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 100%;
  }

  .chart-point {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
    height: 100%;
    justify-content: flex-end;
  }

  .point-dot {
    width: 12px;
    height: 12px;
    background: #667eea;
    border-radius: 50%;
    position: absolute;
    bottom: calc(var(--value) * 2px);
  }

  .point-label {
    font-size: 12px;
    font-weight: 600;
    position: absolute;
    bottom: calc(var(--value) * 2px + 20px);
  }

  .point-date {
    font-size: 10px;
    color: #6b7280;
    transform: rotate(-45deg);
    margin-top: 20px;
  }

  .target-line {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(var(--target) * 2px);
    height: 2px;
    background: #ef4444;
    opacity: 0.5;
  }

  .recommendations-section {
    margin-bottom: 40px;
  }

  .recommendations {
    display: grid;
    gap: 20px;
    margin-top: 20px;
  }

  .recommendation-card {
    background: white;
    border-left: 4px solid;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .recommendation-card.priority-high {
    border-color: #ef4444;
  }

  .recommendation-card.priority-medium {
    border-color: #fbbf24;
  }

  .rec-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .priority-badge {
    padding: 4px 12px;
    background: #f3f4f6;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .rec-marker {
    font-weight: 600;
  }

  .rec-action {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 10px;
  }

  .rec-evidence {
    font-size: 11px;
    color: #9ca3af;
    font-style: italic;
  }

  .evidence-footer {
    background: #f9fafb;
    border-radius: 12px;
    padding: 25px;
    margin-top: 40px;
  }

  .references-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
    margin-top: 15px;
  }

  .ref-item {
    font-size: 12px;
    color: #6b7280;
    padding: 10px;
    background: white;
    border-radius: 6px;
  }

  .ref-item strong {
    color: #374151;
  }

  @media (max-width: 768px) {
    .markers-overview {
      grid-template-columns: 1fr;
    }
    
    .markers-grid {
      grid-template-columns: 1fr;
    }
  }
</style>