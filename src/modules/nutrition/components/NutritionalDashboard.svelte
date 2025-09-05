<script>
  import { onMount } from 'svelte';
  import { NUTRITIONAL_REQUIREMENTS } from '../codex/codexNutritionalRequirements.js';
  
  export let mealData = {};
  export let person = 'ioan'; // or 'nico'
  
  let dzrReport = null;
  let showDetailed = false;
  
  $: if (mealData && mealData.nutrition) {
    dzrReport = NUTRITIONAL_REQUIREMENTS.calculateDZR(mealData.nutrition, person);
  }
  
  function getColorForDZR(percent) {
    if (percent < 50) return '#ef4444'; // red
    if (percent < 70) return '#f97316'; // orange
    if (percent < 90) return '#eab308'; // yellow
    if (percent <= 110) return '#22c55e'; // green
    if (percent <= 150) return '#3b82f6'; // blue
    return '#9333ea'; // purple for excess
  }
  
  function formatNutrientName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
</script>

{#if dzrReport}
<div class="nutritional-dashboard">
  <div class="dashboard-header">
    <h2>📊 Analiză Nutrițională Completă - {person === 'ioan' ? 'Ioan' : 'Nico'}</h2>
    <button class="toggle-btn" on:click={() => showDetailed = !showDetailed}>
      {showDetailed ? 'Arată Rezumat' : 'Arată Detaliat'}
    </button>
  </div>
  
  <!-- ALERTS SECTION -->
  {#if dzrReport.alerts.critical_deficits.length > 0}
  <div class="alert critical">
    <h3>🔴 Deficite Critice (Sub 50% DZR)</h3>
    {#each dzrReport.alerts.critical_deficits as deficit}
      <div class="alert-item">
        <strong>{formatNutrientName(deficit.nutrient)}:</strong> {deficit.dzr}% DZR - {deficit.action}
      </div>
    {/each}
  </div>
  {/if}
  
  {#if dzrReport.alerts.moderate_deficits.length > 0}
  <div class="alert moderate">
    <h3>🟠 Deficite Moderate (50-70% DZR)</h3>
    {#each dzrReport.alerts.moderate_deficits as deficit}
      <div class="alert-item">
        <strong>{formatNutrientName(deficit.nutrient)}:</strong> {deficit.dzr}% DZR - {deficit.action}
      </div>
    {/each}
  </div>
  {/if}
  
  <!-- MACROS OVERVIEW -->
  <div class="section">
    <h3>🥩 Macronutrienți & Performanță DZR</h3>
    <div class="macro-grid">
      <div class="macro-card">
        <div class="macro-header">Proteine</div>
        <div class="progress-bar">
          <div class="progress-fill" 
               style="width: {Math.min(dzrReport.macros.protein.dzr_percent, 200)}%; 
                      background: {getColorForDZR(dzrReport.macros.protein.dzr_percent)}">
          </div>
        </div>
        <div class="macro-details">
          <span>{dzrReport.macros.protein.actual.toFixed(1)}g / {dzrReport.macros.protein.target}g</span>
          <span class="dzr-percent">{dzrReport.macros.protein.dzr_percent.toFixed(1)}% DZR</span>
        </div>
        <div class="status">{dzrReport.macros.protein.status}</div>
      </div>
      
      <div class="macro-card">
        <div class="macro-header">Carbohidrați</div>
        <div class="progress-bar">
          <div class="progress-fill" 
               style="width: {Math.min(dzrReport.macros.carbs.dzr_percent, 200)}%; 
                      background: {getColorForDZR(dzrReport.macros.carbs.dzr_percent)}">
          </div>
        </div>
        <div class="macro-details">
          <span>{dzrReport.macros.carbs.actual.toFixed(1)}g / {dzrReport.macros.carbs.target}g</span>
          <span class="dzr-percent">{dzrReport.macros.carbs.dzr_percent.toFixed(1)}% DZR</span>
        </div>
        <div class="status">{dzrReport.macros.carbs.status || '🟢 Tracking'}</div>
        
        <!-- Fiber Sub-tracking -->
        <div class="fiber-subtrack">
          <div class="fiber-label">Fibre: {dzrReport.macros.carbs.fiber.actual.toFixed(1)}g / {dzrReport.macros.carbs.fiber.target}g</div>
          <div class="mini-progress">
            <div class="mini-fill" 
                 style="width: {Math.min(dzrReport.macros.carbs.fiber.dzr_percent, 150)}%; 
                        background: {getColorForDZR(dzrReport.macros.carbs.fiber.dzr_percent)}">
            </div>
          </div>
          <span class="fiber-percent">{dzrReport.macros.carbs.fiber.dzr_percent.toFixed(0)}%</span>
        </div>
      </div>
      
      <div class="macro-card">
        <div class="macro-header">Grăsimi</div>
        <div class="progress-bar">
          <div class="progress-fill" 
               style="width: {Math.min(dzrReport.macros.fats.dzr_percent, 200)}%; 
                      background: {getColorForDZR(dzrReport.macros.fats.dzr_percent)}">
          </div>
        </div>
        <div class="macro-details">
          <span>{dzrReport.macros.fats.actual.toFixed(1)}g / {dzrReport.macros.fats.target}g</span>
          <span class="dzr-percent">{dzrReport.macros.fats.dzr_percent.toFixed(1)}% DZR</span>
        </div>
        <div class="status">{dzrReport.macros.fats.status || '🟢 Tracking'}</div>
        
        <!-- Omega-3 Sub-tracking -->
        <div class="omega3-subtrack">
          <div class="omega3-label">Omega-3: {dzrReport.macros.fats.omega3.actual.toFixed(2)}g / {dzrReport.macros.fats.omega3.target}g</div>
          <div class="mini-progress">
            <div class="mini-fill" 
                 style="width: {Math.min(dzrReport.macros.fats.omega3.dzr_percent, 150)}%; 
                        background: {getColorForDZR(dzrReport.macros.fats.omega3.dzr_percent)}">
            </div>
          </div>
          <span class="omega3-percent">{dzrReport.macros.fats.omega3.dzr_percent.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- CRITICAL RATIOS -->
  <div class="section">
    <h3>⚖️ Rapoarte Critice Nutriționale</h3>
    <div class="ratios-grid">
      <div class="ratio-card {dzrReport.ratios.omega6_omega3.status.includes('🟢') ? 'optimal' : dzrReport.ratios.omega6_omega3.status.includes('⚠️') ? 'warning' : 'acceptable'}">
        <div class="ratio-name">Omega-6 : Omega-3</div>
        <div class="ratio-value">
          {dzrReport.ratios.omega6_omega3.actual.toFixed(1)} : 1
          <span class="target">(Țintă: {dzrReport.ratios.omega6_omega3.target} : 1)</span>
        </div>
        <div class="ratio-status">{dzrReport.ratios.omega6_omega3.status}</div>
        <div class="ratio-note">
          {#if dzrReport.ratios.omega6_omega3.actual > 10}
            ⚠️ Prea inflamator! Adaugă pește gras sau semințe de in.
          {:else if dzrReport.ratios.omega6_omega3.actual < 2}
            💡 Excelent! Continuă cu surse Omega-3.
          {/if}
        </div>
      </div>
      
      <div class="ratio-card {dzrReport.ratios.calcium_magnesium.status.includes('🟢') ? 'optimal' : dzrReport.ratios.calcium_magnesium.status.includes('⚠️') ? 'warning' : 'acceptable'}">
        <div class="ratio-name">Calciu : Magneziu</div>
        <div class="ratio-value">
          {dzrReport.ratios.calcium_magnesium.actual.toFixed(1)} : 1
          <span class="target">(Țintă: 2 : 1)</span>
        </div>
        <div class="ratio-status">{dzrReport.ratios.calcium_magnesium.status}</div>
        <div class="ratio-note">
          {#if dzrReport.ratios.calcium_magnesium.actual > 3.5}
            ⚠️ Prea mult Ca vs Mg! Blochează absorbția.
          {:else if person === 'nico' && dzrReport.ratios.calcium_magnesium.actual > 3}
            💊 Nico: Crește Mg pentru mușchi și oase.
          {/if}
        </div>
      </div>
      
      <div class="ratio-card {dzrReport.ratios.sodium_potassium.status.includes('🟢') ? 'optimal' : dzrReport.ratios.sodium_potassium.status.includes('⚠️') ? 'warning' : 'acceptable'}">
        <div class="ratio-name">Sodiu : Potasiu</div>
        <div class="ratio-value">
          {dzrReport.ratios.sodium_potassium.actual.toFixed(2)} : 1
          <span class="target">(Țintă: 0.5 : 1)</span>
        </div>
        <div class="ratio-status">{dzrReport.ratios.sodium_potassium.status}</div>
        <div class="ratio-note">
          {#if dzrReport.ratios.sodium_potassium.actual > 1}
            ⚠️ Prea mult sodiu! Crește legumele pentru potasiu.
          {:else if dzrReport.ratios.sodium_potassium.actual < 0.3}
            💡 Excellent pentru tensiune!
          {/if}
        </div>
      </div>
      
      <div class="ratio-card">
        <div class="ratio-name">Protein : Energie</div>
        <div class="ratio-value">
          {dzrReport.ratios.protein_energy.actual.toFixed(1)}%
          <span class="target">(Țintă: {dzrReport.ratios.protein_energy.target}%)</span>
        </div>
        <div class="ratio-status">{dzrReport.ratios.protein_energy.status}</div>
        <div class="ratio-note">
          {#if person === 'nico' && dzrReport.ratios.protein_energy.actual < 18}
            💪 Nico: Crește proteina pentru menținerea musculară.
          {:else if person === 'ioan' && dzrReport.ratios.protein_energy.actual < 16}
            🏋️ Ioan: Mai multă proteină pentru vârsta de 46 ani.
          {/if}
        </div>
      </div>
    </div>
  </div>
  
  <!-- DETAILED VIEW -->
  {#if showDetailed}
  <div class="detailed-section">
    <h3>💊 Vitamine - DZR% Detaliat</h3>
    <div class="nutrients-table">
      {#each Object.entries(dzrReport.vitamins) as [vitamin, data]}
      <div class="nutrient-row">
        <span class="nutrient-name">{formatNutrientName(vitamin)}</span>
        <span class="nutrient-value">{data.actual.toFixed(1)} / {data.target} {data.unit}</span>
        <div class="mini-progress">
          <div class="mini-fill" 
               style="width: {Math.min(data.dzr_percent, 200)}%; 
                      background: {getColorForDZR(data.dzr_percent)}">
          </div>
        </div>
        <span class="dzr-badge" style="color: {getColorForDZR(data.dzr_percent)}">
          {data.dzr_percent.toFixed(0)}%
        </span>
        <span class="nutrient-status">{data.status}</span>
      </div>
      {/each}
    </div>
    
    <h3>🪨 Minerale - DZR% Detaliat</h3>
    <div class="nutrients-table">
      {#each Object.entries(dzrReport.minerals) as [mineral, data]}
      <div class="nutrient-row">
        <span class="nutrient-name">{formatNutrientName(mineral)}</span>
        <span class="nutrient-value">{data.actual.toFixed(1)} / {data.target} {data.unit}</span>
        <div class="mini-progress">
          <div class="mini-fill" 
               style="width: {Math.min(data.dzr_percent, 200)}%; 
                      background: {getColorForDZR(data.dzr_percent)}">
          </div>
        </div>
        <span class="dzr-badge" style="color: {getColorForDZR(data.dzr_percent)}">
          {data.dzr_percent.toFixed(0)}%
        </span>
        <span class="nutrient-status">{data.status}</span>
      </div>
      {/each}
    </div>
  </div>
  {/if}
  
  <!-- PERSONALIZED RECOMMENDATIONS -->
  <div class="recommendations">
    <h3>📋 Recomandări Personalizate pentru {person === 'ioan' ? 'Ioan' : 'Nico'}</h3>
    <div class="recommendations-grid">
      {#if dzrReport.alerts.critical_deficits.length > 0}
        <div class="rec-urgent">
          🚨 <strong>URGENT:</strong> Deficite critice în {dzrReport.alerts.critical_deficits.map(d => formatNutrientName(d.nutrient)).join(', ')}
        </div>
      {/if}
      
      {#if dzrReport.ratios.omega6_omega3.actual > 10}
        <div class="rec-warning">
          ⚠️ <strong>Inflamație:</strong> Raport Omega-6:3 = {dzrReport.ratios.omega6_omega3.actual.toFixed(1)}:1 (țintă: 3:1)
          <br>→ Adaugă: somon, sardine, semințe de in, nuci
        </div>
      {/if}
      
      {#if person === 'nico' && dzrReport.ratios.calcium_magnesium.actual > 3.5}
        <div class="rec-nico">
          🦴 <strong>Nico - Oase:</strong> Ca:Mg = {dzrReport.ratios.calcium_magnesium.actual.toFixed(1)}:1 (prea mult calciu)
          <br>→ Adaugă: spanac, migdale, semințe dovleac pentru magneziu
        </div>
      {/if}
      
      {#if dzrReport.macros.fats.omega3.dzr_percent < 70}
        <div class="rec-omega3">
          🐟 <strong>Omega-3:</strong> Doar {dzrReport.macros.fats.omega3.dzr_percent.toFixed(0)}% din țintă
          <br>→ Adaugă: pește gras 2x/săptămână sau supliment calitativ
        </div>
      {/if}
      
      {#if dzrReport.macros.carbs.fiber.dzr_percent < 70}
        <div class="rec-fiber">
          🌱 <strong>Fibre:</strong> Doar {dzrReport.macros.carbs.fiber.dzr_percent.toFixed(0)}% din țintă
          <br>→ Adaugă: legume crucifere, boabe întregi, leguminoase
        </div>
      {/if}
      
      {#if dzrReport.alerts.optimal.length > 15}
        <div class="rec-excellent">
          ⭐ <strong>Excelent!</strong> {dzrReport.alerts.optimal.length} nutrienți în zona optimală (90-110% DZR)
        </div>
      {/if}
    </div>
  </div>
  
  <!-- ACADEMIC SOURCES FOOTER -->
  <div class="sources-footer">
    <details>
      <summary>📚 Surse Academice (Click pentru detalii)</summary>
      <div class="sources-content">
        <p><strong>Calculele DZR se bazează pe:</strong></p>
        <ul>
          <li>WHO/FAO Energy Requirements (PMID: 15941875)</li>
          <li>Institute of Medicine Dietary Reference Intakes</li>
          <li>EFSA Panel on Dietetic Products (PMID: 21040622)</li>
          <li>Biomedicine & Pharmacotherapy - Omega ratios (PMID: 12442909)</li>
          <li>American Heart Association Guidelines (PMID: 28620111)</li>
        </ul>
        <p><em>Toate rapoartele și recomandările sunt validate științific.</em></p>
      </div>
    </details>
  </div>
</div>

<style>
  .nutritional-dashboard {
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .dashboard-header h2 {
    margin: 0;
    color: #1f2937;
    font-size: 1.5rem;
  }
  
  .toggle-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .toggle-btn:hover {
    background: #2563eb;
  }
  
  .alert {
    padding: 15px;
    margin: 20px 0;
    border-radius: 8px;
    border-left: 4px solid;
  }
  
  .alert.critical {
    background: #fee2e2;
    border-left-color: #ef4444;
  }
  
  .alert.moderate {
    background: #fed7aa;
    border-left-color: #f97316;
  }
  
  .alert h3 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
  }
  
  .alert-item {
    margin: 8px 0;
    padding: 8px;
    background: rgba(255,255,255,0.7);
    border-radius: 4px;
  }
  
  .section {
    margin: 30px 0;
  }
  
  .section h3 {
    margin-bottom: 15px;
    color: #374151;
    font-size: 1.2rem;
  }
  
  .macro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .macro-card {
    background: #f9fafb;
    border-radius: 12px;
    padding: 20px;
    border: 2px solid #e5e7eb;
    transition: transform 0.2s;
  }
  
  .macro-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  
  .macro-header {
    font-weight: bold;
    font-size: 1.1rem;
    margin-bottom: 12px;
    color: #1f2937;
  }
  
  .progress-bar {
    height: 24px;
    background: #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    margin: 10px 0;
  }
  
  .progress-fill {
    height: 100%;
    transition: width 0.8s ease;
    border-radius: 12px;
  }
  
  .macro-details {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    font-size: 0.9rem;
  }
  
  .dzr-percent {
    font-weight: bold;
    color: #1f2937;
  }
  
  .status {
    text-align: center;
    font-weight: 500;
    margin-top: 8px;
    padding: 4px;
    border-radius: 4px;
    background: rgba(255,255,255,0.8);
  }
  
  .fiber-subtrack, .omega3-subtrack {
    margin-top: 12px;
    padding: 8px;
    background: rgba(255,255,255,0.6);
    border-radius: 6px;
    border-left: 3px solid #6366f1;
  }
  
  .fiber-label, .omega3-label {
    font-size: 0.85rem;
    color: #4b5563;
    margin-bottom: 4px;
  }
  
  .mini-progress {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin: 4px 0;
  }
  
  .mini-fill {
    height: 100%;
    transition: width 0.6s ease;
    border-radius: 4px;
  }
  
  .fiber-percent, .omega3-percent {
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .ratios-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .ratio-card {
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px solid #e5e7eb;
    text-align: center;
    transition: all 0.2s;
  }
  
  .ratio-card.optimal {
    border-color: #22c55e;
    background: #f0fdf4;
  }
  
  .ratio-card.warning {
    border-color: #ef4444;
    background: #fef2f2;
  }
  
  .ratio-card.acceptable {
    border-color: #eab308;
    background: #fffbeb;
  }
  
  .ratio-name {
    font-weight: bold;
    margin-bottom: 8px;
    color: #1f2937;
  }
  
  .ratio-value {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
  
  .target {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 4px;
  }
  
  .ratio-status {
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .ratio-note {
    font-size: 0.8rem;
    color: #4b5563;
    font-style: italic;
  }
  
  .detailed-section {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
  }
  
  .nutrients-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 25px;
  }
  
  .nutrient-row {
    display: grid;
    grid-template-columns: 150px 140px 150px 60px 120px;
    align-items: center;
    padding: 10px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    transition: background 0.2s;
  }
  
  .nutrient-row:hover {
    background: #f1f5f9;
  }
  
  .nutrient-name {
    font-weight: 500;
    color: #1f2937;
  }
  
  .nutrient-value {
    font-size: 0.9rem;
    color: #4b5563;
  }
  
  .dzr-badge {
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  .nutrient-status {
    font-size: 0.8rem;
  }
  
  .recommendations {
    margin-top: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px;
    border: 2px solid #0ea5e9;
  }
  
  .recommendations h3 {
    margin-bottom: 15px;
    color: #0c4a6e;
  }
  
  .recommendations-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .rec-urgent, .rec-warning, .rec-nico, .rec-omega3, .rec-fiber, .rec-excellent {
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid;
  }
  
  .rec-urgent {
    background: #fee2e2;
    border-left-color: #ef4444;
  }
  
  .rec-warning {
    background: #fed7aa;
    border-left-color: #f97316;
  }
  
  .rec-nico {
    background: #e0e7ff;
    border-left-color: #6366f1;
  }
  
  .rec-omega3 {
    background: #dbeafe;
    border-left-color: #3b82f6;
  }
  
  .rec-fiber {
    background: #d1fae5;
    border-left-color: #10b981;
  }
  
  .rec-excellent {
    background: #ecfdf5;
    border-left-color: #22c55e;
  }
  
  .sources-footer {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
  }
  
  .sources-footer summary {
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    padding: 5px;
  }
  
  .sources-content {
    margin-top: 15px;
    padding: 15px;
    background: white;
    border-radius: 6px;
    border-left: 3px solid #6366f1;
  }
  
  .sources-content ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  .sources-content li {
    margin: 5px 0;
    font-size: 0.9rem;
    color: #4b5563;
  }
  
  @media (max-width: 768px) {
    .nutrient-row {
      grid-template-columns: 120px 110px 100px 50px 100px;
      font-size: 0.85rem;
    }
    
    .macro-grid {
      grid-template-columns: 1fr;
    }
    
    .ratios-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

{:else}
<div class="loading-dashboard">
  <h3>📊 Așteptând date nutriționale...</h3>
  <p>Generează o rețetă pentru a vedea analiza DZR completă.</p>
</div>

<style>
  .loading-dashboard {
    padding: 40px;
    text-align: center;
    background: #f9fafb;
    border-radius: 12px;
    border: 2px dashed #d1d5db;
    color: #6b7280;
  }
</style>
{/if}