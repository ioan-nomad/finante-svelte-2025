<script>
  import * as pdfjsLib from 'pdfjs-dist';
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let fileInput;
  let extractedData = [];
  let isProcessing = false;
  let previewMode = false;
  
  const BANK_PATTERNS = {
    'BT': ['BANCA TRANSILVANIA', 'BT24'],
    'BCR': ['BCR', 'BANCA COMERCIALA ROMANA'],
    'ING': ['ING BANK', 'ING Personal'],
    'Raiffeisen': ['RAIFFEISEN BANK'],
    'UniCredit': ['UNICREDIT BANK']
  };
  
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') return;
    
    isProcessing = true;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += pageText + '\n';
      }
      
      const transactions = parseTransactions(allText);
      extractedData = transactions;
      previewMode = true;
    } catch (error) {
      console.error('Eroare procesare PDF:', error);
      alert('Eroare la procesarea PDF-ului');
    }
    isProcessing = false;
  }
  
  function parseTransactions(text) {
    const transactions = [];
    const lines = text.split('\n');
    
    const dateRegex = /(\d{2}[\.\/-]\d{2}[\.\/-]\d{4})/;
    const amountRegex = /([\d,]+\.\d{2})/;
    
    lines.forEach(line => {
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);
      
      if (dateMatch && amountMatch) {
        const date = dateMatch[1].replace(/[\.\/-]/g, '-');
        const amount = parseFloat(amountMatch[1].replace(',', ''));
        
        const isExpense = line.includes('Plata') || line.includes('Cumparare') || 
                         line.includes('Retragere') || line.includes('Comision');
        
        transactions.push({
          date: formatDate(date),
          amount: amount,
          description: extractDescription(line),
          type: isExpense ? 'expense' : 'income',
          category: detectCategory(line)
        });
      }
    });
    
    return transactions;
  }
  
  function formatDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }
  
  function extractDescription(line) {
    const remove = ['Tranzactie', 'Cumparare', 'POS', 'Plata', 'Transfer'];
    let desc = line;
    remove.forEach(word => {
      desc = desc.replace(new RegExp(word, 'gi'), '');
    });
    return desc.trim().substring(0, 50);
  }
  
  function detectCategory(description) {
    const categories = {
      'Alimente': /Lidl|Kaufland|Carrefour|Auchan|Mega|Profi/i,
      'Transport': /OMV|Petrom|Rompetrol|MOL|Lukoil|Benzin/i,
      'Utilități': /Enel|EON|Electrica|Engie|Digi|RDS|RCS/i,
      'Sănătate': /Farmaci|Catena|Sensiblu|Help|Dr\./i,
      'Entertainment': /Cinema|Netflix|Spotify|Steam|HBO/i,
      'ATM Cash': /ATM|Retragere|Cash/i
    };
    
    for (const [category, regex] of Object.entries(categories)) {
      if (regex.test(description)) return category;
    }
    return 'Altele';
  }
  
  function confirmImport() {
    dispatch('import', extractedData);
    closeImporter();
  }
  
  function closeImporter() {
    extractedData = [];
    previewMode = false;
    if (fileInput) fileInput.value = '';
    dispatch('close');
  }
</script>

<div class="pdf-importer-overlay" on:click={closeImporter}>
  <div class="pdf-importer-modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📄 Import Extras Bancar PDF</h2>
      <button class="close-btn" on:click={closeImporter}>✕</button>
    </div>
    
    {#if !previewMode}
      <div class="upload-area">
        <input
          bind:this={fileInput}
          type="file"
          accept="application/pdf"
          on:change={handleFileSelect}
          id="pdf-input"
        />
        <label for="pdf-input" class="upload-label">
          {#if isProcessing}
            <div class="spinner">⏳ Procesare...</div>
          {:else}
            <div class="upload-icon">📄</div>
            <p>Click pentru selectare PDF sau trage fișierul aici</p>
            <small>Suport: BT, BCR, ING, Raiffeisen, UniCredit</small>
          {/if}
        </label>
      </div>
    {:else}
      <div class="preview-area">
        <h3>✅ {extractedData.length} tranzacții detectate</h3>
        
        <div class="transactions-preview">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descriere</th>
                <th>Sumă</th>
                <th>Tip</th>
                <th>Categorie</th>
              </tr>
            </thead>
            <tbody>
              {#each extractedData.slice(0, 10) as t}
                <tr>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td class:income={t.type === 'income'} class:expense={t.type === 'expense'}>
                    {t.amount.toFixed(2)} RON
                  </td>
                  <td>{t.type === 'income' ? '↓' : '↑'}</td>
                  <td>{t.category}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          
          {#if extractedData.length > 10}
            <p class="more-info">...și încă {extractedData.length - 10} tranzacții</p>
          {/if}
        </div>
        
        <div class="import-actions">
          <button class="btn-cancel" on:click={() => previewMode = false}>
            ← Înapoi
          </button>
          <button class="btn-import" on:click={confirmImport}>
            ✅ Importă Toate
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .pdf-importer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .pdf-importer-modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }
  
  .upload-area {
    padding: 40px;
    text-align: center;
  }
  
  #pdf-input {
    display: none;
  }
  
  .upload-label {
    display: block;
    padding: 60px;
    border: 2px dashed #4CAF50;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .upload-label:hover {
    background: #f0f8f0;
    border-color: #45a049;
  }
  
  .upload-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }
  
  .preview-area {
    padding: 20px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
  }
  
  .income {
    color: #4CAF50;
  }
  
  .expense {
    color: #f44336;
  }
  
  .import-actions {
    display: flex;
    justify-content: space-between;
    padding: 20px;
    border-top: 1px solid #eee;
  }
  
  .btn-import {
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .btn-cancel {
    background: #f5f5f5;
    color: #333;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  
  :global(body.dark) .pdf-importer-modal {
    background: #1e1e1e;
    color: #e0e0e0;
  }
  
  :global(body.dark) .modal-header,
  :global(body.dark) .import-actions {
    border-color: #333;
  }
  
  :global(body.dark) .upload-label {
    border-color: #4CAF50;
    background: #252525;
  }
  
  :global(body.dark) .upload-label:hover {
    background: #2a2a2a;
  }
  
  :global(body.dark) th {
    background: #2a2a2a;
  }
  
  :global(body.dark) td {
    border-color: #333;
  }
</style>