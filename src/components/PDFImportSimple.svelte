<script>
  import { onMount } from 'svelte';
  import { transactions } from '../modules/finance/stores/financeStore.js';
  
  let fileInput;
  let isProcessing = false;
  let extractedData = [];
  let showPreview = false;
  
  export let onClose;
  
  async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    isProcessing = true;
    
    // Citește PDF ca text simplu
    const text = await file.text();
    
    // Pattern-uri pentru bănci românești
    const patterns = [
      // Banca Transilvania
      /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(-?\d+(?:\.\d{3})*,\d{2})/g,
      // Format generic
      /(\d{2}[-.\/]\d{2}[-.\/]\d{4})\s+(.+?)\s+(-?\d+(?:[.,]\d{3})*[.,]\d{2})/g
    ];
    
    let matches = [];
    for (const pattern of patterns) {
      const found = [...text.matchAll(pattern)];
      if (found.length > 0) {
        matches = found;
        break;
      }
    }
    
    extractedData = matches.map(match => {
      const dateStr = match[1];
      const description = match[2] || match[3];
      const amountStr = match[3] || match[4];
      
      // Conversie sumă
      const amount = parseFloat(
        amountStr
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '')
      );
      
      // Conversie dată
      const [day, month, year] = dateStr.split(/[-.\/]/);
      const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Detectare tip și categorie
      const type = amount < 0 ? 'expense' : 'income';
      let category = 'Altele';
      
      const desc = description.toUpperCase();
      if (desc.includes('LIDL') || desc.includes('KAUFLAND') || desc.includes('CARREFOUR')) {
        category = 'Alimente';
      } else if (desc.includes('OMV') || desc.includes('MOL') || desc.includes('PETROM')) {
        category = 'Transport';
      } else if (desc.includes('RESTAURANT') || desc.includes('PIZZA')) {
        category = 'Restaurant';
      } else if (desc.includes('TRANSFER')) {
        category = 'Transfer';
      }
      
      return {
        date,
        description: description.substring(0, 50),
        amount: Math.abs(amount),
        type,
        category,
        selected: true
      };
    }).filter(t => t.amount > 0);
    
    if (extractedData.length > 0) {
      showPreview = true;
    } else {
      alert('Nu am găsit tranzacții. Trimite PDF-ul la support pentru adăugare format.');
    }
    
    isProcessing = false;
  }
  
  function importSelected() {
    const toImport = extractedData.filter(t => t.selected);
    
    transactions.update(txs => {
      const newTxs = toImport.map(t => ({
        id: Date.now() + Math.random(),
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        account: 'Principal',
        person: 'Ioan'
      }));
      return [...txs, ...newTxs];
    });
    
    alert(`✅ ${toImport.length} tranzacții importate!`);
    onClose();
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📄 Import PDF Bancar</h2>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>
    
    <div class="modal-body">
      {#if !showPreview}
        <div class="upload-zone">
          <input
            bind:this={fileInput}
            type="file"
            accept=".pdf,.txt"
            on:change={handleFile}
            id="pdf-input"
          />
          <label for="pdf-input" class="upload-label">
            {#if isProcessing}
              <div class="spinner"></div>
              <p>Procesare...</p>
            {:else}
              <span class="upload-icon">📄</span>
              <p>Click pentru selectare PDF</p>
              <p class="hint">Suport: Banca Transilvania, BCR, ING</p>
            {/if}
          </label>
        </div>
      {:else}
        <div class="preview">
          <h3>Tranzacții găsite: {extractedData.length}</h3>
          <div class="transactions-list">
            {#each extractedData as tx, i}
              <div class="tx-item">
                <input
                  type="checkbox"
                  bind:checked={tx.selected}
                />
                <span class="tx-date">{tx.date}</span>
                <span class="tx-desc">{tx.description}</span>
                <span class="tx-amount {tx.type}">
                  {tx.type === 'expense' ? '-' : '+'}{tx.amount.toFixed(2)} RON
                </span>
              </div>
            {/each}
          </div>
          <div class="actions">
            <button class="btn-secondary" on:click={() => showPreview = false}>
              Înapoi
            </button>
            <button class="btn-primary" on:click={importSelected}>
              Importă {extractedData.filter(t => t.selected).length} tranzacții
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #6b7280;
  }
  
  .modal-body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .upload-zone {
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
  }
  
  #pdf-input {
    display: none;
  }
  
  .upload-label {
    cursor: pointer;
    display: block;
  }
  
  .upload-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 10px;
  }
  
  .hint {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .preview h3 {
    margin-bottom: 15px;
  }
  
  .transactions-list {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 20px;
  }
  
  .tx-item {
    display: grid;
    grid-template-columns: 30px 100px 1fr 120px;
    gap: 10px;
    padding: 8px;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
  }
  
  .tx-date {
    font-size: 12px;
    color: #6b7280;
  }
  
  .tx-desc {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .tx-amount {
    font-weight: 600;
    text-align: right;
  }
  
  .tx-amount.income { color: #10b981; }
  .tx-amount.expense { color: #ef4444; }
  
  .actions {
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }
  
  .btn-primary, .btn-secondary {
    padding: 10px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: 500;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
  }
</style>