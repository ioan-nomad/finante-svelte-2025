<!-- src/components/ErrorBoundary.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  
  export let fallback = "A apărut o eroare. Te rugăm reîncarcă pagina.";
  export let showTechnicalDetails = false;
  export let enableAutoReload = false;
  export let reloadDelay = 5000; // 5 seconds
  
  let hasError = false;
  let errorMessage = '';
  let errorStack = '';
  let errorComponent = '';
  let autoReloadTimer;
  
  const dispatch = createEventDispatcher();
  
  onMount(() => {
    // Global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    // Component error handler for Svelte components
    window.addEventListener('svelte:error', handleSvelteError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('svelte:error', handleSvelteError);
      
      if (autoReloadTimer) {
        clearTimeout(autoReloadTimer);
      }
    };
  });
  
  function handleError(event) {
    hasError = true;
    errorMessage = event.message;
    errorStack = event.error?.stack || '';
    errorComponent = event.filename || '';
    
    console.error('Global error caught:', event);
    
    // Track error for analytics
    dispatch('error', {
      type: 'global',
      message: event.message,
      stack: errorStack,
      filename: event.filename
    });
    
    if (enableAutoReload) {
      scheduleAutoReload();
    }
  }
  
  function handleRejection(event) {
    hasError = true;
    errorMessage = event.reason?.message || 'Promise rejected';
    errorStack = event.reason?.stack || '';
    
    console.error('Unhandled rejection caught:', event);
    
    dispatch('error', {
      type: 'rejection',
      message: errorMessage,
      stack: errorStack
    });
    
    if (enableAutoReload) {
      scheduleAutoReload();
    }
  }
  
  function handleSvelteError(event) {
    hasError = true;
    errorMessage = event.detail?.message || 'Svelte component error';
    errorStack = event.detail?.stack || '';
    errorComponent = event.detail?.component || '';
    
    console.error('Svelte error caught:', event);
    
    dispatch('error', {
      type: 'svelte',
      message: errorMessage,
      stack: errorStack,
      component: errorComponent
    });
  }
  
  function scheduleAutoReload() {
    if (autoReloadTimer) return;
    
    autoReloadTimer = setTimeout(() => {
      window.location.reload();
    }, reloadDelay);
  }
  
  function reset() {
    hasError = false;
    errorMessage = '';
    errorStack = '';
    errorComponent = '';
    
    if (autoReloadTimer) {
      clearTimeout(autoReloadTimer);
      autoReloadTimer = null;
    }
    
    dispatch('reset');
  }
  
  function reportError() {
    const errorData = {
      message: errorMessage,
      stack: errorStack,
      component: errorComponent,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Log to console for debugging
    console.table(errorData);
    
    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorData, null, 2))
      .then(() => {
        alert('Detaliile erorii au fost copiate în clipboard!');
      })
      .catch(() => {
        console.log('Could not copy error details to clipboard');
      });
    
    dispatch('report', errorData);
  }
  
  function reloadPage() {
    window.location.reload();
  }
</script>

{#if hasError}
  <div class="error-boundary">
    <div class="error-content">
      <div class="error-icon">💥</div>
      <h2>😔 Oops! Ceva nu a mers bine</h2>
      <p class="error-message">{fallback}</p>
      
      {#if showTechnicalDetails}
        <details class="error-details">
          <summary>Detalii tehnice</summary>
          <div class="error-info">
            {#if errorMessage}
              <div class="error-section">
                <strong>Mesaj:</strong>
                <pre class="error-text">{errorMessage}</pre>
              </div>
            {/if}
            
            {#if errorComponent}
              <div class="error-section">
                <strong>Componenta:</strong>
                <code>{errorComponent}</code>
              </div>
            {/if}
            
            {#if errorStack}
              <div class="error-section">
                <strong>Stack trace:</strong>
                <pre class="error-stack">{errorStack}</pre>
              </div>
            {/if}
          </div>
        </details>
      {/if}
      
      <div class="error-actions">
        <button class="btn-primary" on:click={reset}>
          🔄 Încearcă din nou
        </button>
        
        <button class="btn-secondary" on:click={reloadPage}>
          ↻ Reîncarcă pagina
        </button>
        
        {#if showTechnicalDetails}
          <button class="btn-ghost" on:click={reportError}>
            📋 Copiază detaliile
          </button>
        {/if}
      </div>
      
      {#if enableAutoReload && autoReloadTimer}
        <div class="auto-reload-notice">
          <p>Pagina se va reîncărca automat în {Math.ceil(reloadDelay / 1000)} secunde...</p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    padding: 40px 20px;
    text-align: center;
    background: var(--panel, #f8f9fa);
    border: 2px solid var(--err, #dc3545);
    border-radius: 14px;
    margin: 20px;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .error-content {
    max-width: 600px;
    width: 100%;
  }
  
  .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
    animation: shake 0.5s ease-in-out;
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  .error-content h2 {
    color: var(--err, #dc3545);
    margin: 0 0 16px 0;
    font-size: 1.5rem;
  }
  
  .error-message {
    color: var(--ink, #333);
    margin-bottom: 24px;
    font-size: 1.1rem;
    line-height: 1.5;
  }
  
  .error-details {
    margin: 24px 0;
    text-align: left;
    background: var(--panel2, #e9ecef);
    border-radius: 8px;
    padding: 16px;
  }
  
  .error-details summary {
    cursor: pointer;
    font-weight: 600;
    color: var(--acc, #007bff);
    padding: 8px;
    margin: -8px;
    border-radius: 4px;
  }
  
  .error-details summary:hover {
    background: rgba(0, 123, 255, 0.1);
  }
  
  .error-info {
    margin-top: 16px;
  }
  
  .error-section {
    margin-bottom: 16px;
  }
  
  .error-section strong {
    display: block;
    margin-bottom: 8px;
    color: var(--ink, #333);
  }
  
  .error-text, .error-stack {
    background: var(--bg, #fff);
    border: 1px solid var(--muted, #dee2e6);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.85rem;
    font-family: 'Consolas', 'Monaco', monospace;
    line-height: 1.4;
    color: var(--err, #dc3545);
  }
  
  .error-stack {
    max-height: 200px;
    overflow-y: auto;
    color: var(--muted, #6c757d);
  }
  
  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
  }
  
  .btn-primary, .btn-secondary, .btn-ghost {
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary {
    background: var(--acc, #007bff);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--ok, #28a745);
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: var(--warn, #ffc107);
    color: #333;
  }
  
  .btn-secondary:hover {
    background: #e0a800;
    transform: translateY(-1px);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--muted, #6c757d);
    border: 1px solid var(--muted, #dee2e6);
  }
  
  .btn-ghost:hover {
    background: var(--muted, #f8f9fa);
    color: var(--ink, #333);
  }
  
  .auto-reload-notice {
    margin-top: 20px;
    padding: 12px;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid var(--warn, #ffc107);
    border-radius: 6px;
    font-size: 0.9rem;
    color: var(--warn, #856404);
  }
  
  .auto-reload-notice p {
    margin: 0;
  }
  
  /* Dark mode support */
  :global(html.dark) .error-boundary {
    background: #2d2d2d;
    border-color: #ff6b6b;
  }
  
  :global(html.dark) .error-details {
    background: #1a1a1a;
  }
  
  :global(html.dark) .error-text,
  :global(html.dark) .error-stack {
    background: #0d0d0d;
    border-color: #404040;
    color: #ff6b6b;
  }
  
  :global(html.dark) .error-stack {
    color: #a0a0a0;
  }
  
  :global(html.dark) .btn-ghost {
    border-color: #666;
    color: #a0a0a0;
  }
  
  :global(html.dark) .btn-ghost:hover {
    background: #404040;
    color: #e0e0e0;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .error-boundary {
      margin: 10px;
      padding: 20px 15px;
    }
    
    .error-icon {
      font-size: 36px;
    }
    
    .error-content h2 {
      font-size: 1.3rem;
    }
    
    .error-actions {
      flex-direction: column;
      align-items: stretch;
    }
    
    .btn-primary, .btn-secondary, .btn-ghost {
      width: 100%;
      justify-content: center;
    }
    
    .error-details {
      padding: 12px;
    }
    
    .error-text, .error-stack {
      font-size: 0.8rem;
      padding: 10px;
    }
  }
</style>