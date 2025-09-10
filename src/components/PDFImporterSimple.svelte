<!-- src/components/PDFImporterSimple.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  let fileInput;
  let isProcessing = false;
  
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Te rog selectează un fișier PDF');
      return;
    }
    
    isProcessing = true;
    
    try {
      // Temporar - doar alertă
      alert('PDF detectat: ' + file.name + '\nParser-ul este în reparație.');
      
      // Test data pentru verificare
      const testTransactions = [
        {
          date: '2024-01-15',
          description: 'Test Transaction',
          amount: 100,
          type: 'expense',
          category: 'Test'
        }
      ];
      
      dispatch('import', testTransactions);
      dispatch('close');
      
    } catch (error) {
      console.error('Eroare:', error);
      alert('Eroare la procesarea PDF: ' + error.message);
    }
    
    isProcessing = false;
  }
  
  function closeImporter() {
    dispatch('close');
  }
</script>

<div class="pdf-importer-overlay" on:click={closeImporter}>
  <div class="pdf-importer-modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📄 Import PDF (Repair Mode)</h2>
      <button class="close-btn" on:click={closeImporter}>✕</button>
    </div>
    
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
          <div>⏳ Procesare...</div>
        {:else}
          <div>📄 Click pentru selectare PDF</div>
        {/if}
      </label>
    </div>
    
    <div class="info">
      ⚠️ Parser-ul este în reparație. Importul complet va fi disponibil curând.
    </div>
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
    padding: 30px;
    max-width: 500px;
    width: 90%;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
  
  .upload-area {
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    margin: 20px 0;
  }
  
  .upload-label {
    cursor: pointer;
    display: block;
  }
  
  #pdf-input {
    display: none;
  }
  
  .info {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 12px;
    border-radius: 6px;
    color: #856404;
  }
</style>