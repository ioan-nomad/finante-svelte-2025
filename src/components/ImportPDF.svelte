<!-- components/ImportPDF.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as pdfjsLib from 'pdfjs-dist';
  import { 
    accounts, 
    addTransaction,
    CATEGORIES,
    suggestCategory,
    normalizeDate,
    fmt,
    formatDate
  } from '../lib/store.js';
  
  // Set worker path for PDF.js
  onMount(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  });
  
  // State
  let importAccount = $accounts[0]?.id || '';
  let importPerson = 'Ioan';
  let rawText = '';
  let extracted = [];
  let showPreview = false;
  let isDragging = false;
  
  // File input ref
  let fileInput;
  
  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      processPDF(file);
    }
  }
  
  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }
  
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      processPDF(file);
    }
  }
  
  async function processPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const items = content.items;
        
        let pageLines = [];
        let buffer = [];
        let yPrev = null;
        
        for (const item of items) {
          const y = Math.round(item.transform[5]);
          if (yPrev === null) yPrev = y;
          const sameLine = Math.abs(y - yPrev) <= 2;
          
          if (!sameLine && buffer.length) {
            pageLines.push(buffer.map(x => x.str).join(' '));
            buffer = [item];
            yPrev = y;
          } else {
            buffer.push(item);
          }
        }
        
        if (buffer.length) {
          pageLines.push(buffer.map(x => x.str).join(' '));
        }
        
        lines.push(...pageLines);
      }
      
      rawText = lines.join('\n');
      parseTransactions(lines);
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Eroare la procesarea PDF-ului');
    }
  }
  
  function parseTransactions(lines) {
    extracted = [];
    const patterns = [
      /(\d{2}[.\/\-]\d{2}[.\/\-]\d{4})\s+(.+?)\s+([+-]?\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/,
      /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([+-]?\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/
    ];
    
    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, date, desc, amountStr] = match;
          const amount = parseFloat(
            amountStr
              .replace(/[.,]/g, m => m === ',' ? '.' : '')
              .replace(/[^\d.-]/g, '')
          );
          
          if (amount && amount !== 0) {
            const type = amount > 0 ? 'income' : 'expense';
            const category = suggestCategory(desc, type);
            
            extracted.push({
              date: normalizeDate(date),
              description: desc.trim(),
              amount: Math.abs(amount),
              type,
              category,
              selected: true
            });
          }
          break;
        }
      }
    }
    
    if (extracted.length) {
      showPreview = true;
    } else {
      alert('Nu am găsit tranzacții în PDF');
    }
  }
  
  function updateExtracted(index, field, value) {
    extracted[index][field] = value;
    extracted = extracted; // Trigger reactivity
  }
  
  function selectAll() {
    extracted = extracted.map(t => ({ ...t, selected: true }));
  }
  
  function deselectAll() {
    extracted = extracted.map(t => ({ ...t, selected: false }));
  }
  
  function importSelected() {
    const toImport = extracted.filter(t => t.selected);
    
    if (!toImport.length) {
      alert('Selectează cel puțin o tranzacție');
      return;
    }
    
    toImport.forEach(t => {
      addTransaction({
        type: t.type,
        fromAccount: t.type === 'expense' ? importAccount : null,
        toAccount: t.type === 'income' ? importAccount : null,
        category: t.category,
        person: importPerson,
        amount: t.amount,
        date: t.date,
        description: t.description,
        imported: true
      });
    });
    
    showPreview = false;
    extracted = [];
    rawText = '';
    alert(`✅ ${toImport.length} tranzacții importate`);
  }
</script>

<div class="grid">
  <!-- Import section -->
  <div class="card">
    <h2>📄 Import extras PDF</h2>
    
    <div 
      class="drop {isDragging ? 'dragover' : ''}"
      on:drop={handleDrop}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:click={() => fileInput.click()}
    >
      Trage PDF-ul aici sau fă click
      <div class="meta">Procesare 100% locală</div>
    </div>
    
    <input 
      bind:this={fileInput}
      type="file" 
      accept="application/pdf" 
      on:change={handleFileSelect}
      hidden 
    />
    
    <div class="row" style="margin-top:8px">
      <div>
        <label>Import în cont</label>
        <select bind:value={importAccount}>
          {#each $accounts as acc}
            <option value={acc.id}>{acc.name} ({acc.currency})</option>
          {/each}
        </select>
      </div>
      <div>
        <label>Persoană implicită</label>
        <select bind:value={importPerson}>
          <option>Ioan</option>
          <option>Nico</option>
          <option>Comun</option>
          <option>Firmă Nico</option>
        </select>
      </div>
    </div>
    
    {#if rawText}
      <details>
        <summary>🛠️ Debug</summary>
        <div class="raw">{rawText}</div>
      </details>
    {/if}
  </div>

  <!-- Legend section -->
  <div class="card">
    <h2>📖 Cum funcționează</h2>
    <div class="help">
      <p><b>Pași pentru import:</b></p>
      <ol>
        <li>Descarcă extrasul PDF de la bancă</li>
        <li>Trage-l în zona de sus sau click pentru selectare</li>
        <li>Verifică tranzacțiile extrase</li>
        <li>Ajustează categoriile dacă e nevoie</li>
        <li>Click pe "Importă selectate"</li>
      </ol>
      
      <p><b>Detectare automată pentru:</b></p>
      <ul>
        <li>Lidl, Kaufland → Alimente</li>
        <li>Glovo, Tazz → Restaurant/Comenzi</li>
        <li>Uber, Bolt → Transport</li>
        <li>ATM → ATM Cash</li>
        <li>Netflix, Spotify → Abonamente</li>
      </ul>
    </div>
  </div>
</div>

<!-- Preview Modal -->
{#if showPreview}
  <div class="modal active">
    <div class="modal-card">
      <div class="modal-header">
        <h2>✅ Verifică tranzacții extrase</h2>
        <button class="red" on:click={() => showPreview = false}>Închide</button>
      </div>
      
      <div class="list">
        {#each extracted as t, i}
          {@const cls = t.type === 'income' ? 'inc' : 'exp'}
          
          <div class="item">
            <div>
              <div><b>{t.description}</b></div>
              <div class="meta">{formatDate(t.date)}</div>
              <div class="row">
                <div>
                  <label>Categorie</label>
                  <select 
                    value={t.category}
                    on:change={(e) => updateExtracted(i, 'category', e.target.value)}
                  >
                    {#each CATEGORIES[t.type] as cat}
                      <option value={cat}>{cat}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label>Import?</label>
                  <select 
                    value={t.selected ? '1' : '0'}
                    on:change={(e) => updateExtracted(i, 'selected', e.target.value === '1')}
                  >
                    <option value="1">Da</option>
                    <option value="0">Nu</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="right">
              <div class="amount {cls}">{fmt(t.amount)}</div>
            </div>
          </div>
        {/each}
      </div>
      
      <div class="stack">
        <button class="green" on:click={importSelected}>Importă selectate</button>
        <button class="yellow" on:click={selectAll}>Selectează toate</button>
        <button class="ghost" on:click={deselectAll}>Deselectează toate</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  
  @media (max-width: 980px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
  
  .card {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
  }
  
  .card h2 {
    margin: 0 0 12px;
    color: var(--acc);
    font-size: 1.1rem;
  }
  
  .drop {
    border: 2px dashed var(--acc);
    border-radius: 12px;
    padding: 40px 18px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .drop:hover,
  .drop.dragover {
    background: rgba(128, 184, 255, .12);
  }
  
  label {
    display: block;
    margin: 10px 0 6px;
    color: var(--muted);
    font-size: .9rem;
  }
  
  input, select {
    width: 100%;
    padding: 10px;
    border: 1px solid #28304b;
    border-radius: 10px;
    background: var(--panel2);
    color: var(--ink);
  }
  
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  details {
    background: var(--panel2);
    border-radius: 10px;
    padding: 8px;
    margin-top: 10px;
  }
  
  summary {
    cursor: pointer;
    padding: 4px;
  }
  
  .raw {
    white-space: pre-wrap;
    font-family: ui-monospace, monospace;
    color: #cfd5ea;
    max-height: 240px;
    overflow: auto;
    margin-top: 8px;
    font-size: 0.85rem;
  }
  
  .help {
    color: var(--muted);
    font-size: 0.9rem;
  }
  
  .help ol, .help ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  .modal {
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, .55);
    z-index: 50;
  }
  
  .modal.active {
    display: flex;
  }
  
  .modal-card {
    background: var(--panel);
    width: 92%;
    max-width: 980px;
    max-height: 86vh;
    overflow: auto;
    border-radius: 14px;
    padding: 16px;
  }
  
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .modal-header h2 {
    color: var(--acc);
    margin: 0;
  }
  
  .list {
    max-height: 60vh;
    overflow: auto;
    margin: 16px 0;
  }
  
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--panel2);
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .meta {
    color: var(--muted);
    font-size: .86rem;
  }
  
  .amount {
    font-weight: 900;
    font-size: 1.2rem;
  }
  
  .inc {
    color: var(--ok);
  }
  
  .exp {
    color: var(--err);
  }
  
  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .stack {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }
  
  button {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button.ghost {
    background: transparent;
    outline: 1px solid #2a3354;
    color: var(--ink);
  }
  
  button.red {
    background: var(--err);
  }
  
  button.green {
    background: var(--ok);
  }
  
  button.yellow {
    background: var(--warn);
  }
</style>