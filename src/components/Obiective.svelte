<!-- components/Obiective.svelte -->
<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { totalBalance, fmt, today } from '../lib/store.js';
  
  // Store for goals
  const goals = writable([]);
  
  // Form state
  let showForm = false;
  let goalForm = {
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'savings',
    description: ''
  };
  
  // Goal categories
  const goalCategories = [
    { id: 'savings', name: 'Economii', icon: '💰', color: '#10b981' },
    { id: 'vacation', name: 'Vacanță', icon: '🏖️', color: '#06b6d4' },
    { id: 'car', name: 'Mașină', icon: '🚗', color: '#3b82f6' },
    { id: 'house', name: 'Casă', icon: '🏠', color: '#8b5cf6' },
    { id: 'education', name: 'Educație', icon: '📚', color: '#f59e0b' },
    { id: 'emergency', name: 'Fond Urgență', icon: '🚨', color: '#ef4444' },
    { id: 'investment', name: 'Investiții', icon: '📈', color: '#84cc16' },
    { id: 'other', name: 'Altele', icon: '🎯', color: '#6b7280' }
  ];
  
  onMount(() => {
    loadGoals();
  });
  
  function loadGoals() {
    const stored = localStorage.getItem('fs_goals');
    if (stored) {
      goals.set(JSON.parse(stored));
    }
  }
  
  function saveGoals(goalList) {
    goals.set(goalList);
    localStorage.setItem('fs_goals', JSON.stringify(goalList));
  }
  
  function addGoal() {
    if (!goalForm.name || !goalForm.targetAmount || parseFloat(goalForm.targetAmount) <= 0) {
      alert('Completează numele și suma țintă');
      return;
    }
    
    const newGoal = {
      id: Date.now().toString(),
      name: goalForm.name,
      targetAmount: parseFloat(goalForm.targetAmount),
      currentAmount: parseFloat(goalForm.currentAmount) || 0,
      targetDate: goalForm.targetDate,
      category: goalForm.category,
      description: goalForm.description,
      createdAt: today()
    };
    
    goals.update(list => {
      const newList = [...list, newGoal];
      saveGoals(newList);
      return newList;
    });
    
    // Reset form
    goalForm = {
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      category: 'savings',
      description: ''
    };
    showForm = false;
  }
  
  function updateGoalAmount(goalId, newAmount) {
    if (newAmount < 0) return;
    
    goals.update(list => {
      const newList = list.map(goal => {
        if (goal.id === goalId) {
          return { ...goal, currentAmount: parseFloat(newAmount) || 0 };
        }
        return goal;
      });
      saveGoals(newList);
      return newList;
    });
  }
  
  function deleteGoal(goalId) {
    if (confirm('Sigur vrei să ștergi acest obiectiv?')) {
      goals.update(list => {
        const newList = list.filter(g => g.id !== goalId);
        saveGoals(newList);
        return newList;
      });
    }
  }
  
  function getGoalProgress(goal) {
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
    const isComplete = goal.currentAmount >= goal.targetAmount;
    
    // Calculate days remaining
    let daysRemaining = null;
    if (goal.targetDate) {
      const today = new Date();
      const target = new Date(goal.targetDate);
      daysRemaining = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }
    
    // Calculate required monthly savings
    let monthlyRequired = 0;
    if (goal.targetDate && remaining > 0) {
      const today = new Date();
      const target = new Date(goal.targetDate);
      const monthsRemaining = Math.max((target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth(), 1);
      monthlyRequired = remaining / monthsRemaining;
    }
    
    return {
      percentage: percentage.toFixed(1),
      remaining,
      isComplete,
      daysRemaining,
      monthlyRequired
    };
  }
  
  function getCategoryInfo(categoryId) {
    return goalCategories.find(c => c.id === categoryId) || goalCategories.find(c => c.id === 'other');
  }
  
  function getStatusColor(percentage) {
    if (percentage >= 100) return '#10b981'; // Green - Complete
    if (percentage >= 75) return '#84cc16'; // Light green - Almost there
    if (percentage >= 50) return '#eab308'; // Yellow - Halfway
    if (percentage >= 25) return '#f97316'; // Orange - Getting started
    return '#6b7280'; // Gray - Just started
  }
  
  // Sort goals by completion and date
  $: sortedGoals = $goals.sort((a, b) => {
    const aProgress = getGoalProgress(a);
    const bProgress = getGoalProgress(b);
    
    // Complete goals go to bottom
    if (aProgress.isComplete !== bProgress.isComplete) {
      return aProgress.isComplete ? 1 : -1;
    }
    
    // Sort by target date if available
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate) - new Date(b.targetDate);
    }
    
    // No date goals go to bottom
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;
    
    // Sort by creation date
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
</script>

<div class="goals-container">
  <div class="header">
    <h2>🎯 Obiective Financiare</h2>
    <button class="btn-primary" on:click={() => showForm = !showForm}>
      {showForm ? 'Anulează' : '+ Adaugă Obiectiv'}
    </button>
  </div>
  
  <!-- Add Goal Form -->
  {#if showForm}
    <div class="form-card">
      <h3>Obiectiv Financiar Nou</h3>
      <div class="form-grid">
        <div class="form-group full-width">
          <label>Nume Obiectiv *</label>
          <input 
            type="text" 
            bind:value={goalForm.name}
            placeholder="ex: Vacanță în Grecia, Fond urgență, Mașină nouă"
            maxlength="100"
          />
        </div>
        
        <div class="form-group">
          <label>Categorie</label>
          <select bind:value={goalForm.category}>
            {#each goalCategories as category}
              <option value={category.id}>{category.icon} {category.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label>Suma Țintă (RON) *</label>
          <input 
            type="number" 
            bind:value={goalForm.targetAmount}
            placeholder="0.00"
            step="0.01"
            min="0.01"
          />
        </div>
        
        <div class="form-group">
          <label>Suma Actuală (RON)</label>
          <input 
            type="number" 
            bind:value={goalForm.currentAmount}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
        
        <div class="form-group">
          <label>Data Țintă</label>
          <input 
            type="date" 
            bind:value={goalForm.targetDate}
          />
        </div>
        
        <div class="form-group full-width">
          <label>Descriere</label>
          <textarea 
            bind:value={goalForm.description}
            placeholder="Detalii despre obiectiv (opțional)"
            rows="2"
            maxlength="500"
          ></textarea>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-primary" on:click={addGoal}>
          🎯 Creează Obiectiv
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Goals List -->
  {#if sortedGoals.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🎯</div>
      <h3>Nu ai obiective financiare</h3>
      <p>Stabilește-ți primul obiectiv financiar pentru a-ți urmări progresul către țintele tale!</p>
      <button class="btn-secondary" on:click={() => showForm = true}>
        Adaugă primul obiectiv
      </button>
    </div>
  {:else}
    <div class="goals-grid">
      {#each sortedGoals as goal (goal.id)}
        {@const progress = getGoalProgress(goal)}
        {@const categoryInfo = getCategoryInfo(goal.category)}
        {@const statusColor = getStatusColor(progress.percentage)}
        
        <div class="goal-card" class:completed={progress.isComplete}>
          <div class="goal-header">
            <div class="goal-title">
              <span class="category-icon" style="color: {categoryInfo.color}">
                {categoryInfo.icon}
              </span>
              <div>
                <h4>{goal.name}</h4>
                <span class="category-name">{categoryInfo.name}</span>
              </div>
            </div>
            <button 
              class="delete-btn" 
              on:click={() => deleteGoal(goal.id)}
              title="Șterge obiectiv"
            >
              🗑️
            </button>
          </div>
          
          {#if goal.description}
            <p class="goal-description">{goal.description}</p>
          {/if}
          
          <div class="progress-section">
            <div class="progress-bar">
              <div class="progress-track">
                <div 
                  class="progress-fill" 
                  style="width: {progress.percentage}%; background-color: {statusColor}"
                ></div>
              </div>
              <div class="progress-text">
                {progress.percentage}%
                {#if progress.isComplete}
                  <span class="completed-badge">✅ REALIZAT!</span>
                {/if}
              </div>
            </div>
            
            <div class="amounts-grid">
              <div class="amount-item">
                <span class="label">Curent:</span>
                <span class="value current">{fmt(goal.currentAmount)} RON</span>
              </div>
              <div class="amount-item">
                <span class="label">Țintă:</span>
                <span class="value target">{fmt(goal.targetAmount)} RON</span>
              </div>
              <div class="amount-item">
                <span class="label">Rămas:</span>
                <span class="value remaining">{fmt(progress.remaining)} RON</span>
              </div>
            </div>
          </div>
          
          {#if goal.targetDate}
            <div class="deadline-info">
              <div class="deadline-item">
                <span class="label">📅 Deadline:</span>
                <span class="value">{new Date(goal.targetDate).toLocaleDateString('ro-RO')}</span>
              </div>
              {#if progress.daysRemaining !== null}
                <div class="deadline-item">
                  <span class="label">⏰ Timp rămas:</span>
                  <span class="value" class:urgent={progress.daysRemaining < 30}>
                    {progress.daysRemaining > 0 ? `${progress.daysRemaining} zile` : 'Expirat'}
                  </span>
                </div>
              {/if}
              {#if progress.monthlyRequired > 0}
                <div class="deadline-item">
                  <span class="label">💡 Necesar lunar:</span>
                  <span class="value monthly">{fmt(progress.monthlyRequired)} RON</span>
                </div>
              {/if}
            </div>
          {/if}
          
          <!-- Quick add amount -->
          {#if !progress.isComplete}
            <div class="quick-actions">
              <input 
                type="number" 
                placeholder="Adaugă suma..."
                step="0.01"
                min="0"
                class="quick-amount"
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    const newAmount = goal.currentAmount + parseFloat(e.target.value || 0);
                    updateGoalAmount(goal.id, newAmount);
                    e.target.value = '';
                  }
                }}
              />
              <button 
                class="btn-quick-add"
                on:click={(e) => {
                  const input = e.target.previousElementSibling;
                  const newAmount = goal.currentAmount + parseFloat(input.value || 0);
                  updateGoalAmount(goal.id, newAmount);
                  input.value = '';
                }}
              >
                ➕
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .goals-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .header h2 {
    margin: 0;
    color: var(--acc);
  }
  
  .form-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 24px;
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .form-card h3 {
    margin: 0 0 16px 0;
    color: var(--acc);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-group label {
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }
  
  input, select, textarea {
    padding: 10px 12px;
    border: 1px solid #28304b;
    border-radius: 10px;
    background: var(--panel2);
    color: var(--ink);
    font-size: 14px;
    font-family: inherit;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--acc);
    box-shadow: 0 0 0 3px rgba(128, 184, 255, 0.1);
  }
  
  textarea {
    resize: vertical;
    min-height: 60px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .btn-primary, .btn-secondary {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 10px 16px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
  }
  
  .btn-primary:hover, .btn-secondary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: transparent;
    outline: 1px solid var(--acc);
    color: var(--acc);
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: var(--panel);
    border-radius: 14px;
    color: var(--muted);
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
  }
  
  .empty-state h3 {
    margin-bottom: 8px;
    color: var(--ink);
  }
  
  .empty-state p {
    margin-bottom: 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }
  
  .goal-card {
    background: var(--panel);
    border-radius: 14px;
    padding: 20px;
    border: 1px solid rgba(128, 184, 255, .2);
    transition: all 0.2s;
  }
  
  .goal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .goal-card.completed {
    border-color: var(--ok);
    background: linear-gradient(135deg, var(--panel) 0%, rgba(16, 185, 129, 0.05) 100%);
  }
  
  .goal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .goal-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .category-icon {
    font-size: 1.5rem;
  }
  
  .goal-title h4 {
    margin: 0;
    color: var(--ink);
    font-size: 1.1rem;
  }
  
  .category-name {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .goal-description {
    margin: 0 0 16px 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }
  
  .progress-section {
    margin-bottom: 16px;
  }
  
  .progress-bar {
    margin-bottom: 12px;
  }
  
  .progress-track {
    width: 100%;
    height: 8px;
    background: var(--panel2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--muted);
  }
  
  .completed-badge {
    color: var(--ok);
    font-weight: 600;
    font-size: 0.8rem;
  }
  
  .amounts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .amount-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .amount-item .label {
    font-size: 0.8rem;
    color: var(--muted);
  }
  
  .amount-item .value {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .value.current {
    color: var(--acc);
  }
  
  .value.target {
    color: var(--ink);
  }
  
  .value.remaining {
    color: var(--warn);
  }
  
  .deadline-info {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--panel2);
    border-radius: 8px;
  }
  
  .deadline-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 0.85rem;
  }
  
  .deadline-item:last-child {
    margin-bottom: 0;
  }
  
  .deadline-item .label {
    color: var(--muted);
  }
  
  .deadline-item .value {
    font-weight: 500;
    color: var(--ink);
  }
  
  .value.urgent {
    color: var(--err);
    font-weight: 600;
  }
  
  .value.monthly {
    color: var(--ok);
    font-weight: 600;
  }
  
  .quick-actions {
    display: flex;
    gap: 8px;
  }
  
  .quick-amount {
    flex: 1;
    padding: 8px 10px;
    font-size: 0.9rem;
  }
  
  .btn-quick-add {
    background: var(--ok);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .btn-quick-add:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    .goals-grid {
      grid-template-columns: 1fr;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .amounts-grid {
      grid-template-columns: 1fr;
      gap: 6px;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .goal-title {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }
    
    .category-icon {
      font-size: 1.2rem;
    }
  }
</style>