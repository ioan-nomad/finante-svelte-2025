<script>
  import { onMount } from 'svelte';
  import { TestRunner } from '../../lib/testing/testRunner.js';

  let testResults = null;
  let isRunning = false;
  let testRunner = null;

  onMount(() => {
    testRunner = new TestRunner();
  });

  async function runTests() {
    isRunning = true;
    testResults = null;

    try {
      testResults = await testRunner.runAllTests();
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      isRunning = false;
    }
  }
</script>

<div class="test-dashboard">
  <h2>🧪 N-OMAD Testing Suite</h2>

  <div class="controls">
    <button
      on:click={runTests}
      disabled={isRunning}
      class="run-button"
    >
      {isRunning ? '⏳ Running Tests...' : '▶️ Run All Tests'}
    </button>
  </div>

  {#if testResults}
    <div class="results">
      <div class="summary">
        <div class="stat passed">
          ✅ Passed: {testResults.passed}
        </div>
        <div class="stat failed">
          ❌ Failed: {testResults.failed}
        </div>
        <div class="stat duration">
          ⏱️ Duration: {testResults.duration}ms
        </div>
        <div class="stat rate">
          📈 Success: {Math.round(testResults.passed/(testResults.passed+testResults.failed)*100)}%
        </div>
      </div>

      <div class="details">
        <h3>Test Results:</h3>
        {#each testResults.results as result}
          <div class="test-result {result.status.toLowerCase()}">
            <span class="icon">{result.status === 'PASS' ? '✅' : '❌'}</span>
            <span class="module">{result.module}</span>
            <span class="test">{result.test}</span>
            {#if result.error}
              <div class="error">{result.error}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .test-dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .controls {
    margin: 20px 0;
  }

  .run-button {
    padding: 12px 24px;
    font-size: 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .run-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 166, 81, 0.3);
  }

  .run-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }

  .stat {
    padding: 15px;
    background: var(--bg-secondary);
    border-radius: 8px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }

  .stat.passed { color: #00a651; }
  .stat.failed { color: #dc3545; }
  .stat.duration { color: #0066cc; }
  .stat.rate { color: #ff9500; }

  .details {
    margin-top: 30px;
  }

  .test-result {
    display: grid;
    grid-template-columns: 30px 150px 1fr;
    gap: 10px;
    padding: 10px;
    margin: 5px 0;
    background: var(--bg-secondary);
    border-radius: 6px;
    align-items: center;
  }

  .test-result.fail {
    background: rgba(220, 53, 69, 0.1);
  }

  .test-result.pass {
    background: rgba(0, 166, 81, 0.1);
  }

  .module {
    font-weight: bold;
    color: var(--primary);
  }

  .error {
    grid-column: 2 / -1;
    color: #dc3545;
    font-size: 14px;
    margin-top: 5px;
    padding-left: 10px;
  }
</style>