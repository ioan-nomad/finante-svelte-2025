<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  
  export let transaction = null;
  export let accounts = [];
  
  const dispatch = createEventDispatcher();
  
  // Copie locală pentru editare
  let editData = transaction ? {...transaction} : null;
  
  // Categorii
  const expenseCategories = [
    'Alimente', 'Transport', 'Utilități', 'Sănătate', 
    'Entertainment', 'Shopping', 'Restaurant', 'Educație',
    'Sport', 'Abonamente', 'ATM Cash', 'Altele'
  ];
  
  const incomeCategories = [
    'Salariu', 'Freelance', 'Investiții', 'Cadouri', 
    'Vânzări', 'Cashback', 'Altele'
  ];
  
  $: categories = editData?.type === 'income' ? incomeCategories : 
                  editData?.type === 'expense' ? expenseCategories : [];
  
  function handleSave() {
    if (!editData.amount || editData.amount <= 0) {
      alert('Suma trebuie să fie mai mare decât 0');
      return;
    }
    dispatch('save', editData);
  }
  
  function handleClose() {
    dispatch('close');
  }
  
  function handleDelete() {
    if (confirm('Sigur vrei să ștergi această tranzacție?')) {
      dispatch('delete', transaction.id);
    }
  }
</script>

{#if editData}
  <div class="modal-overlay" on:click={handleClose} transition:fade={{duration: 200}}>
    <div class="modal-content" on:click|stopPropagation transition:slide={{duration: 300}}>
      <div class="modal-header">
        <h2>✏️ Editează tranzacție</h2>
        <button class="close-btn" on:click={handleClose}>✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Tip -->
        <div class="form-group">
          <label>Tip tranzacție</label>
          <div class="type-selector">
            <button 
              class:active={editData.type === 'income'}
              class:income={editData.type === 'income'}
              on:click={() => editData.type = 'income'}
            >
              ↓ Venit
            </button>
            <button 
              class:active={editData.type === 'expense'}
              class:expense={editData.type === 'expense'}
              on:click={() => editData.type = 'expense'}
            >
              ↑ Cheltuială
            </button>
            <button 
              class:active={editData.type === 'transfer'}
              class:transfer={editData.type === 'transfer'}
              on:click={() => editData.type = 'transfer'}
            >
              ↔ Transfer
            </button>
          </div>
        </div>
        
        <!-- Sumă -->
        <div class="form-group">
          <label for="edit-amount">Sumă</label>
          <input 
            id="edit-amount"
            type="number" 
            bind:value={editData.amount}
            step="0.01"
            class="amount-input"
          />
        </div>
        
        <!-- Descriere -->
        <div class="form-group">
          <label for="edit-desc">Descriere</label>
          <input 
            id="edit-desc"
            type="text" 
            bind:value={editData.description}
          />
        </div>
        
        <!-- Categorie -->
        {#if editData.type !== 'transfer'}
          <div class="form-group">
            <label for="edit-cat">Categorie</label>
            <select id="edit-cat" bind:value={editData.category}>
              <option value="">-- Selectează --</option>
              {#each categories as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
        {/if}
        
        <!-- Conturi -->
        <div class="form-row">
          {#if editData.type === 'expense' || editData.type === 'transfer'}
            <div class="form-group">
              <label for="edit-from">Din cont</label>
              <select id="edit-from" bind:value={editData.fromAccount}>
                <option value="">-- Selectează --</option>
                {#each accounts as acc}
                  <option value={acc.id}>{acc.name}</option>
                {/each}
              </select>
            </div>
          {/if}
          
          {#if editData.type === 'income' || editData.type === 'transfer'}
            <div class="form-group">
              <label for="edit-to">În cont</label>
              <select id="edit-to" bind:value={editData.toAccount}>
                <option value="">-- Selectează --</option>
                {#each accounts as acc}
                  <option value={acc.id}>{acc.name}</option>
                {/each}
              </select>
            </div>
          {/if}
        </div>
        
        <!-- Data și Persoană -->
        <div class="form-row">
          <div class="form-group">
            <label for="edit-date">Data</label>
            <input 
              id="edit-date"
              type="date" 
              bind:value={editData.date}
            />
          </div>
          
          <div class="form-group">
            <label for="edit-person">Persoană</label>
            <select id="edit-person" bind:value={editData.person}>
              <option value="">-- Selectează --</option>
              <option>Ioan</option>
              <option>Nico</option>
              <option>Comun</option>
              <option>Firmă Nico</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-delete" on:click={handleDelete}>
          🗑️ Șterge
        </button>
        <div class="footer-right">
          <button class="btn-cancel" on:click={handleClose}>Anulează</button>
          <button class="btn-save" on:click={handleSave}>
            💾 Salvează
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  
  .modal-content {
    background: var(--bg-primary, white);
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color, #ddd);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h2 {
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  
  .close-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.9rem;
    color: var(--text-muted, #666);
  }
  
  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--input-bg, white);
    color: var(--text-primary, #333);
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--primary, #007bff);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
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
  
  .type-selector button {
    padding: 8px;
    border: 2px solid var(--border-color, #ddd);
    background: var(--bg-secondary, #f8f9fa);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .type-selector button:hover {
    border-color: var(--primary, #007bff);
  }
  
  .type-selector button.active {
    color: white;
    border-color: transparent;
  }
  
  .type-selector button.active.income {
    background: #28a745;
  }
  
  .type-selector button.active.expense {
    background: #dc3545;
  }
  
  .type-selector button.active.transfer {
    background: #007bff;
  }
  
  .modal-footer {
    padding: 20px;
    border-top: 1px solid var(--border-color, #ddd);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .footer-right {
    display: flex;
    gap: 12px;
  }
  
  .btn-save, .btn-cancel, .btn-delete {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  
  .btn-save {
    background: var(--primary, #007bff);
    color: white;
  }
  
  .btn-save:hover {
    background: #0056b3;
  }
  
  .btn-cancel {
    background: var(--bg-secondary, #f8f9fa);
    color: var(--text-primary, #333);
  }
  
  .btn-cancel:hover {
    background: #e2e6ea;
  }
  
  .btn-delete {
    background: #fff5f5;
    color: #dc3545;
    border: 1px solid #dc3545;
  }
  
  .btn-delete:hover {
    background: #dc3545;
    color: white;
  }
  
  /* Dark mode */
  :global(body.dark) .modal-content {
    background: #1a1a1a;
    color: #e0e0e0;
  }
  
  :global(body.dark) .modal-header,
  :global(body.dark) .modal-footer {
    border-color: #333;
  }
  
  :global(body.dark) input,
  :global(body.dark) select {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  :global(body.dark) .type-selector button {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  :global(body.dark) .btn-cancel {
    background: #2a2a2a;
    color: #e0e0e0;
  }
  
  :global(body.dark) .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>