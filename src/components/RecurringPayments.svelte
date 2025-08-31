<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { accounts, transactions, addTransaction } from '../lib/store.js';
  
  // State management
  let recurringPayments = [];
  let showAddModal = false;
  let editingPayment = null;
  let upcomingPayments = [];
  let overduePayments = [];
  
  // Form data
  let formData = {
    name: '',
    amount: '',
    category: 'Utilități',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    nextDue: new Date().toISOString().split('T')[0],
    account: '',
    reminder: 3, // Days before due
    autoAdd: false,
    active: true,
    notes: ''
  };
  
  const categories = [
    'Utilități', 'Chirie', 'Internet', 'Telefon', 'Netflix',
    'Spotify', 'Transport', 'Asigurări', 'Sală', 'Alte abonamente'
  ];
  
  const frequencies = [
    { value: 'daily', label: 'Zilnic', days: 1 },
    { value: 'weekly', label: 'Săptămânal', days: 7 },
    { value: 'biweekly', label: 'La 2 săptămâni', days: 14 },
    { value: 'monthly', label: 'Lunar', days: 30 },
    { value: 'quarterly', label: 'Trimestrial', days: 90 },
    { value: 'semiannual', label: 'Semestrial', days: 180 },
    { value: 'annual', label: 'Anual', days: 365 }
  ];
  
  onMount(() => {
    loadPayments();
    checkUpcomingPayments();
    checkForAutoPay();
  });
  
  function loadPayments() {
    const saved = localStorage.getItem('recurringPayments');
    if (saved) {
      recurringPayments = JSON.parse(saved);
    }
  }
  
  function savePayments() {
    localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
    checkUpcomingPayments();
  }
  
  function checkUpcomingPayments() {
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);
    
    upcomingPayments = [];
    overduePayments = [];
    
    recurringPayments.forEach(payment => {
      if (!payment.active) return;
      
      const dueDate = new Date(payment.nextDue);
      
      if (dueDate < today) {
        overduePayments.push({
          ...payment,
          daysOverdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
        });
      } else if (dueDate <= in7Days) {
        upcomingPayments.push({
          ...payment,
          daysUntil: Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
        });
      }
    });
    
    // Show notifications for reminders
    checkReminders();
  }
  
  function checkReminders() {
    const today = new Date();
    
    recurringPayments.forEach(payment => {
      if (!payment.active || !payment.reminder) return;
      
      const dueDate = new Date(payment.nextDue);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - payment.reminder);
      
      if (today >= reminderDate && today < dueDate) {
        // Check if we already notified today
        const lastNotified = localStorage.getItem(`reminded_${payment.id}_${payment.nextDue}`);
        if (!lastNotified) {
          showNotification(`📅 Reminder: ${payment.name} - ${payment.amount} RON în ${payment.reminder} zile!`);
          localStorage.setItem(`reminded_${payment.id}_${payment.nextDue}`, 'true');
        }
      }
    });
  }
  
  function checkForAutoPay() {
    const today = new Date().toISOString().split('T')[0];
    
    recurringPayments.forEach(payment => {
      if (payment.active && payment.autoAdd && payment.nextDue === today) {
        // Check if already added today
        const autoPayKey = `autopay_${payment.id}_${today}`;
        if (!localStorage.getItem(autoPayKey)) {
          // Auto-add transaction
          const tx = {
            date: today,
            amount: payment.amount,
            fromAccount: payment.account,
            toAccount: null,
            category: payment.category,
            description: `[AUTO] ${payment.name}`,
            type: 'expense'
          };
          
          addTransaction(tx);
          
          // Mark as paid and calculate next due date
          payment.lastPaid = today;
          payment.nextDue = calculateNextDue(payment);
          
          localStorage.setItem(autoPayKey, 'true');
          savePayments();
          
          showNotification(`✅ Plată automată adăugată: ${payment.name}`);
        }
      }
    });
  }
  
  function calculateNextDue(payment) {
    const current = new Date(payment.nextDue);
    const freq = frequencies.find(f => f.value === payment.frequency);
    
    if (payment.frequency === 'monthly') {
      // Special handling for monthly to preserve day
      current.setMonth(current.getMonth() + 1);
    } else {
      current.setDate(current.getDate() + freq.days);
    }
    
    return current.toISOString().split('T')[0];
  }
  
  function addPayment() {
    showAddModal = true;
    editingPayment = null;
    formData = {
      name: '',
      amount: '',
      category: 'Utilități',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      nextDue: new Date().toISOString().split('T')[0],
      account: $accounts[0]?.id || '',
      reminder: 3,
      autoAdd: false,
      active: true,
      notes: ''
    };
  }
  
  function editPayment(payment) {
    showAddModal = true;
    editingPayment = payment;
    formData = { ...payment };
  }
  
  function savePayment() {
    if (!formData.name || !formData.amount) {
      alert('Completează numele și suma!');
      return;
    }
    
    if (editingPayment) {
      // Update existing
      const index = recurringPayments.findIndex(p => p.id === editingPayment.id);
      recurringPayments[index] = {
        ...formData,
        id: editingPayment.id,
        amount: parseFloat(formData.amount)
      };
    } else {
      // Add new
      recurringPayments.push({
        ...formData,
        id: Date.now().toString(),
        amount: parseFloat(formData.amount),
        createdAt: new Date().toISOString()
      });
    }
    
    savePayments();
    showAddModal = false;
    showNotification(editingPayment ? '✅ Plată actualizată!' : '✅ Plată recurentă adăugată!');
  }
  
  function deletePayment(payment) {
    if (confirm(`Ștergi plata recurentă "${payment.name}"?`)) {
      recurringPayments = recurringPayments.filter(p => p.id !== payment.id);
      savePayments();
      showNotification('🗑️ Plată ștearsă!');
    }
  }
  
  function markAsPaid(payment) {
    // Add transaction
    const tx = {
      date: new Date().toISOString().split('T')[0],
      amount: payment.amount,
      fromAccount: payment.account || $accounts[0]?.id,
      toAccount: null,
      category: payment.category,
      description: payment.name,
      type: 'expense'
    };
    
    addTransaction(tx);
    
    // Update payment
    payment.lastPaid = new Date().toISOString().split('T')[0];
    payment.nextDue = calculateNextDue(payment);
    savePayments();
    
    showNotification(`✅ ${payment.name} marcată ca plătită!`);
  }
  
  function toggleActive(payment) {
    payment.active = !payment.active;
    savePayments();
  }
  
  function showNotification(message) {
    // Use the global notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }
  
  // Calculate total monthly obligations
  $: monthlyTotal = recurringPayments
    .filter(p => p.active)
    .reduce((total, payment) => {
      const freq = frequencies.find(f => f.value === payment.frequency);
      const monthlyAmount = payment.amount * (30 / freq.days);
      return total + monthlyAmount;
    }, 0);
  
  // Cash flow projection
  function getProjection(months = 3) {
    const projection = [];
    const today = new Date();
    
    for (let m = 0; m < months; m++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
      const monthName = monthDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
      
      let monthTotal = 0;
      
      recurringPayments.forEach(payment => {
        if (!payment.active) return;
        
        const freq = frequencies.find(f => f.value === payment.frequency);
        const occurrences = payment.frequency === 'monthly' ? 1 : Math.floor(30 / freq.days);
        monthTotal += payment.amount * occurrences;
      });
      
      projection.push({
        month: monthName,
        amount: monthTotal
      });
    }
    
    return projection;
  }
  
  $: projection = getProjection(3);
</script>

<div class="recurring-container" transition:fade>
  <!-- Header Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <span class="stat-icon">📅</span>
      <div class="stat-content">
        <div class="stat-label">Total lunar</div>
        <div class="stat-value">{monthlyTotal.toFixed(2)} RON</div>
      </div>
    </div>
    
    <div class="stat-card warning">
      <span class="stat-icon">⚠️</span>
      <div class="stat-content">
        <div class="stat-label">Restante</div>
        <div class="stat-value">{overduePayments.length}</div>
      </div>
    </div>
    
    <div class="stat-card info">
      <span class="stat-icon">📆</span>
      <div class="stat-content">
        <div class="stat-label">În următoarele 7 zile</div>
        <div class="stat-value">{upcomingPayments.length}</div>
      </div>
    </div>
    
    <div class="stat-card success">
      <span class="stat-icon">✅</span>
      <div class="stat-content">
        <div class="stat-label">Plăți active</div>
        <div class="stat-value">{recurringPayments.filter(p => p.active).length}</div>
      </div>
    </div>
  </div>
  
  <!-- Alerts Section -->
  {#if overduePayments.length > 0}
    <div class="alert alert-danger" transition:slide>
      <h3>⚠️ Plăți restante</h3>
      <div class="payment-list">
        {#each overduePayments as payment}
          <div class="payment-alert">
            <div>
              <strong>{payment.name}</strong>
              <span class="text-muted"> - {payment.daysOverdue} zile întârziere</span>
            </div>
            <div class="payment-actions">
              <span class="amount">{payment.amount} RON</span>
              <button class="btn-pay" on:click={() => markAsPaid(payment)}>
                Marchează ca plătită
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  {#if upcomingPayments.length > 0}
    <div class="alert alert-info" transition:slide>
      <h3>📅 Plăți apropiate</h3>
      <div class="payment-list">
        {#each upcomingPayments as payment}
          <div class="payment-alert">
            <div>
              <strong>{payment.name}</strong>
              <span class="text-muted"> - în {payment.daysUntil} zile</span>
            </div>
            <div class="payment-actions">
              <span class="amount">{payment.amount} RON</span>
              <button class="btn-pay" on:click={() => markAsPaid(payment)}>
                Plătește acum
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Cash Flow Projection -->
  <div class="projection-section">
    <h3>📊 Proiecție cheltuieli recurente</h3>
    <div class="projection-cards">
      {#each projection as month}
        <div class="projection-card">
          <div class="month">{month.month}</div>
          <div class="amount">{month.amount.toFixed(2)} RON</div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Payments List -->
  <div class="payments-section">
    <div class="section-header">
      <h2>Plăți recurente</h2>
      <button class="btn-add" on:click={addPayment}>
        ➕ Adaugă plată
      </button>
    </div>
    
    <div class="payments-grid">
      {#each recurringPayments as payment}
        <div class="payment-card" class:inactive={!payment.active} transition:fade>
          <div class="payment-header">
            <h3>{payment.name}</h3>
            <div class="payment-menu">
              <button class="btn-icon" on:click={() => toggleActive(payment)}>
                {payment.active ? '✅' : '⏸️'}
              </button>
              <button class="btn-icon" on:click={() => editPayment(payment)}>
                ✏️
              </button>
              <button class="btn-icon" on:click={() => deletePayment(payment)}>
                🗑️
              </button>
            </div>
          </div>
          
          <div class="payment-details">
            <div class="detail-row">
              <span class="label">Sumă:</span>
              <span class="value">{payment.amount} RON</span>
            </div>
            <div class="detail-row">
              <span class="label">Frecvență:</span>
              <span class="value">{frequencies.find(f => f.value === payment.frequency)?.label}</span>
            </div>
            <div class="detail-row">
              <span class="label">Următoarea plată:</span>
              <span class="value">{new Date(payment.nextDue).toLocaleDateString('ro-RO')}</span>
            </div>
            {#if payment.lastPaid}
              <div class="detail-row">
                <span class="label">Ultima plată:</span>
                <span class="value">{new Date(payment.lastPaid).toLocaleDateString('ro-RO')}</span>
              </div>
            {/if}
            <div class="detail-row">
              <span class="label">Categorie:</span>
              <span class="value">{payment.category}</span>
            </div>
            {#if payment.autoAdd}
              <div class="auto-badge">🤖 Auto-pay activ</div>
            {/if}
            {#if payment.notes}
              <div class="notes">{payment.notes}</div>
            {/if}
          </div>
          
          {#if payment.active}
            <button class="btn-mark-paid" on:click={() => markAsPaid(payment)}>
              ✅ Marchează ca plătită
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Add/Edit Modal -->
  {#if showAddModal}
    <div class="modal-overlay" on:click={() => showAddModal = false}>
      <div class="modal" on:click|stopPropagation transition:fade>
        <div class="modal-header">
          <h2>{editingPayment ? 'Editează' : 'Adaugă'} plată recurentă</h2>
          <button class="close-btn" on:click={() => showAddModal = false}>✕</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>Nume plată *</label>
            <input 
              type="text" 
              bind:value={formData.name}
              placeholder="ex: Chirie, Netflix, Internet"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Sumă (RON) *</label>
              <input 
                type="number" 
                bind:value={formData.amount}
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div class="form-group">
              <label>Categorie</label>
              <select bind:value={formData.category}>
                {#each categories as cat}
                  <option value={cat}>{cat}</option>
                {/each}
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Frecvență</label>
              <select bind:value={formData.frequency}>
                {#each frequencies as freq}
                  <option value={freq.value}>{freq.label}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label>Următoarea plată</label>
              <input 
                type="date" 
                bind:value={formData.nextDue}
              />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Cont plătitor</label>
              <select bind:value={formData.account}>
                {#each $accounts as account}
                  <option value={account.id}>{account.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="form-group">
              <label>Reminder (zile înainte)</label>
              <input 
                type="number" 
                bind:value={formData.reminder}
                min="0"
                max="30"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>
              <input 
                type="checkbox" 
                bind:checked={formData.autoAdd}
              />
              Adaugă automat tranzacția la data scadentă
            </label>
          </div>
          
          <div class="form-group">
            <label>Note (opțional)</label>
            <textarea 
              bind:value={formData.notes}
              rows="2"
              placeholder="ex: Contract #12345"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" on:click={() => showAddModal = false}>
            Anulează
          </button>
          <button class="btn-save" on:click={savePayment}>
            💾 Salvează
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
.recurring-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--panel, white);
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card.warning {
  background: #fff3e0;
  border: 1px solid #ff9800;
}

.stat-card.info {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.stat-card.success {
  background: #e8f5e9;
  border: 1px solid #4caf50;
}

.stat-icon {
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--muted, #666);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--ink, #333);
}

.alert {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-danger {
  background: #ffebee;
  border: 1px solid #ef5350;
}

.alert-info {
  background: #e3f2fd;
  border: 1px solid #42a5f5;
}

.alert h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.payment-alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.payment-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.amount {
  font-weight: bold;
  color: var(--primary, #4CAF50);
}

.btn-pay {
  padding: 5px 10px;
  background: var(--primary, #4CAF50);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-pay:hover {
  opacity: 0.9;
}

.projection-section {
  margin: 30px 0;
}

.projection-section h3 {
  margin-bottom: 15px;
  color: var(--ink, #333);
}

.projection-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.projection-card {
  background: var(--panel, white);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.projection-card .month {
  font-size: 14px;
  color: var(--muted, #666);
  margin-bottom: 8px;
}

.projection-card .amount {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary, #4CAF50);
}

.payments-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: var(--ink, #333);
}

.btn-add {
  padding: 8px 16px;
  background: var(--primary, #4CAF50);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  opacity: 0.9;
}

.payments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.payment-card {
  background: var(--panel, white);
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.payment-card.inactive {
  opacity: 0.6;
  background: #f5f5f5;
}

.payment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.payment-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--ink, #333);
}

.payment-menu {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: rgba(0,0,0,0.05);
}

.payment-details {
  margin-bottom: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.detail-row .label {
  color: var(--muted, #666);
}

.detail-row .value {
  font-weight: 500;
  color: var(--ink, #333);
}

.auto-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 8px;
}

.notes {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
  color: var(--muted, #666);
}

.btn-mark-paid {
  width: 100%;
  padding: 8px;
  background: var(--success, #4CAF50);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.btn-mark-paid:hover {
  opacity: 0.9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--panel, white);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--muted, #666);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: var(--ink, #333);
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="date"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 8px 20px;
  background: #f5f5f5;
  color: var(--ink, #333);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save {
  padding: 8px 20px;
  background: var(--primary, #4CAF50);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-save:hover,
.btn-cancel:hover {
  opacity: 0.9;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .payments-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
    margin: 10px;
  }
  
  .projection-cards {
    grid-template-columns: 1fr;
  }
}

/* Dark mode support */
:global(.dark) .payment-card {
  background: #2a2a2a;
  color: #e0e0e0;
}

:global(.dark) .modal {
  background: #1a1a1a;
  color: #e0e0e0;
}

:global(.dark) .modal-header,
:global(.dark) .modal-footer {
  border-color: #3a3a3a;
}

:global(.dark) input,
:global(.dark) select,
:global(.dark) textarea {
  background: #2a2a2a;
  color: #e0e0e0;
  border-color: #3a3a3a;
}

:global(.dark) .alert-danger {
  background: #3a1a1a;
}

:global(.dark) .alert-info {
  background: #1a2a3a;
}

:global(.dark) .payment-alert {
  background: #2a2a2a;
}

:global(.dark) .notes {
  background: #3a3a3a;
}

:global(.dark) .detail-row .label {
  color: #aaa;
}

.text-muted {
  color: var(--muted, #666);
}
</style>