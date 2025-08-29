<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { CATEGORIES } from '../lib/store.js';
  
  export let transaction = null;
  export let accounts = [];
  
  const dispatch = createEventDispatcher();
  
  // Copie locală pentru editare
  let editData = transaction ? {...transaction} : null;
  
  // Validation state
  let errors = {};
  let isSubmitting = false;
  
  // Reactive categories based on transaction type using store  
  $: categories = editData?.type ? (CATEGORIES[editData.type] || []) : [];
  
  // Track previous type to handle category clearing only when type actually changes
  let previousType = editData?.type;
  
  function validateForm() {
    errors = {};
    
    // Amount validation
    if (!editData.amount || parseFloat(editData.amount) <= 0) {
      errors.amount = 'Suma trebuie să fie mai mare decât 0';
    }
    
    // Date validation
    if (!editData.date) {
      errors.date = 'Data este obligatorie';
    }
    
    // Type-specific validations
    if (editData.type === 'expense' || editData.type === 'transfer') {
      if (!editData.fromAccount) {
        errors.fromAccount = 'Selectează contul sursă';
      }
    }
    
    if (editData.type === 'income' || editData.type === 'transfer') {
      if (!editData.toAccount) {
        errors.toAccount = 'Selectează contul destinație';
      }
    }
    
    // Transfer validation - accounts should be different
    if (editData.type === 'transfer' && editData.fromAccount && editData.toAccount) {
      if (editData.fromAccount === editData.toAccount) {
        errors.toAccount = 'Contul destinație trebuie să fie diferit de cel sursă';
      }
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function handleSave() {
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }
    
    isSubmitting = true;
    
    // Clean up data based on transaction type
    const cleanData = {
      ...editData,
      amount: parseFloat(editData.amount),
      // Ensure correct account fields based on type
      fromAccount: editData.type === 'income' ? null : editData.fromAccount,
      toAccount: editData.type === 'expense' ? null : editData.toAccount
    };
    
    dispatch('save', cleanData);
    isSubmitting = false;
  }
  
  function handleClose() {
    dispatch('close');
  }
  
  function handleDelete() {
    if (confirm('Sigur vrei să ștergi această tranzacție?')) {
      dispatch('delete', transaction.id);
    }
  }
  
  function handleTypeChange(newType) {
    // Only process if type actually changed
    if (previousType !== newType) {
      editData.type = newType;
      
      // Clear category if it's not valid for the new type
      const newCategories = CATEGORIES[newType] || [];
      if (editData.category && !newCategories.includes(editData.category)) {
        editData.category = '';
      }
      
      // Reset accounts when changing type to avoid invalid states
      if (newType === 'income') {
        editData.fromAccount = '';
      } else if (newType === 'expense') {
        editData.toAccount = '';
      }
      
      // Update previous type tracker
      previousType = newType;
    }
  }
  
  function getAccountName(accountId) {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.name} (${account.currency})` : '';
  }
  
  // Handle ESC key to close modal
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if editData}
  <div class="modal-overlay" on:click={handleClose} transition:fade={{duration: 200}}>
    <div class="modal-content" on:click|stopPropagation transition:slide={{duration: 300}}>
      <div class="modal-header">
        <h2>✏️ Editează tranzacție</h2>
        <button class="close-btn" on:click={handleClose} type="button">×</button>
      </div>
      
      <form class="modal-body" on:submit|preventDefault={handleSave}>
        <!-- Tip tranzacție -->
        <div class="form-group">
          <label>Tip tranzacție</label>
          <div class="type-selector">
            <button 
              type="button"
              class="type-btn"
              class:active={editData.type === 'income'}
              on:click={() => handleTypeChange('income')}
            >
              ↓ Venit
            </button>
            <button 
              type="button"
              class="type-btn"
              class:active={editData.type === 'expense'}
              on:click={() => handleTypeChange('expense')}
            >
              ↑ Cheltuială
            </button>
            <button 
              type="button"
              class="type-btn"
              class:active={editData.type === 'transfer'}
              on:click={() => handleTypeChange('transfer')}
            >
              ↔ Transfer
            </button>
          </div>
        </div>
        
        <!-- Sumă și Data -->
        <div class="form-row">
          <div class="form-group">
            <label for="edit-amount">Sumă *</label>
            <input 
              id="edit-amount"
              type="number" 
              bind:value={editData.amount}
              step="0.01"
              min="0.01"
              class="amount-input"
              class:error={errors.amount}
              required
            />
            {#if errors.amount}
              <span class="error-text">{errors.amount}</span>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="edit-date">Data *</label>
            <input 
              id="edit-date"
              type="date" 
              bind:value={editData.date}
              class:error={errors.date}
              required
            />
            {#if errors.date}
              <span class="error-text">{errors.date}</span>
            {/if}
          </div>
        </div>
        
        <!-- Descriere -->
        <div class="form-group">
          <label for="edit-desc">Descriere</label>
          <input 
            id="edit-desc"
            type="text" 
            bind:value={editData.description}
            placeholder="Descriere opțională"
            maxlength="200"
          />
        </div>
        
        <!-- Categorie -->
        {#if editData.type !== 'transfer'}
          <div class="form-group">
            <label for="edit-cat">Categorie</label>
            <select 
              id="edit-cat" 
              bind:value={editData.category}
              class:error={errors.category}
            >
              <option value="">-- Selectează categoria --</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
            {#if errors.category}
              <span class="error-text">{errors.category}</span>
            {/if}
          </div>
        {/if}
        
        <!-- Conturi -->
        <div class="form-row">
          {#if editData.type === 'expense' || editData.type === 'transfer'}
            <div class="form-group">
              <label for="edit-from">Din cont *</label>
              <select 
                id="edit-from" 
                bind:value={editData.fromAccount}
                class:error={errors.fromAccount}
                required
              >
                <option value="">-- Selectează contul --</option>
                {#each accounts as acc}
                  <option value={acc.id}>{getAccountName(acc.id)}</option>
                {/each}
              </select>
              {#if errors.fromAccount}
                <span class="error-text">{errors.fromAccount}</span>
              {/if}
            </div>
          {/if}
          
          {#if editData.type === 'income' || editData.type === 'transfer'}
            <div class="form-group">
              <label for="edit-to">În cont *</label>
              <select 
                id="edit-to" 
                bind:value={editData.toAccount}
                class:error={errors.toAccount}
                required
              >
                <option value="">-- Selectează contul --</option>
                {#each accounts as acc}
                  <option value={acc.id}>{getAccountName(acc.id)}</option>
                {/each}
              </select>
              {#if errors.toAccount}
                <span class="error-text">{errors.toAccount}</span>
              {/if}
            </div>
          {/if}
        </div>
        
        <!-- Persoană -->
        <div class="form-group">
          <label for="edit-person">Persoană</label>
          <select id="edit-person" bind:value={editData.person}>
            <option value="">-- Selectează persoana --</option>
            <option value="Ioan">Ioan</option>
            <option value="Nico">Nico</option>
            <option value="Comun">Comun</option>
            <option value="Firmă Nico">Firmă Nico</option>
          </select>
        </div>
      </form>
      
      <div class="modal-footer">
        <button 
          type="button" 
          class="btn-delete" 
          on:click={handleDelete}
        >
          🗑️ Șterge
        </button>
        
        <div class="footer-right">
          <button 
            type="button" 
            class="btn-cancel" 
            on:click={handleClose}
          >
            Anulează
          </button>
          <button 
            type="button" 
            class="btn-save" 
            on:click={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Se salvează...' : '✅ Salvează'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .modal-content {
    background: var(--panel);
    border-radius: 14px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(128, 184, 255, .2);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(128, 184, 255, .2);
  }
  
  .modal-header h2 {
    margin: 0;
    color: var(--acc);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: var(--muted);
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: var(--panel2);
    color: var(--ink);
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  input, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #28304b;
    border-radius: 10px;
    font-size: 14px;
    background: var(--panel2);
    color: var(--ink);
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--acc);
    box-shadow: 0 0 0 3px rgba(128, 184, 255, 0.1);
  }
  
  input.error, select.error {
    border-color: var(--err);
  }
  
  .error-text {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--err);
  }
  
  .amount-input {
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .type-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .type-btn {
    padding: 10px 12px;
    border: 1px solid #28304b;
    background: var(--panel2);
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    transition: all 0.2s;
  }
  
  .type-btn:hover {
    border-color: var(--acc);
    background: rgba(128, 184, 255, .12);
  }
  
  .type-btn.active {
    background: var(--acc);
    color: #08131a;
    border-color: var(--acc);
  }
  
  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px 20px;
    border-top: 1px solid rgba(128, 184, 255, .2);
  }
  
  .footer-right {
    display: flex;
    gap: 12px;
  }
  
  .btn-save, .btn-cancel, .btn-delete {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
  }
  
  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-save:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .btn-cancel {
    background: transparent;
    outline: 1px solid #2a3354;
    color: var(--ink);
  }
  
  .btn-cancel:hover {
    background: var(--panel2);
  }
  
  .btn-delete {
    background: var(--err);
    color: white;
  }
  
  .btn-delete:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  /* Dark mode support */
  :global(html.dark) .modal-content {
    background: var(--bg-primary, #2d2d2d);
    border-color: var(--border-color, #374151);
  }
  
  :global(html.dark) .modal-header {
    border-color: var(--border-color, #374151);
  }
  
  :global(html.dark) .modal-footer {
    border-color: var(--border-color, #374151);
  }
  
  :global(html.dark) input,
  :global(html.dark) select {
    background: var(--input-bg, #374151);
    border-color: var(--border-color, #4b5563);
    color: var(--text-primary, #f9fafb);
  }
  
  :global(html.dark) .type-btn {
    background: var(--bg-secondary, #374151);
    color: var(--text-secondary, #d1d5db);
    border-color: var(--border-color, #4b5563);
  }
  
  :global(html.dark) .close-btn:hover {
    background: var(--bg-secondary, #374151);
  }
  
  :global(html.dark) .btn-cancel {
    background: transparent;
    color: var(--text-primary, #f9fafb);
    border-color: var(--border-color, #4b5563);
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .modal-overlay {
      padding: 10px;
    }
    
    .modal-content {
      max-height: 95vh;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .type-selector {
      grid-template-columns: 1fr;
    }
    
    .modal-footer {
      flex-direction: column;
      gap: 12px;
    }
    
    .footer-right {
      width: 100%;
      justify-content: stretch;
    }
    
    .btn-save, .btn-cancel {
      flex: 1;
    }
  }
</style>