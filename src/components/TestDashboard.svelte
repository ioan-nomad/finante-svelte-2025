<!-- src/components/TestDashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { integrationTester } from '../modules/testing/IntegrationTester.js';

  // State
  let testSuite = null;
  let productionReadiness = null;
  let loading = false;
  let activeView = 'overview';
  let autoRefresh = false;
  let refreshInterval = null;

  // Progress tracking
  let currentTest = '';
  let progress = 0;
  let totalTests = 10;

  onMount(() => {
    loadLastResults();
  });

  // Load previous test results
  async function loadLastResults() {
    try {
      const saved = localStorage.getItem('integration_test_results');
      if (saved) {
        const results = JSON.parse(saved);
        if (results.length > 0) {
          testSuite = results[results.length - 1];
        }
      }
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  }

  // Run full test suite
  async function runTests() {
    loading = true;
    progress = 0;
    testSuite = null;

    try {
      // Create progress tracking
      const originalLog = console.log;
      console.log = (message) => {
        originalLog(message);
        if (message.includes('Testing')) {
          currentTest = message.replace(/[^a-zA-Z\s]/g, '').trim();
          progress++;
        }
      };

      // Run tests
      testSuite = await integrationTester.runFullTestSuite();

      // Check production readiness
      productionReadiness = await integrationTester.checkProductionReadiness();

      // Restore console
      console.log = originalLog;

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      loading = false;
      currentTest = '';
      progress = 0;
    }
  }

  // Toggle auto-refresh
  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;

    if (autoRefresh) {
      refreshInterval = setInterval(runTests, 5 * 60 * 1000); // Every 5 minutes
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // Export test results
  function exportResults() {
    if (!testSuite) return;

    const blob = new Blob([JSON.stringify(testSuite, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get status color
  function getStatusColor(status) {
    switch(status) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  }

  // Get badge color
  function getBadgeColor(status) {
    switch(status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Format time
  function formatTime(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  // Format bytes
  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
</script>

<div class="test-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <h1 class="text-2xl font-bold flex items-center gap-2">
      🧪 Integration Testing Dashboard
      {#if loading}
        <span class="loading-spinner" in:fade></span>
      {/if}
    </h1>

    <div class="controls">
      <button
        on:click={runTests}
        disabled={loading}
        class="run-tests-btn"
      >
        {loading ? '⏳ Running...' : '▶️ Run Tests'}
      </button>

      <button
        on:click={toggleAutoRefresh}
        class="auto-refresh-btn"
        class:active={autoRefresh}
      >
        🔄 Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
      </button>

      <button
        on:click={exportResults}
        disabled={!testSuite}
        class="export-btn"
      >
        📥 Export Results
      </button>
    </div>
  </div>

  <!-- Progress Bar -->
  {#if loading}
    <div class="progress-section" in:fade>
      <div class="progress-info">
        <span class="current-test">{currentTest || 'Initializing...'}</span>
        <span class="progress-count">{progress}/{totalTests}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {(progress / totalTests) * 100}%"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  {#if testSuite}
    <!-- Summary Cards -->
    <div class="summary-cards" in:fly={{ y: 20, duration: 300 }}>
      <!-- Overall Status -->
      <div class="summary-card status-{testSuite.summary.status}">
        <div class="card-icon">
          {#if testSuite.summary.status === 'PRODUCTION_READY'}
            ✅
          {:else if testSuite.summary.status === 'NEEDS_OPTIMIZATION'}
            ⚠️
          {:else}
            ❌
          {/if}
        </div>
        <div class="card-content">
          <div class="card-title">Overall Status</div>
          <div class="card-value">{testSuite.summary.status.replace(/_/g, ' ')}</div>
          <div class="card-message">{testSuite.summary.message}</div>
        </div>
      </div>

      <!-- Test Results -->
      <div class="summary-card">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-title">Test Results</div>
          <div class="test-stats">
            <span class="stat passed">✅ {testSuite.summary.passed}</span>
            <span class="stat failed">❌ {testSuite.summary.failed}</span>
            <span class="stat warning">⚠️ {testSuite.summary.warnings}</span>
          </div>
          <div class="card-subtitle">
            Total: {testSuite.summary.totalTests} tests in {testSuite.summary.duration}s
          </div>
        </div>
      </div>

      <!-- Performance Score -->
      <div class="summary-card">
        <div class="card-icon">⚡</div>
        <div class="card-content">
          <div class="card-title">Performance</div>
          <div class="card-value score-{testSuite.summary.performanceScore >= 80 ? 'good' : testSuite.summary.performanceScore >= 60 ? 'warning' : 'bad'}">
            {testSuite.summary.performanceScore}/100
          </div>
          <div class="performance-bar">
            <div
              class="performance-fill"
              style="width: {testSuite.summary.performanceScore}%; background: {testSuite.summary.performanceScore >= 80 ? '#10b981' : testSuite.summary.performanceScore >= 60 ? '#f59e0b' : '#ef4444'}"
            ></div>
          </div>
        </div>
      </div>

      <!-- Security Grade -->
      <div class="summary-card">
        <div class="card-icon">🔒</div>
        <div class="card-content">
          <div class="card-title">Security</div>
          <div class="card-value grade-{testSuite.summary.securityGrade}">
            Grade: {testSuite.summary.securityGrade}
          </div>
          {#if testSuite.security}
            <div class="card-subtitle">
              Score: {testSuite.security.score}/100
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button
        class="tab"
        class:active={activeView === 'overview'}
        on:click={() => activeView = 'overview'}
      >
        📋 Overview
      </button>
      <button
        class="tab"
        class:active={activeView === 'tests'}
        on:click={() => activeView = 'tests'}
      >
        🧪 Test Details
      </button>
      <button
        class="tab"
        class:active={activeView === 'performance'}
        on:click={() => activeView = 'performance'}
      >
        ⚡ Performance
      </button>
      <button
        class="tab"
        class:active={activeView === 'security'}
        on:click={() => activeView = 'security'}
      >
        🔒 Security
      </button>
      <button
        class="tab"
        class:active={activeView === 'memory'}
        on:click={() => activeView = 'memory'}
      >
        💾 Memory
      </button>
      <button
        class="tab"
        class:active={activeView === 'readiness'}
        on:click={() => activeView = 'readiness'}
      >
        🚀 Production Readiness
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Overview Tab -->
      {#if activeView === 'overview'}
        <div class="overview-content" in:fade>
          <!-- Recommendations -->
          {#if testSuite.summary.recommendations && testSuite.summary.recommendations.length > 0}
            <div class="recommendations-section">
              <h3 class="section-title">💡 Recommendations</h3>
              <ul class="recommendations-list">
                {#each testSuite.summary.recommendations as rec}
                  <li class="recommendation">{rec}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Test Summary Table -->
          <div class="test-summary-section">
            <h3 class="section-title">Test Summary</h3>
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {#each testSuite.tests as test}
                  <tr>
                    <td class="font-medium">{test.name}</td>
                    <td>
                      <span class="status-badge {getBadgeColor(test.status)}">
                        {test.status}
                      </span>
                    </td>
                    <td class="text-sm text-gray-600">
                      {#if test.passRate}
                        Pass rate: {test.passRate}
                      {:else if test.error}
                        Error: {test.error}
                      {:else}
                        {test.checks ? `${test.checks.length} checks` : 'Completed'}
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Test Details Tab -->
      {#if activeView === 'tests'}
        <div class="tests-content" in:fade>
          {#each testSuite.tests as test}
            <div class="test-detail-card">
              <div class="test-header">
                <h3 class="test-name">{test.name}</h3>
                <span class="status-badge {getBadgeColor(test.status)}">
                  {test.status}
                </span>
              </div>

              {#if test.checks && test.checks.length > 0}
                <div class="test-checks">
                  {#each test.checks as check}
                    <div class="check-item">
                      <span class="check-name">{check.name || check.module || check.profile}</span>
                      <div class="check-details">
                        {#each Object.entries(check) as [key, value]}
                          {#if key !== 'name' && key !== 'module' && key !== 'profile'}
                            <span class="check-detail">
                              {key}:
                              <span class="{value === true ? 'text-green-600' : value === false ? 'text-red-600' : 'text-gray-700'}">
                                {typeof value === 'boolean' ? (value ? '✓' : '✗') : value}
                              </span>
                            </span>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      <!-- Production Readiness Tab -->
      {#if activeView === 'readiness'}
        <div class="readiness-content" in:fade>
          {#if productionReadiness}
            <h3 class="section-title">🚀 Production Readiness Checklist</h3>

            <div class="readiness-score-card">
              <div class="readiness-status">
                {productionReadiness.ready ? '✅ READY FOR PRODUCTION' : '❌ NOT READY FOR PRODUCTION'}
              </div>
              <div class="readiness-score">
                Score: {productionReadiness.score}%
              </div>
              <div class="readiness-bar">
                <div
                  class="readiness-fill"
                  style="width: {productionReadiness.score}%; background: {productionReadiness.score >= 80 ? '#10b981' : productionReadiness.score >= 60 ? '#f59e0b' : '#ef4444'}"
                ></div>
              </div>
            </div>

            <div class="checklist-items">
              {#each productionReadiness.checks as item}
                <div class="checklist-item">
                  <span class="item-status">{item.status}</span>
                  <span class="item-name">{item.name}</span>
                  {#if item.error}
                    <span class="item-error">{item.error}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <button
              on:click={async () => {
                productionReadiness = await integrationTester.checkProductionReadiness();
              }}
              class="check-readiness-btn"
            >
              Check Production Readiness
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {:else if !loading}
    <!-- No Results State -->
    <div class="no-results" in:fade>
      <div class="no-results-icon">🧪</div>
      <h2 class="no-results-title">No Test Results Available</h2>
      <p class="no-results-desc">Run the integration test suite to see detailed results</p>
      <button on:click={runTests} class="run-tests-cta">
        ▶️ Run Integration Tests
      </button>
    </div>
  {/if}
</div>

<style>
  .test-dashboard {
    padding: 1.5rem;
    background: white;
    border-radius: 0.5rem;
    min-height: 100vh;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .loading-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid #6366f1;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .controls {
    display: flex;
    gap: 0.75rem;
  }

  .run-tests-btn,
  .auto-refresh-btn,
  .export-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .run-tests-btn {
    background: #6366f1;
    color: white;
  }

  .run-tests-btn:hover:not(:disabled) {
    background: #4f46e5;
  }

  .run-tests-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .auto-refresh-btn {
    background: #e5e7eb;
    color: #374151;
  }

  .auto-refresh-btn:hover {
    background: #d1d5db;
  }

  .auto-refresh-btn.active {
    background: #10b981;
    color: white;
  }

  .export-btn {
    background: #e5e7eb;
    color: #374151;
  }

  .export-btn:hover:not(:disabled) {
    background: #d1d5db;
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Progress Section */
  .progress-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .current-test {
    color: #6b7280;
  }

  .progress-count {
    font-weight: 600;
    color: #374151;
  }

  .progress-bar {
    height: 0.75rem;
    background: #e5e7eb;
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #6366f1;
    transition: width 0.3s ease;
  }

  /* Summary Cards */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .summary-card {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    display: flex;
    gap: 0.75rem;
  }

  .summary-card.status-PRODUCTION_READY {
    background: #d1fae5;
  }

  .summary-card.status-NEEDS_OPTIMIZATION {
    background: #fef3c7;
  }

  .summary-card.status-NEEDS_FIXES {
    background: #fee2e2;
  }

  .card-icon {
    font-size: 2rem;
  }

  .card-content {
    flex: 1;
  }

  .card-title {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .card-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #111827;
  }

  .card-message {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  .test-stats {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .stat.passed {
    color: #10b981;
  }

  .stat.failed {
    color: #ef4444;
  }

  .stat.warning {
    color: #f59e0b;
  }

  .performance-bar {
    margin-top: 0.5rem;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .performance-fill {
    height: 100%;
    transition: all 0.5s ease;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
  }

  .tab {
    padding: 0.5rem 1rem;
    color: #6b7280;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab:hover {
    color: #6366f1;
  }

  .tab.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
  }

  /* Tab Content */
  .tab-content {
    min-height: 400px;
  }

  /* Sections */
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #111827;
  }

  /* Recommendations */
  .recommendations-section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #eff6ff;
    border-radius: 0.5rem;
  }

  .recommendations-list {
    list-style: disc;
    list-style-position: inside;
    margin: 0;
    padding: 0;
  }

  .recommendation {
    font-size: 0.875rem;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  /* Tables */
  .summary-table {
    width: 100%;
    border-collapse: collapse;
  }

  .summary-table th {
    text-align: left;
    padding: 0.5rem;
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .summary-table td {
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .status-badge {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .bg-green-100 {
    background: #d1fae5;
  }

  .text-green-800 {
    color: #065f46;
  }

  .bg-red-100 {
    background: #fee2e2;
  }

  .text-red-800 {
    color: #991b1b;
  }

  .bg-yellow-100 {
    background: #fef3c7;
  }

  .text-yellow-800 {
    color: #92400e;
  }

  .bg-gray-100 {
    background: #f3f4f6;
  }

  .text-gray-800 {
    color: #1f2937;
  }

  /* Test Details */
  .test-detail-card {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .test-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .test-name {
    font-weight: 600;
    color: #111827;
  }

  .test-checks {
    display: grid;
    gap: 0.5rem;
  }

  .check-item {
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 0.25rem;
  }

  .check-name {
    font-weight: 500;
    font-size: 0.875rem;
  }

  .check-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
  }

  .check-detail {
    background: white;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
  }

  .text-green-600 {
    color: #059669;
  }

  .text-red-600 {
    color: #dc2626;
  }

  .text-gray-700 {
    color: #374151;
  }

  .text-gray-600 {
    color: #4b5563;
  }

  /* Production Readiness */
  .readiness-score-card {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 0.5rem;
    text-align: center;
  }

  .readiness-status {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .readiness-score {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .readiness-bar {
    height: 0.75rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 0.375rem;
    overflow: hidden;
  }

  .readiness-fill {
    height: 100%;
    transition: width 0.5s ease;
  }

  .checklist-items {
    display: grid;
    gap: 0.5rem;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 0.25rem;
  }

  .item-status {
    font-size: 1.25rem;
  }

  .item-name {
    flex: 1;
    font-weight: 500;
  }

  .item-error {
    font-size: 0.75rem;
    color: #ef4444;
  }

  .check-readiness-btn {
    padding: 0.75rem 1.5rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .check-readiness-btn:hover {
    background: #4f46e5;
  }

  /* No Results */
  .no-results {
    text-align: center;
    padding: 5rem 0;
  }

  .no-results-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .no-results-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  .no-results-desc {
    color: #6b7280;
    margin-bottom: 1.5rem;
  }

  .run-tests-cta {
    padding: 0.75rem 1.5rem;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .run-tests-cta:hover {
    background: #4f46e5;
  }

  .font-medium {
    font-weight: 500;
  }
</style>