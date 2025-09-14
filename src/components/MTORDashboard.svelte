<script>
  import { onMount, onDestroy } from 'svelte';
  import { mtorAutomation } from '../modules/nutrition/mtor/mtorTracker.js';

  let automationStatus = null;
  let cycleAnalytics = null;
  let notifications = [];
  let refreshInterval = null;

  onMount(() => {
    loadData();

    // Refresh every minute
    refreshInterval = setInterval(loadData, 60000);

    // Listen for notifications
    window.addEventListener('mtor-notification', handleNotification);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });

  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    window.removeEventListener('mtor-notification', handleNotification);
  });

  function loadData() {
    automationStatus = mtorAutomation.getAutomationStatus();
    cycleAnalytics = mtorAutomation.getCycleAnalytics();
    notifications = JSON.parse(localStorage.getItem('mtor_notifications') || '[]').slice(0, 5);
  }

  function handleNotification(event) {
    notifications = [event.detail, ...notifications].slice(0, 5);
  }

  function getPhaseColor(phase) {
    const colors = {
      growth: '#4CAF50',
      longevity: '#2196F3',
      transition: '#FF9800',
      maintenance: '#9C27B0',
      autophagy: '#2196F3'
    };
    return colors[phase] || '#666';
  }

  function getDayProgress() {
    if (!automationStatus) return 0;
    return (automationStatus.currentDay / 14) * 100;
  }
</script>

<div class="mtor-dashboard">
  <div class="dashboard-header">
    <h2>🔄 mTOR Cycle Automation</h2>
    {#if automationStatus?.running}
      <span class="status-badge running">● Automation Active</span>
    {:else}
      <span class="status-badge stopped">● Automation Stopped</span>
    {/if}
  </div>

  {#if automationStatus}
    <div class="cycle-status">
      <div class="cycle-info">
        <div class="cycle-day">
          <span class="label">Current Day</span>
          <span class="value">{automationStatus.currentDay}/14</span>
        </div>
        <div class="cycle-phase" style="--phase-color: {getPhaseColor(automationStatus.currentPhase)}">
          <span class="label">Phase</span>
          <span class="value">{automationStatus.currentPhase.toUpperCase()}</span>
        </div>
      </div>

      <div class="cycle-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {getDayProgress()}%"></div>
        </div>
        <div class="progress-labels">
          <span>Day 1</span>
          <span>Day 7</span>
          <span>Day 14</span>
        </div>
      </div>
    </div>
  {/if}

  {#if cycleAnalytics}
    <div class="analytics-grid">
      <div class="analytics-card">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-value">{cycleAnalytics.totalCycles}</div>
          <div class="card-label">Cycles Completed</div>
        </div>
      </div>

      <div class="analytics-card">
        <div class="card-icon">✅</div>
        <div class="card-content">
          <div class="card-value">{cycleAnalytics.avgCompletionRate}%</div>
          <div class="card-label">Avg Completion</div>
        </div>
      </div>

      <div class="analytics-card">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <div class="card-value trend-{cycleAnalytics.trend}">
            {cycleAnalytics.trend}
          </div>
          <div class="card-label">Trend</div>
        </div>
      </div>

      <div class="analytics-card">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <div class="card-value">{cycleAnalytics.predictions?.estimatedCompletionRate}%</div>
          <div class="card-label">Next Cycle Est.</div>
        </div>
      </div>
    </div>
  {/if}

  {#if notifications.length > 0}
    <div class="notifications-section">
      <h3>📬 Recent Notifications</h3>
      <div class="notifications-list">
        {#each notifications as notification}
          <div class="notification-item">
            <div class="notification-time">
              {new Date(notification.timestamp).toLocaleString('ro-RO')}
            </div>
            <div class="notification-content">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .mtor-dashboard {
    background: var(--panel, white);
    border-radius: 16px;
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .dashboard-header h2 {
    margin: 0;
    color: var(--ink, #333);
  }

  .status-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .status-badge.running {
    background: #E8F5E9;
    color: #2E7D32;
  }

  .status-badge.stopped {
    background: #FFEBEE;
    color: #C62828;
  }

  .cycle-status {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
  }

  .cycle-info {
    display: flex;
    gap: 32px;
    margin-bottom: 24px;
  }

  .cycle-day,
  .cycle-phase {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 12px;
    color: var(--muted, #666);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 28px;
    font-weight: bold;
    color: var(--ink, #333);
  }

  .cycle-phase .value {
    color: var(--phase-color, #666);
  }

  .cycle-progress {
    position: relative;
  }

  .progress-bar {
    height: 12px;
    background: var(--panel, white);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #2196F3);
    transition: width 0.5s ease;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--muted, #666);
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .analytics-card {
    background: var(--panel2, #f9f9f9);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .card-icon {
    font-size: 32px;
  }

  .card-content {
    flex: 1;
  }

  .card-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--ink, #333);
  }

  .card-value.trend-improving {
    color: #4CAF50;
  }

  .card-value.trend-declining {
    color: #F44336;
  }

  .card-value.trend-stable {
    color: #FF9800;
  }

  .card-label {
    font-size: 12px;
    color: var(--muted, #666);
    margin-top: 4px;
  }

  .notifications-section {
    margin-top: 32px;
  }

  .notifications-section h3 {
    margin: 0 0 16px 0;
    color: var(--ink, #333);
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notification-item {
    background: var(--panel2, #f9f9f9);
    border-radius: 8px;
    padding: 16px;
    border-left: 4px solid var(--primary, #4CAF50);
  }

  .notification-time {
    font-size: 12px;
    color: var(--muted, #666);
    margin-bottom: 8px;
  }

  .notification-content strong {
    color: var(--ink, #333);
  }

  .notification-content p {
    margin: 4px 0 0 0;
    color: var(--muted, #666);
  }

  /* Dark mode */
  :global(.dark-mode) .mtor-dashboard {
    background: #1a1a1a;
  }

  :global(.dark-mode) .cycle-status,
  :global(.dark-mode) .analytics-card,
  :global(.dark-mode) .notification-item {
    background: #2a2a2a;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .analytics-grid {
      grid-template-columns: 1fr 1fr;
    }

    .cycle-info {
      flex-direction: column;
      gap: 16px;
    }
  }
</style>