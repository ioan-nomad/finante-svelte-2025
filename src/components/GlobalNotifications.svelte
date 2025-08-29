<!-- components/GlobalNotifications.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { transactions, accounts, computeAccountBalance, fmt, currentMonth } from '../lib/store.js';
  
  // Notification state
  let notifications = [];
  let showNotifications = false;
  let unreadCount = 0;
  
  // Check intervals
  let checkInterval;
  let lastCheck = Date.now();
  
  onMount(() => {
    checkAllAlerts();
    // Check every 5 minutes
    checkInterval = setInterval(checkAllAlerts, 5 * 60 * 1000);
    
    // Load persisted notification state
    const stored = localStorage.getItem('fs_notifications_read');
    if (stored) {
      const readIds = JSON.parse(stored);
      notifications = notifications.map(n => ({
        ...n,
        read: readIds.includes(n.id)
      }));
    }
    
    updateUnreadCount();
  });
  
  onDestroy(() => {
    if (checkInterval) clearInterval(checkInterval);
  });
  
  // Reactive updates
  $: if ($accounts.length || $transactions.length) {
    checkAllAlerts();
  }
  
  function checkAllAlerts() {
    const newNotifications = [];
    
    // Budget alerts
    const budgetAlerts = checkBudgetAlerts();
    newNotifications.push(...budgetAlerts);
    
    // Low balance alerts
    const balanceAlerts = checkLowBalanceAlerts();
    newNotifications.push(...balanceAlerts);
    
    // Large transaction alerts
    const transactionAlerts = checkLargeTransactionAlerts();
    newNotifications.push(...transactionAlerts);
    
    // Reconciliation due alerts
    const reconcileAlerts = checkReconciliationAlerts();
    newNotifications.push(...reconcileAlerts);
    
    // Goal deadline alerts
    const goalAlerts = checkGoalDeadlineAlerts();
    newNotifications.push(...goalAlerts);
    
    // Update notifications (keep existing read status)
    const existingIds = new Set(notifications.map(n => n.id));
    const readIds = new Set(notifications.filter(n => n.read).map(n => n.id));
    
    notifications = newNotifications.map(n => ({
      ...n,
      read: readIds.has(n.id) || false,
      new: !existingIds.has(n.id)
    }));
    
    updateUnreadCount();
  }
  
  function checkBudgetAlerts() {
    const budgets = JSON.parse(localStorage.getItem('fs_budgets') || '[]');
    const current = currentMonth();
    const alerts = [];
    
    const monthTx = $transactions.filter(t => 
      t.type === 'expense' && 
      t.date && 
      t.date.startsWith(current)
    );
    
    const byCategory = {};
    monthTx.forEach(t => {
      const cat = t.category || 'Altele';
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    });
    
    budgets.forEach(budget => {
      if (budget.month === current) {
        const spent = byCategory[budget.category] || 0;
        const percentage = (spent / budget.amount) * 100;
        
        if (percentage >= budget.alert) {
          alerts.push({
            id: `budget-${budget.category}-${current}`,
            type: 'budget',
            priority: percentage >= 100 ? 'high' : 'medium',
            title: `Budget ${budget.category} ${percentage >= 100 ? 'depășit' : 'aproape depășit'}`,
            message: `Ai cheltuit ${fmt(spent)} RON din ${fmt(budget.amount)} RON (${percentage.toFixed(1)}%)`,
            timestamp: Date.now(),
            category: budget.category,
            icon: '💰'
          });
        }
      }
    });
    
    return alerts;
  }
  
  function checkLowBalanceAlerts() {
    const alerts = [];
    
    $accounts.forEach(account => {
      if (account.type === 'bank') {
        const balance = computeAccountBalance(account);
        const threshold = account.currency === 'RON' ? 100 : 20; // 100 RON or 20 EUR
        
        if (balance < threshold && balance > -1000) { // Avoid spam for very negative
          alerts.push({
            id: `balance-${account.id}`,
            type: 'balance',
            priority: balance < 0 ? 'high' : 'medium',
            title: `Sold scăzut: ${account.name}`,
            message: `Soldul este ${fmt(balance)} ${account.currency}`,
            timestamp: Date.now(),
            accountId: account.id,
            icon: balance < 0 ? '🚨' : '⚠️'
          });
        }
      }
    });
    
    return alerts;
  }
  
  function checkLargeTransactionAlerts() {
    const alerts = [];
    const threshold = 1000; // RON
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    const recentTransactions = $transactions.filter(t => 
      new Date(t.createdAt || t.date).getTime() > oneDayAgo &&
      t.amount > threshold
    );
    
    recentTransactions.forEach(tx => {
      alerts.push({
        id: `large-tx-${tx.id}`,
        type: 'transaction',
        priority: tx.amount > 5000 ? 'high' : 'medium',
        title: `Tranzacție mare: ${fmt(tx.amount)} RON`,
        message: `${tx.type === 'expense' ? 'Cheltuială' : 'Venit'}: ${tx.description || tx.category || 'Fără descriere'}`,
        timestamp: new Date(tx.createdAt || tx.date).getTime(),
        transactionId: tx.id,
        icon: tx.type === 'expense' ? '💸' : '💰'
      });
    });
    
    return alerts;
  }
  
  function checkReconciliationAlerts() {
    const alerts = [];
    const reconciliations = JSON.parse(localStorage.getItem('fs_reconciliations') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    $accounts.forEach(account => {
      if (account.type === 'bank') {
        const lastReconcile = reconciliations
          .filter(r => r.accountId === account.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        const shouldAlert = !lastReconcile || new Date(lastReconcile.date).getTime() < thirtyDaysAgo;
        
        if (shouldAlert) {
          alerts.push({
            id: `reconcile-${account.id}`,
            type: 'reconciliation',
            priority: 'low',
            title: `Reconciliază ${account.name}`,
            message: lastReconcile ? 
              `Ultima reconciliere acum ${Math.floor((Date.now() - new Date(lastReconcile.date)) / (24 * 60 * 60 * 1000))} zile` :
              'Nu a fost reconciliat niciodată',
            timestamp: Date.now(),
            accountId: account.id,
            icon: '🔍'
          });
        }
      }
    });
    
    return alerts;
  }
  
  function checkGoalDeadlineAlerts() {
    const alerts = [];
    const goals = JSON.parse(localStorage.getItem('fs_goals') || '[]');
    const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    goals.forEach(goal => {
      if (goal.targetDate && goal.currentAmount < goal.targetAmount) {
        const deadline = new Date(goal.targetDate).getTime();
        const remaining = goal.targetAmount - goal.currentAmount;
        
        if (deadline < thirtyDaysFromNow && deadline > Date.now()) {
          const daysLeft = Math.floor((deadline - Date.now()) / (24 * 60 * 60 * 1000));
          
          alerts.push({
            id: `goal-${goal.id}`,
            type: 'goal',
            priority: daysLeft < 7 ? 'high' : 'medium',
            title: `Obiectiv aproape de termen: ${goal.name}`,
            message: `Mai lipsesc ${fmt(remaining)} RON în ${daysLeft} zile`,
            timestamp: Date.now(),
            goalId: goal.id,
            icon: '🎯'
          });
        }
      }
    });
    
    return alerts;
  }
  
  function updateUnreadCount() {
    unreadCount = notifications.filter(n => !n.read).length;
  }
  
  function markAsRead(notificationId) {
    notifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    // Persist read status
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    localStorage.setItem('fs_notifications_read', JSON.stringify(readIds));
    
    updateUnreadCount();
  }
  
  function markAllAsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    
    const readIds = notifications.map(n => n.id);
    localStorage.setItem('fs_notifications_read', JSON.stringify(readIds));
    
    updateUnreadCount();
  }
  
  function dismissNotification(notificationId) {
    notifications = notifications.filter(n => n.id !== notificationId);
    updateUnreadCount();
  }
  
  function getPriorityClass(priority) {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }
  
  function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}z`;
    if (hours > 0) return `${hours}o`;
    if (minutes > 0) return `${minutes}m`;
    return 'acum';
  }
  
  // Sort notifications by priority and timestamp
  $: sortedNotifications = notifications.sort((a, b) => {
    // Priority order: high, medium, low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by timestamp (newest first)
    return b.timestamp - a.timestamp;
  });
</script>

<!-- Notification Bell -->
<div class="notification-wrapper">
  <button 
    class="notification-bell"
    class:has-notifications={unreadCount > 0}
    on:click={() => showNotifications = !showNotifications}
    title="Notificări"
  >
    🔔
    {#if unreadCount > 0}
      <span class="badge" transition:fade>{unreadCount > 99 ? '99+' : unreadCount}</span>
    {/if}
  </button>
  
  <!-- Notifications Dropdown -->
  {#if showNotifications}
    <div class="notifications-dropdown" transition:slide={{ duration: 300, easing: quintOut }}>
      <div class="dropdown-header">
        <h3>Notificări</h3>
        {#if unreadCount > 0}
          <button class="mark-all-read" on:click={markAllAsRead}>
            Marchează toate citite
          </button>
        {/if}
      </div>
      
      <div class="notifications-list">
        {#if sortedNotifications.length === 0}
          <div class="empty-notifications">
            <div class="empty-icon">🔕</div>
            <p>Nu ai notificări</p>
          </div>
        {:else}
          {#each sortedNotifications as notification (notification.id)}
            <div 
              class="notification-item {getPriorityClass(notification.priority)}"
              class:unread={!notification.read}
              class:new={notification.new}
              on:click={() => markAsRead(notification.id)}
              on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') markAsRead(notification.id); }}
              role="button"
              tabindex="0"
              transition:slide={{ duration: 200 }}
            >
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-icon">{notification.icon}</span>
                  <span class="notification-title">{notification.title}</span>
                  <span class="notification-time">{formatTimeAgo(notification.timestamp)}</span>
                </div>
                <p class="notification-message">{notification.message}</p>
              </div>
              
              <button 
                class="dismiss-btn"
                on:click|stopPropagation={() => dismissNotification(notification.id)}
                title="Închide notificarea"
              >
                ×
              </button>
            </div>
          {/each}
        {/if}
      </div>
      
      {#if sortedNotifications.length > 0}
        <div class="dropdown-footer">
          <span class="notification-count">{sortedNotifications.length} notificări</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Click outside to close -->
{#if showNotifications}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="notification-overlay" on:click={() => showNotifications = false}></div>
{/if}

<style>
  .notification-wrapper {
    position: relative;
    z-index: 100;
  }
  
  .notification-bell {
    position: relative;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s;
    color: var(--muted);
  }
  
  .notification-bell:hover {
    background: rgba(128, 184, 255, 0.1);
    color: var(--acc);
    transform: scale(1.1);
  }
  
  .notification-bell.has-notifications {
    color: var(--acc);
    animation: bell-shake 2s infinite;
  }
  
  @keyframes bell-shake {
    0%, 50%, 100% { transform: rotate(0); }
    10%, 30% { transform: rotate(-10deg); }
    20%, 40% { transform: rotate(10deg); }
  }
  
  .badge {
    position: absolute;
    top: 0;
    right: 0;
    background: var(--err);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  }
  
  .notification-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 98;
  }
  
  .notifications-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    width: 350px;
    max-height: 500px;
    background: var(--panel);
    border: 1px solid rgba(128, 184, 255, .2);
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 99;
    overflow: hidden;
  }
  
  .dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(128, 184, 255, .1);
    background: var(--panel2);
  }
  
  .dropdown-header h3 {
    margin: 0;
    color: var(--acc);
    font-size: 1rem;
  }
  
  .mark-all-read {
    background: none;
    border: none;
    color: var(--acc);
    font-size: 0.8rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .mark-all-read:hover {
    background: rgba(128, 184, 255, 0.1);
  }
  
  .notifications-list {
    max-height: 400px;
    overflow-y: auto;
    scrollbar-width: thin;
  }
  
  .empty-notifications {
    padding: 40px 20px;
    text-align: center;
    color: var(--muted);
  }
  
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 8px;
  }
  
  .notification-item {
    display: flex;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(128, 184, 255, .05);
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }
  
  .notification-item:hover {
    background: rgba(128, 184, 255, 0.05);
  }
  
  .notification-item:last-child {
    border-bottom: none;
  }
  
  .notification-item.unread {
    background: rgba(128, 184, 255, 0.08);
    border-left: 3px solid var(--acc);
  }
  
  .notification-item.new {
    animation: notification-pulse 1s ease-out;
  }
  
  @keyframes notification-pulse {
    0% { background: rgba(128, 184, 255, 0.2); }
    100% { background: transparent; }
  }
  
  .notification-item.priority-high {
    border-left-color: var(--err);
  }
  
  .notification-item.priority-medium {
    border-left-color: var(--warn);
  }
  
  .notification-item.priority-low {
    border-left-color: var(--muted);
  }
  
  .notification-content {
    flex: 1;
  }
  
  .notification-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .notification-icon {
    font-size: 1.1rem;
  }
  
  .notification-title {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
    flex: 1;
  }
  
  .notification-time {
    font-size: 0.7rem;
    color: var(--muted);
  }
  
  .notification-message {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
    line-height: 1.3;
  }
  
  .dismiss-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    opacity: 0.5;
  }
  
  .dismiss-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--err);
    opacity: 1;
  }
  
  .dropdown-footer {
    padding: 12px 20px;
    border-top: 1px solid rgba(128, 184, 255, .1);
    background: var(--panel2);
    text-align: center;
  }
  
  .notification-count {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  @media (max-width: 768px) {
    .notifications-dropdown {
      width: 300px;
      right: -50px;
    }
    
    .notification-item {
      padding: 10px 12px;
    }
    
    .notification-title {
      font-size: 0.85rem;
    }
    
    .notification-message {
      font-size: 0.75rem;
    }
  }
</style>