<!--
CODEX N-OMAD v3.0 - Recipe Display Component
Fixed Windows-style layout, consistent format
Always same structure regardless of content
-->

<script>
    import { createEventDispatcher } from 'svelte';
    import { ProfileEngine, CODEX_OUTPUT_FORMAT } from './CodexCore.js';
    import { CookingMethodIntegration } from './CookingMethods.js';
    
    export let recipeData = null;
    export let nutritionAnalysis = null;
    export let profile = "ioan";
    export let showSteps = true;
    export let showNutrition = true;
    export let compactMode = false;

    const dispatch = createEventDispatcher();

    // Fixed window dimensions for consistency
    const WINDOW_WIDTH = "100%";
    const WINDOW_HEIGHT = compactMode ? "600px" : "800px";
    
    // Color scheme - Windows inspired
    const COLORS = {
        primary: "#0078d4",
        secondary: "#106ebe", 
        success: "#107c10",
        warning: "#ff8c00",
        error: "#d13438",
        background: "#f5f5f5",
        surface: "#ffffff",
        border: "#d1d1d1",
        text: "#323130",
        textSecondary: "#605e5c"
    };

    $: currentProfile = ProfileEngine.profiles[profile] || ProfileEngine.profiles.ioan;
    $: currentPhase = ProfileEngine.getCurrentPhase(currentProfile);
    $: dri = ProfileEngine.calculateDRI(currentProfile);

    function handleRecipeGenerate() {
        dispatch('generate-recipe', { profile });
    }

    function handleAnalyzeNutrition() {
        dispatch('analyze-nutrition', { profile });
    }

    function getNutrientColor(percent) {
        if (percent >= 100) return COLORS.success;
        if (percent >= 80) return COLORS.primary; 
        if (percent >= 50) return COLORS.warning;
        return COLORS.error;
    }

    function formatTime(minutes) {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    }

    function getDeficiencyIcon(severity) {
        return severity === "critical" ? "🔴" : "🟡";
    }
</script>

<div class="recipe-display-window" style="width: {WINDOW_WIDTH}; height: {WINDOW_HEIGHT};">
    <!-- Fixed Header Section -->
    <div class="window-header">
        <div class="header-content">
            <div class="title-section">
                <h2 class="window-title">
                    🧬 CODEX N-OMAD v3.0 - {currentProfile.name}
                </h2>
                <div class="subtitle">
                    Phase: <span class="phase-badge {currentPhase}">{currentPhase.toUpperCase()}</span> | 
                    Window: <span class="meal-window">{currentProfile.meal_window}</span>
                </div>
            </div>
            <div class="header-actions">
                <button class="action-btn generate" on:click={handleRecipeGenerate}>
                    🔄 Generate Recipe  
                </button>
                <button class="action-btn analyze" on:click={handleAnalyzeNutrition}>
                    📊 Analyze
                </button>
            </div>
        </div>
    </div>

    <!-- Fixed Content Area - Always Same Layout -->
    <div class="window-content">
        <!-- Left Panel - Recipe Steps (Fixed Width) -->
        <div class="left-panel">
            <div class="panel-header">
                <h3>📋 Recipe Generation Steps</h3>
                <div class="step-counter">
                    {#if recipeData?.steps}
                        {recipeData.steps.filter(s => s.completed).length} / {recipeData.steps.length}
                    {:else}
                        0 / 10
                    {/if}
                </div>
            </div>
            
            <div class="steps-container">
                {#if recipeData?.steps && showSteps}
                    {#each recipeData.steps as step, index}
                        <div class="step-item" class:completed={step.completed} class:active={step.active}>
                            <div class="step-number">{step.step}</div>
                            <div class="step-content">
                                <div class="step-title">{step.name}</div>
                                <div class="step-action">{step.action}</div>
                                <div class="step-details">{step.details}</div>
                                <div class="step-duration">⏱ {step.duration}</div>
                            </div>
                        </div>
                    {/each}
                {:else}
                    <div class="placeholder-steps">
                        {#each Array(10) as _, i}
                            <div class="step-item placeholder">
                                <div class="step-number">{i + 1}</div>
                                <div class="step-content">
                                    <div class="step-title">Step {i + 1}</div>
                                    <div class="step-action">Ready to generate...</div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <!-- Right Panel - Nutrition Analysis (Fixed Width) -->
        <div class="right-panel">
            <div class="panel-header">
                <h3>📊 Nutritional Analysis</h3>
                <div class="evidence-badge">
                    {nutritionAnalysis?.evidenceLevel || "A+ (PMID verified)"}
                </div>
            </div>

            <!-- Fixed Macros Section -->
            <div class="macros-section">
                <h4>Macronutrients</h4>
                <div class="macro-grid">
                    {#if nutritionAnalysis?.nutritionalAnalysis?.macros}
                        {#each Object.entries(nutritionAnalysis.nutritionalAnalysis.macros) as [nutrient, data]}
                            <div class="macro-item">
                                <div class="macro-name">{nutrient.toUpperCase()}</div>
                                <div class="macro-values">
                                    <span class="current">{data.value || 0}</span> / 
                                    <span class="target">{data.dri || 0}</span>
                                </div>
                                <div class="progress-bar">
                                    <div 
                                        class="progress-fill" 
                                        style="width: {Math.min((data.percent || 0), 100)}%; background-color: {getNutrientColor(data.percent || 0)}"
                                    ></div>
                                </div>
                                <div class="percentage" style="color: {getNutrientColor(data.percent || 0)}">
                                    {data.percent || 0}%
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="placeholder-macros">
                            {#each ["calories", "protein", "carbs", "fat"] as macro}
                                <div class="macro-item placeholder">
                                    <div class="macro-name">{macro.toUpperCase()}</div>
                                    <div class="macro-values">0 / {dri[macro] || 0}</div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: 0%"></div>
                                    </div>
                                    <div class="percentage">0%</div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Fixed Micros Section -->
            <div class="micros-section">
                <h4>Key Micronutrients</h4>
                <div class="micro-grid">
                    {#if nutritionAnalysis?.nutritionalAnalysis?.micros}
                        {#each Object.entries(nutritionAnalysis.nutritionalAnalysis.micros) as [nutrient, data]}
                            <div class="micro-item">
                                <div class="micro-name">{nutrient.replace('_', ' ').toUpperCase()}</div>
                                <div class="micro-bar">
                                    <div 
                                        class="micro-fill" 
                                        style="width: {Math.min((data.percent || 0), 100)}%; background-color: {getNutrientColor(data.percent || 0)}"
                                    ></div>
                                    <span class="micro-text">{data.percent || 0}%</span>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="placeholder-micros">
                            {#each ["vitamin_d", "vitamin_b12", "iron", "calcium", "magnesium", "omega3"] as micro}
                                <div class="micro-item placeholder">
                                    <div class="micro-name">{micro.replace('_', ' ').toUpperCase()}</div>
                                    <div class="micro-bar">
                                        <div class="micro-fill" style="width: 0%"></div>
                                        <span class="micro-text">0%</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Fixed Deficiencies Section -->
            <div class="deficiencies-section">
                <h4>🔍 Deficiencies & Suggestions</h4>
                <div class="alerts-container">
                    {#if nutritionAnalysis?.deficiencies?.length > 0}
                        {#each nutritionAnalysis.deficiencies as deficiency}
                            <div class="deficiency-alert {deficiency.severity}">
                                {getDeficiencyIcon(deficiency.severity)} 
                                <strong>{deficiency.nutrient.toUpperCase()}</strong>: {deficiency.percent}%
                            </div>
                        {/each}
                    {:else}
                        <div class="no-deficiencies">✅ No critical deficiencies detected</div>
                    {/if}
                </div>

                <div class="suggestions-container">
                    {#if nutritionAnalysis?.suggestions?.length > 0}
                        {#each nutritionAnalysis.suggestions as suggestion}
                            <div class="suggestion">
                                💡 {suggestion}
                            </div>
                        {/each}
                    {:else}
                        <div class="no-suggestions">🎯 Nutritional profile looks good!</div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Fixed Footer Section -->
    <div class="window-footer">
        <div class="footer-stats">
            <div class="stat">
                <span class="stat-label">Plant Diversity:</span>
                <span class="stat-value">{nutritionAnalysis?.plantCount || 0} / 35 weekly</span>
            </div>
            <div class="stat">
                <span class="stat-label">Allergies:</span>
                <span class="stat-value">
                    {#if currentProfile.allergies.length > 0}
                        Avoiding {currentProfile.allergies.join(', ')}
                    {:else}
                        None
                    {/if}
                </span>
            </div>
            <div class="stat">
                <span class="stat-label">Cooking Priority:</span>
                <span class="stat-value">Instant Pot 85% retention</span>
            </div>
        </div>
        <div class="footer-timestamp">
            Last Updated: {new Date().toLocaleString()}
        </div>
    </div>
</div>

<style>
    .recipe-display-window {
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1px solid #d1d1d1;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
    }

    .window-header {
        background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
        color: white;
        padding: 16px 20px;
        border-bottom: 1px solid #d1d1d1;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .window-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }

    .subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 4px;
    }

    .phase-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 10px;
    }

    .phase-badge.growth {
        background: #107c10;
    }

    .phase-badge.longevity {
        background: #ff8c00;
    }

    .meal-window {
        font-weight: 600;
    }

    .header-actions {
        display: flex;
        gap: 8px;
    }

    .action-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .action-btn.generate {
        background: #107c10;
        color: white;
    }

    .action-btn.analyze {
        background: #ff8c00;
        color: white;
    }

    .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .window-content {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .left-panel, .right-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .left-panel {
        border-right: 1px solid #d1d1d1;
        background: #fafafa;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #d1d1d1;
        background: white;
    }

    .panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #323130;
    }

    .step-counter, .evidence-badge {
        font-size: 11px;
        padding: 4px 8px;
        background: #0078d4;
        color: white;
        border-radius: 12px;
    }

    .steps-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
    }

    .step-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e1e1e1;
        transition: all 0.2s ease;
    }

    .step-item:hover {
        border-color: #0078d4;
        box-shadow: 0 2px 4px rgba(0, 120, 212, 0.1);
    }

    .step-item.completed {
        background: #f3f9fc;
        border-color: #107c10;
    }

    .step-item.active {
        background: #fff7e6;
        border-color: #ff8c00;
        animation: pulse 2s infinite;
    }

    .step-item.placeholder {
        opacity: 0.5;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }

    .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #0078d4;
        color: white;
        border-radius: 50%;
        font-size: 10px;
        font-weight: 600;
        flex-shrink: 0;
    }

    .step-item.completed .step-number {
        background: #107c10;
    }

    .step-item.active .step-number {
        background: #ff8c00;
    }

    .step-content {
        flex: 1;
    }

    .step-title {
        font-weight: 600;
        font-size: 12px;
        color: #323130;
        margin-bottom: 2px;
    }

    .step-action {
        font-size: 11px;
        color: #605e5c;
        margin-bottom: 4px;
    }

    .step-details {
        font-size: 10px;
        color: #8a8886;
        margin-bottom: 4px;
    }

    .step-duration {
        font-size: 10px;
        color: #0078d4;
        font-weight: 500;
    }

    .macros-section, .micros-section, .deficiencies-section {
        padding: 16px 20px;
        border-bottom: 1px solid #f0f0f0;
    }

    .macros-section h4, .micros-section h4, .deficiencies-section h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: #323130;
    }

    .macro-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .macro-item {
        background: #fafafa;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #e1e1e1;
    }

    .macro-name {
        font-size: 10px;
        font-weight: 600;
        color: #605e5c;
        margin-bottom: 4px;
    }

    .macro-values {
        font-size: 12px;
        font-weight: 600;
        color: #323130;
        margin-bottom: 8px;
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background: #e1e1e1;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
    }

    .progress-fill {
        height: 100%;
        transition: width 0.3s ease;
    }

    .percentage {
        font-size: 10px;
        font-weight: 600;
        text-align: right;
    }

    .micro-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .micro-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .micro-name {
        font-size: 10px;
        font-weight: 500;
        width: 80px;
        color: #605e5c;
    }

    .micro-bar {
        flex: 1;
        height: 16px;
        background: #e1e1e1;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
    }

    .micro-fill {
        height: 100%;
        transition: width 0.3s ease;
    }

    .micro-text {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .alerts-container, .suggestions-container {
        margin-bottom: 12px;
    }

    .deficiency-alert {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 11px;
        margin-bottom: 4px;
    }

    .deficiency-alert.critical {
        background: #fef0f0;
        color: #d13438;
        border: 1px solid #fecaca;
    }

    .deficiency-alert.moderate {
        background: #fef7ec;
        color: #ff8c00;
        border: 1px solid #fed7aa;
    }

    .suggestion {
        padding: 6px 12px;
        background: #f0f9ff;
        color: #0078d4;
        border-radius: 4px;
        font-size: 10px;
        margin-bottom: 4px;
        border: 1px solid #bae6fd;
    }

    .no-deficiencies, .no-suggestions {
        padding: 8px 12px;
        background: #f0fdf4;
        color: #107c10;
        border-radius: 4px;
        font-size: 11px;
        border: 1px solid #bbf7d0;
    }

    .window-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: #f5f5f5;
        border-top: 1px solid #d1d1d1;
        font-size: 10px;
        color: #605e5c;
    }

    .footer-stats {
        display: flex;
        gap: 24px;
    }

    .stat {
        display: flex;
        gap: 4px;
    }

    .stat-label {
        color: #8a8886;
    }

    .stat-value {
        font-weight: 600;
        color: #323130;
    }

    .footer-timestamp {
        font-style: italic;
    }

    /* Placeholder styles */
    .placeholder-macros, .placeholder-micros {
        opacity: 0.6;
    }

    .placeholder-steps {
        opacity: 0.4;
    }

    /* Scrollbar styling */
    .steps-container::-webkit-scrollbar {
        width: 6px;
    }

    .steps-container::-webkit-scrollbar-track {
        background: #f1f1f1;
    }

    .steps-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
    }

    .steps-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
    }
</style>