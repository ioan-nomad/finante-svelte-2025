<!-- components/Export.svelte -->
<script>
  import { jsPDF } from 'jspdf';
  import * as XLSX from 'xlsx';
  import { 
    accounts, 
    transactions,
    legend,
    computeAccountBalance,
    fmt,
    today,
    currentMonth
  } from '../lib/store.js';
  
  // File input for import backup
  let fileInput;
  
  function exportPDF() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Raport Financiar', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generat: ${new Date().toLocaleDateString('ro-RO')}`, 20, 30);
    
    // Account balances
    doc.setFontSize(14);
    doc.text('Solduri Conturi', 20, 45);
    doc.setFontSize(10);
    
    let y = 55;
    $accounts.forEach(acc => {
      const bal = computeAccountBalance(acc);
      doc.text(`${acc.name}: ${fmt(bal)} ${acc.currency}`, 25, y);
      y += 7;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    // Summary
    const currentMonthTx = $transactions.filter(t => 
      t.date && t.date.startsWith(currentMonth())
    );
    const income = currentMonthTx
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = currentMonthTx
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    y += 10;
    doc.setFontSize(14);
    doc.text('Sumar Luna Curentă', 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Venituri: ${fmt(income)} RON`, 25, y);
    y += 7;
    doc.text(`Cheltuieli: ${fmt(expense)} RON`, 25, y);
    y += 7;
    doc.text(`Economii: ${fmt(income - expense)} RON`, 25, y);
    
    // Recent transactions
    y += 15;
    doc.setFontSize(14);
    doc.text('Ultimele 10 Tranzacții', 20, y);
    y += 10;
    doc.setFontSize(9);
    
    const recentTx = $transactions.slice(0, 10);
    recentTx.forEach(t => {
      const type = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '±';
      doc.text(
        `${t.date} | ${type}${fmt(t.amount)} | ${t.category || ''} | ${t.description || ''}`.substring(0, 80),
        25, y
      );
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    
    doc.save(`raport_financiar_${today()}.pdf`);
  }
  
  function exportExcel() {
    const wb = XLSX.utils.book_new();
    
    // Accounts sheet
    const accountsData = $accounts.map(a => ({
      'Cont': a.name,
      'Tip': a.type,
      'Proprietar': a.owner,
      'Monedă': a.currency,
      'Sold Inițial': a.opening,
      'Sold Curent': computeAccountBalance(a)
    }));
    const ws1 = XLSX.utils.json_to_sheet(accountsData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Conturi');
    
    // Transactions sheet
    const txData = $transactions.map(t => ({
      'Data': t.date,
      'Tip': t.type,
      'Categorie': t.category,
      'Descriere': t.description,
      'Sumă': t.amount,
      'Din Cont': t.fromAccount ? $accounts.find(a => a.id === t.fromAccount)?.name : '',
      'În Cont': t.toAccount ? $accounts.find(a => a.id === t.toAccount)?.name : '',
      'Persoană': t.person,
      'Importat': t.imported ? 'DA' : 'NU'
    }));
    const ws2 = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Tranzacții');
    
    // Summary by category
    const categories = [...new Set($transactions.map(t => t.category).filter(Boolean))];
    const summaryData = categories.map(cat => {
      const catTx = $transactions.filter(t => t.category === cat);
      const income = catTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = catTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        'Categorie': cat,
        'Venituri': income,
        'Cheltuieli': expense,
        'Balanță': income - expense,
        'Tranzacții': catTx.length
      };
    });
    const ws3 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Sumar Categorii');
    
    // Monthly summary
    const months = [...new Set($transactions.map(t => t.date?.substring(0, 7)).filter(Boolean))].sort();
    const monthlyData = months.map(month => {
      const monthTx = $transactions.filter(t => t.date?.startsWith(month));
      const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        'Luna': month,
        'Venituri': income,
        'Cheltuieli': expense,
        'Economii': income - expense
      };
    });
    const ws4 = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Sumar Lunar');
    
    XLSX.writeFile(wb, `finante_${today()}.xlsx`);
  }
  
  function exportCSV() {
    let csv = 'Data,Tip,Categorie,Descriere,Suma,Din Cont,In Cont,Persoana\n';
    
    $transactions.forEach(t => {
      const from = t.fromAccount ? $accounts.find(a => a.id === t.fromAccount)?.name : '';
      const to = t.toAccount ? $accounts.find(a => a.id === t.toAccount)?.name : '';
      csv += `${t.date},${t.type},${t.category || ''},${t.description || ''},${t.amount},${from},${to},${t.person || ''}\n`;
    });
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tranzactii_${today()}.csv`;
    a.click();
  }
  
  function exportJSON() {
    const data = {
      version: '5.0-svelte',
      exported: new Date().toISOString(),
      accounts: $accounts,
      transactions: $transactions,
      legend: $legend
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finante_backup_${today()}.json`;
    a.click();
  }
  
  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.accounts && data.transactions) {
          // Update stores
          accounts.set(data.accounts);
          transactions.set(data.transactions);
          if (data.legend) legend.set(data.legend);
          
          alert('✅ Date restaurate cu succes');
        } else {
          alert('Fișier invalid');
        }
      } catch (err) {
        alert('Eroare la citirea fișierului');
      }
    };
    reader.readAsText(file);
  }
  
  function resetAll() {
    if (confirm('Ești sigur că vrei să ștergi TOATE datele?')) {
      if (confirm('Ultima confirmare - această acțiune nu poate fi anulată!')) {
        accounts.set([]);
        transactions.set([]);
        legend.set({});
        localStorage.clear();
        location.reload();
      }
    }
  }
</script>

<div class="export-container">
  <div class="card">
    <h2>💾 Export Date</h2>
    
    <div class="export-panel">
      <h3>📊 Export Rapoarte</h3>
      <p class="meta">Exportă datele tale în diferite formate pentru analiză sau arhivare</p>
      
      <div class="export-grid">
        <div class="export-option">
          <button class="green full" on:click={exportPDF}>
            📄 Export PDF
          </button>
          <span class="help">Raport A4 cu solduri și tranzacții</span>
        </div>
        
        <div class="export-option">
          <button class="green full" on:click={exportExcel}>
            📊 Export Excel
          </button>
          <span class="help">Foi multiple cu date detaliate</span>
        </div>
        
        <div class="export-option">
          <button class="green full" on:click={exportCSV}>
            📋 Export CSV
          </button>
          <span class="help">Format simplu pentru import</span>
        </div>
        
        <div class="export-option">
          <button class="green full" on:click={exportJSON}>
            🔧 Export JSON
          </button>
          <span class="help">Backup complet sau API</span>
        </div>
      </div>
    </div>
    
    <div class="export-panel">
      <h3>💼 Backup & Restore</h3>
      <p class="meta">Salvează o copie completă a datelor sau restaurează dintr-un backup anterior</p>
      
      <div class="export-grid">
        <div class="export-option">
          <button class="yellow full" on:click={exportJSON}>
            💾 Backup Complet
          </button>
          <span class="help">Salvează toate datele</span>
        </div>
        
        <div class="export-option">
          <button class="yellow full" on:click={() => fileInput.click()}>
            📥 Restaurează Backup
          </button>
          <span class="help">Încarcă date salvate</span>
          <input 
            bind:this={fileInput}
            type="file" 
            accept="application/json" 
            on:change={importBackup}
            hidden 
          />
        </div>
        
        <div class="export-option">
          <button class="red full" on:click={resetAll}>
            🗑️ Reset Total
          </button>
          <span class="help">Șterge TOATE datele</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>ℹ️ Informații Export</h2>
    
    <div class="info-section">
      <h3>📄 PDF</h3>
      <p>Generează un raport A4 profesional cu:</p>
      <ul>
        <li>Solduri curente pentru toate conturile</li>
        <li>Sumar lunar (venituri, cheltuieli, economii)</li>
        <li>Ultimele tranzacții</li>
        <li>Formatare pentru print</li>
      </ul>
    </div>
    
    <div class="info-section">
      <h3>📊 Excel</h3>
      <p>Fișier .xlsx cu 4 foi de calcul:</p>
      <ul>
        <li><b>Conturi:</b> Lista completă cu solduri</li>
        <li><b>Tranzacții:</b> Toate tranzacțiile detaliate</li>
        <li><b>Sumar Categorii:</b> Analiză pe categorii</li>
        <li><b>Sumar Lunar:</b> Evoluție lunară</li>
      </ul>
    </div>
    
    <div class="info-section">
      <h3>📋 CSV</h3>
      <p>Format simplu pentru:</p>
      <ul>
        <li>Import în alte aplicații</li>
        <li>Analiză în Excel/Google Sheets</li>
        <li>Procesare cu scripturi</li>
      </ul>
    </div>
    
    <div class="info-section">
      <h3>🔧 JSON</h3>
      <p>Format tehnic pentru:</p>
      <ul>
        <li>Backup complet al datelor</li>
        <li>Migrare între dispozitive</li>
        <li>Integrare cu alte sisteme</li>
      </ul>
    </div>
    
    <div class="warning">
      <strong>⚠️ Important:</strong> Fă backup regulat! Datele sunt stocate doar local în browser.
    </div>
  </div>
</div>

<style>
  .export-container {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 20px;
  }
  
  @media (max-width: 980px) {
    .export-container {
      grid-template-columns: 1fr;
    }
  }
  
  .card {
    background: var(--panel);
    border-radius: 14px;
    padding: 16px;
  }
  
  .card h2 {
    margin: 0 0 16px;
    color: var(--acc);
    font-size: 1.1rem;
  }
  
  .export-panel {
    background: var(--panel2);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .export-panel:last-child {
    margin-bottom: 0;
  }
  
  .export-panel h3 {
    margin: 0 0 8px;
    color: var(--acc);
    font-size: 1rem;
  }
  
  .export-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  
  .export-option {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  button {
    background: var(--acc);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 12px 14px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  button.full {
    width: 100%;
  }
  
  button.green {
    background: var(--ok);
  }
  
  button.yellow {
    background: var(--warn);
  }
  
  button.red {
    background: var(--err);
  }
  
  .help {
    font-size: 0.8rem;
    color: var(--muted);
    text-align: center;
  }
  
  .meta {
    color: var(--muted);
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  
  .info-section {
    margin-bottom: 20px;
  }
  
  .info-section h3 {
    color: var(--acc);
    font-size: 0.95rem;
    margin: 0 0 8px;
  }
  
  .info-section p {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0 0 8px;
  }
  
  .info-section ul {
    margin: 0;
    padding-left: 20px;
    color: var(--muted);
    font-size: 0.85rem;
  }
  
  .info-section li {
    margin-bottom: 4px;
  }
  
  .warning {
    background: rgba(255, 212, 121, 0.1);
    border: 1px solid var(--warn);
    border-radius: 8px;
    padding: 12px;
    margin-top: 16px;
    color: var(--warn);
    font-size: 0.9rem;
  }
</style>