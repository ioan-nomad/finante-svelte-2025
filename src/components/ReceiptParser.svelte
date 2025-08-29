<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  export let isOpen = false;
  
  const dispatch = createEventDispatcher();
  
  // State management
  let fileInput;
  let file = null;
  let isProcessing = false;
  let extractedText = '';
  let parsedProducts = [];
  let isTrainingMode = false;
  let currentStep = 1;
  let totalSteps = 4;
  
  // Training data
  let trainingData = {
    storeName: '',
    storePattern: '',
    productPattern: '',
    pricePattern: '',
    datePattern: '',
    totalPattern: ''
  };
  
  // Known store patterns
  const knownStores = {
    'kaufland': {
      name: 'Kaufland',
      patterns: {
        store: /KAUFLAND\s*ROMANIA/i,
        product: /^([A-ZĂÎÂȘȚ\s]+)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})\s*$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*[:\s]*(\d+[,\.]\d{2})/i
      }
    },
    'lidl': {
      name: 'Lidl',
      patterns: {
        store: /LIDL\s*ROMANIA/i,
        product: /^(.+?)\s+(\d+[,\.]\d{2})(?:\s*[A-Z])?$/gm,
        price: /(\d+[,\.]\d{2})$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*(\d+[,\.]\d{2})/i
      }
    },
    'carrefour': {
      name: 'Carrefour',
      patterns: {
        store: /CARREFOUR/i,
        product: /^([A-ZĂÎÂȘȚ\s]+)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})\s*$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*[:\s]*(\d+[,\.]\d{2})/i
      }
    },
    'mega': {
      name: 'Mega Image',
      patterns: {
        store: /MEGA\s*IMAGE/i,
        product: /^(.+?)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*(\d+[,\.]\d{2})/i
      }
    },
    'auchan': {
      name: 'Auchan',
      patterns: {
        store: /AUCHAN/i,
        product: /^(.+?)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*(\d+[,\.]\d{2})/i
      }
    },
    'penny': {
      name: 'Penny Market',
      patterns: {
        store: /PENNY\s*MARKET/i,
        product: /^(.+?)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*(\d+[,\.]\d{2})/i
      }
    },
    'profi': {
      name: 'Profi',
      patterns: {
        store: /PROFI/i,
        product: /^(.+?)\s+(\d+[,\.]\d{2})\s*$/gm,
        price: /(\d+[,\.]\d{2})$/,
        date: /(\d{2}[\.\/]\d{2}[\.\/]\d{4})/,
        total: /TOTAL\s*(\d+[,\.]\d{2})/i
      }
    }
  };
  
  // Product normalization dictionary
  const productNormalization = {
    'LAPTE': 'Lapte',
    'PAINE': 'Pâine',
    'PÂINE': 'Pâine',
    'OUA': 'Ouă',
    'OUĂ': 'Ouă',
    'ROSII': 'Roșii',
    'ROȘII': 'Roșii',
    'CARTOFI': 'Cartofi',
    'CEAPA': 'Ceapă',
    'CEAPĂ': 'Ceapă',
    'BRANZA': 'Brânză',
    'BRÂNZĂ': 'Brânză',
    'IAURT': 'Iaurt',
    'CARNE': 'Carne',
    'PUI': 'Carne de pui',
    'PORC': 'Carne de porc',
    'VITA': 'Carne de vită',
    'VITĂ': 'Carne de vită',
    'PESTE': 'Pește',
    'PEȘTE': 'Pește',
    'OREZ': 'Orez',
    'PASTE': 'Paste',
    'FASOLE': 'Fasole'
  };
  
  // Product categories
  const categoryMapping = {
    'Lapte': 'Lactate',
    'Iaurt': 'Lactate',
    'Brânză': 'Lactate',
    'Carne de pui': 'Carne',
    'Carne de porc': 'Carne',
    'Carne de vită': 'Carne',
    'Carne': 'Carne',
    'Pește': 'Pește',
    'Pâine': 'Panificație',
    'Roșii': 'Legume',
    'Cartofi': 'Legume',
    'Ceapă': 'Legume',
    'Ouă': 'Ouă',
    'Orez': 'Cereale',
    'Paste': 'Cereale',
    'Fasole': 'Leguminoase'
  };
  
  // Load learned patterns from localStorage
  function loadLearnedPatterns() {
    try {
      const stored = localStorage.getItem('smartPantry_learnedPatterns');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading learned patterns:', e);
      return {};
    }
  }
  
  // Save learned patterns to localStorage
  function saveLearnedPatterns(patterns) {
    try {
      localStorage.setItem('smartPantry_learnedPatterns', JSON.stringify(patterns));
    } catch (e) {
      console.error('Error saving learned patterns:', e);
    }
  }
  
  // Handle file selection
  function handleFileSelect(event) {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      file = selectedFile;
    } else {
      alert('Vă rugăm să selectați un fișier PDF valid.');
    }
  }
  
  // Extract text from PDF using PDF.js
  async function extractTextFromPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF.js library dynamically if not already loaded
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
        
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Nu am putut extrage textul din PDF. Vă rugăm să încercați din nou.');
    }
  }
  
  // Identify store from text
  function identifyStore(text) {
    const allStores = { ...knownStores, ...loadLearnedPatterns() };
    
    for (const [key, store] of Object.entries(allStores)) {
      if (store.patterns.store.test(text)) {
        return { key, store };
      }
    }
    return null;
  }
  
  // Parse products using store patterns
  function parseProducts(text, store) {
    const products = [];
    const productMatches = [...text.matchAll(store.patterns.product)];
    
    for (const match of productMatches) {
      let productName = match[1] ? match[1].trim() : '';
      let price = match[2] ? parseFloat(match[2].replace(',', '.')) : 0;
      
      // Normalize product name
      const upperName = productName.toUpperCase();
      const normalizedName = productNormalization[upperName] || productName;
      
      // Get category
      const category = categoryMapping[normalizedName] || 'Altele';
      
      if (productName && price > 0) {
        products.push({
          name: normalizedName,
          originalName: productName,
          price,
          category,
          quantity: 1
        });
      }
    }
    
    return products;
  }
  
  // Process the uploaded receipt
  async function processReceipt() {
    if (!file) {
      alert('Vă rugăm să selectați un fișier PDF.');
      return;
    }
    
    isProcessing = true;
    
    try {
      // Extract text from PDF
      extractedText = await extractTextFromPDF(file);
      
      // Try to identify the store
      const storeInfo = identifyStore(extractedText);
      
      if (storeInfo) {
        // Parse products using known patterns
        parsedProducts = parseProducts(extractedText, storeInfo.store);
        
        if (parsedProducts.length === 0) {
          // No products found, enter training mode
          isTrainingMode = true;
          trainingData.storeName = storeInfo.store.name;
        } else {
          // Success, dispatch the results
          dispatch('productsAdded', {
            products: parsedProducts,
            store: storeInfo.store.name,
            date: new Date().toISOString().split('T')[0]
          });
        }
      } else {
        // Unknown store, enter training mode
        isTrainingMode = true;
        currentStep = 1;
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Eroare la procesarea bonului fiscal: ' + error.message);
    } finally {
      isProcessing = false;
    }
  }
  
  // Training mode functions
  function nextTrainingStep() {
    if (currentStep < totalSteps) {
      currentStep++;
    } else {
      completeTraining();
    }
  }
  
  function prevTrainingStep() {
    if (currentStep > 1) {
      currentStep--;
    }
  }
  
  function completeTraining() {
    try {
      // Create new learned pattern
      const newPattern = {
        name: trainingData.storeName,
        patterns: {
          store: new RegExp(trainingData.storePattern, 'i'),
          product: new RegExp(trainingData.productPattern, 'gm'),
          price: new RegExp(trainingData.pricePattern),
          date: new RegExp(trainingData.datePattern),
          total: new RegExp(trainingData.totalPattern, 'i')
        },
        usageCount: 0,
        successRate: 0,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const learnedPatterns = loadLearnedPatterns();
      const storeKey = trainingData.storeName.toLowerCase().replace(/\s+/g, '_');
      learnedPatterns[storeKey] = newPattern;
      saveLearnedPatterns(learnedPatterns);
      
      // Try to parse with new pattern
      parsedProducts = parseProducts(extractedText, newPattern);
      
      if (parsedProducts.length > 0) {
        // Update success metrics
        newPattern.usageCount = 1;
        newPattern.successRate = 100;
        learnedPatterns[storeKey] = newPattern;
        saveLearnedPatterns(learnedPatterns);
        
        dispatch('productsAdded', {
          products: parsedProducts,
          store: trainingData.storeName,
          date: new Date().toISOString().split('T')[0]
        });
        
        alert('Antrenamentul a fost completat cu succes! Modelul a fost salvat.');
        resetComponent();
      } else {
        alert('Modelul antrenat nu a putut extrage produse. Vă rugăm să verificați pattern-urile.');
      }
    } catch (error) {
      console.error('Error completing training:', error);
      alert('Eroare la completarea antrenamentului: ' + error.message);
    }
  }
  
  function cancelTraining() {
    isTrainingMode = false;
    currentStep = 1;
    trainingData = {
      storeName: '',
      storePattern: '',
      productPattern: '',
      pricePattern: '',
      datePattern: '',
      totalPattern: ''
    };
  }
  
  function resetComponent() {
    file = null;
    extractedText = '';
    parsedProducts = [];
    isTrainingMode = false;
    currentStep = 1;
    trainingData = {
      storeName: '',
      storePattern: '',
      productPattern: '',
      pricePattern: '',
      datePattern: '',
      totalPattern: ''
    };
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  function closeModal() {
    resetComponent();
    dispatch('close');
  }
  
  // Handle ESC key
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-overlay" on:click={closeModal} transition:fade={{duration: 200}}>
    <div class="modal-content" on:click|stopPropagation transition:slide={{duration: 300}}>
      <div class="modal-header">
        <h2>📄 Smart Pantry Tracker</h2>
        <button class="close-btn" on:click={closeModal}>×</button>
      </div>
      
      <div class="modal-body">
        {#if !isTrainingMode}
          <!-- Main upload interface -->
          <div class="upload-section">
            <div class="upload-area" class:has-file={file}>
              <input 
                bind:this={fileInput}
                type="file" 
                accept=".pdf" 
                on:change={handleFileSelect}
                class="file-input"
                disabled={isProcessing}
              />
              
              <div class="upload-content">
                {#if file}
                  <div class="file-info">
                    <span class="file-icon">📄</span>
                    <div>
                      <div class="file-name">{file.name}</div>
                      <div class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                {:else}
                  <div class="upload-prompt">
                    <span class="upload-icon">📁</span>
                    <div>
                      <div class="upload-title">Selectați bonul fiscal PDF</div>
                      <div class="upload-subtitle">Click pentru a alege fișierul</div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
            
            {#if file}
              <button 
                class="process-btn"
                on:click={processReceipt}
                disabled={isProcessing}
              >
                {#if isProcessing}
                  <span class="spinner"></span>
                  Se procesează...
                {:else}
                  🚀 Procesează bonul
                {/if}
              </button>
            {/if}
          </div>
          
          {#if parsedProducts.length > 0}
            <!-- Results display -->
            <div class="results-section" transition:slide={{duration: 300}}>
              <h3>📦 Produse detectate ({parsedProducts.length})</h3>
              <div class="products-grid">
                {#each parsedProducts as product}
                  <div class="product-card">
                    <div class="product-name">{product.name}</div>
                    <div class="product-details">
                      <span class="product-category">{product.category}</span>
                      <span class="product-price">{product.price.toFixed(2)} RON</span>
                    </div>
                  </div>
                {/each}
              </div>
              
              <div class="results-actions">
                <button class="btn-secondary" on:click={resetComponent}>
                  🔄 Procesează alt bon
                </button>
                <button class="btn-primary" on:click={closeModal}>
                  ✅ Finalizează
                </button>
              </div>
            </div>
          {/if}
        {:else}
          <!-- Training mode wizard -->
          <div class="training-section">
            <div class="training-header">
              <h3>🎓 Mod antrenament - Pasul {currentStep}/{totalSteps}</h3>
              <div class="progress-bar">
                <div class="progress-fill" style="width: {(currentStep / totalSteps) * 100}%"></div>
              </div>
            </div>
            
            {#if currentStep === 1}
              <div class="training-step">
                <h4>Identificarea magazinului</h4>
                <p>Introduceți numele magazinului și pattern-ul pentru identificare:</p>
                
                <div class="form-group">
                  <label>Numele magazinului:</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.storeName}
                    placeholder="ex: Profi City, Mega Image Express"
                  />
                </div>
                
                <div class="form-group">
                  <label>Pattern pentru identificare (regex):</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.storePattern}
                    placeholder="ex: PROFI.*CITY|MEGA.*IMAGE.*EXPRESS"
                  />
                </div>
              </div>
            {:else if currentStep === 2}
              <div class="training-step">
                <h4>Pattern-ul produselor</h4>
                <p>Definiți cum să se identifice produsele și prețurile:</p>
                
                <div class="form-group">
                  <label>Pattern produse (regex cu grupuri):</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.productPattern}
                    placeholder="ex: ^(.+?)\\s+(\\d+[,\\.]\\d{2})\\s*$"
                  />
                  <small>Primul grup = numele produsului, al doilea grup = prețul</small>
                </div>
                
                <div class="form-group">
                  <label>Pattern preț (regex):</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.pricePattern}
                    placeholder="ex: (\\d+[,\\.]\\d{2})$"
                  />
                </div>
              </div>
            {:else if currentStep === 3}
              <div class="training-step">
                <h4>Pattern-ul datei</h4>
                <p>Definiți cum să se identifice data bonului:</p>
                
                <div class="form-group">
                  <label>Pattern dată (regex):</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.datePattern}
                    placeholder="ex: (\\d{2}[\\.\\/]\\d{2}[\\.\\/]\\d{4})"
                  />
                </div>
              </div>
            {:else if currentStep === 4}
              <div class="training-step">
                <h4>Pattern-ul totalului</h4>
                <p>Definiți cum să se identifice totalul bonului:</p>
                
                <div class="form-group">
                  <label>Pattern total (regex):</label>
                  <input 
                    type="text" 
                    bind:value={trainingData.totalPattern}
                    placeholder="ex: TOTAL\\s*[:\\s]*(\\d+[,\\.]\\d{2})"
                  />
                </div>
                
                <div class="text-preview">
                  <h5>Previzualizare text extras:</h5>
                  <div class="extracted-text">{extractedText.substring(0, 500)}...</div>
                </div>
              </div>
            {/if}
            
            <div class="training-actions">
              <button 
                class="btn-secondary" 
                on:click={prevTrainingStep}
                disabled={currentStep === 1}
              >
                ← Înapoi
              </button>
              
              <button class="btn-secondary" on:click={cancelTraining}>
                Anulează
              </button>
              
              <button 
                class="btn-primary" 
                on:click={nextTrainingStep}
                disabled={!trainingData.storeName || !trainingData.storePattern}
              >
                {#if currentStep === totalSteps}
                  🎯 Finalizează antrenamentul
                {:else}
                  Următorul →
                {/if}
              </button>
            </div>
          </div>
        {/if}
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
  }
  
  .modal-content {
    background: var(--panel, #1a1f2e);
    border-radius: 14px;
    width: 100%;
    max-width: 700px;
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
    color: var(--acc, #80b8ff);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: var(--muted, #6b7280);
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
    background: var(--panel2, #252a3a);
    color: var(--ink, #e5e7eb);
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .upload-section {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .upload-area {
    position: relative;
    border: 2px dashed #374151;
    border-radius: 12px;
    padding: 40px 20px;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 20px;
  }
  
  .upload-area:hover, .upload-area.has-file {
    border-color: var(--acc, #80b8ff);
    background: rgba(128, 184, 255, 0.05);
  }
  
  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    cursor: pointer;
  }
  
  .upload-content {
    pointer-events: none;
  }
  
  .upload-prompt, .file-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .upload-icon, .file-icon {
    font-size: 2rem;
  }
  
  .upload-title, .file-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink, #e5e7eb);
  }
  
  .upload-subtitle, .file-size {
    font-size: 0.9rem;
    color: var(--muted, #6b7280);
  }
  
  .process-btn {
    background: var(--acc, #80b8ff);
    color: #08131a;
    border: 0;
    border-radius: 10px;
    padding: 12px 24px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    margin: 0 auto;
  }
  
  .process-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .process-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #08131a;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .results-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(128, 184, 255, .2);
  }
  
  .results-section h3 {
    color: var(--acc, #80b8ff);
    margin-bottom: 16px;
    font-size: 1.1rem;
  }
  
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .product-card {
    background: var(--panel2, #252a3a);
    border-radius: 10px;
    padding: 12px;
    border: 1px solid rgba(128, 184, 255, .1);
  }
  
  .product-name {
    font-weight: 600;
    color: var(--ink, #e5e7eb);
    margin-bottom: 6px;
  }
  
  .product-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .product-category {
    font-size: 0.85rem;
    color: var(--muted, #6b7280);
    background: rgba(128, 184, 255, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .product-price {
    font-weight: 600;
    color: var(--acc, #80b8ff);
  }
  
  .results-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  
  .training-section {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .training-header {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .training-header h3 {
    color: var(--acc, #80b8ff);
    margin-bottom: 12px;
    font-size: 1.1rem;
  }
  
  .progress-bar {
    height: 4px;
    background: #374151;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--acc, #80b8ff);
    transition: width 0.3s;
  }
  
  .training-step h4 {
    color: var(--ink, #e5e7eb);
    margin-bottom: 8px;
  }
  
  .training-step p {
    color: var(--muted, #6b7280);
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--ink, #e5e7eb);
  }
  
  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: var(--panel2, #252a3a);
    color: var(--ink, #e5e7eb);
    font-size: 14px;
    box-sizing: border-box;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--acc, #80b8ff);
    box-shadow: 0 0 0 3px rgba(128, 184, 255, 0.1);
  }
  
  .form-group small {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--muted, #6b7280);
  }
  
  .text-preview {
    margin-top: 20px;
    padding: 16px;
    background: var(--panel2, #252a3a);
    border-radius: 8px;
  }
  
  .text-preview h5 {
    margin-bottom: 8px;
    color: var(--ink, #e5e7eb);
    font-size: 0.9rem;
  }
  
  .extracted-text {
    font-family: monospace;
    font-size: 12px;
    color: var(--muted, #6b7280);
    line-height: 1.4;
    max-height: 150px;
    overflow-y: auto;
  }
  
  .training-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 24px;
    gap: 12px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 10px 16px;
    border: 0;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }
  
  .btn-primary {
    background: var(--acc, #80b8ff);
    color: #08131a;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .btn-secondary {
    background: transparent;
    color: var(--ink, #e5e7eb);
    border: 1px solid #374151;
  }
  
  .btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--panel2, #252a3a);
  }
  
  /* Dark mode support */
  :global(html.dark) .modal-content {
    background: var(--bg-primary, #1f2937);
    border-color: var(--border-color, #374151);
  }
  
  :global(html.dark) .upload-area {
    border-color: var(--border-color, #4b5563);
  }
  
  :global(html.dark) .upload-area:hover,
  :global(html.dark) .upload-area.has-file {
    background: rgba(59, 130, 246, 0.1);
  }
  
  :global(html.dark) .product-card {
    background: var(--bg-secondary, #374151);
    border-color: var(--border-color, #4b5563);
  }
  
  :global(html.dark) .text-preview {
    background: var(--bg-secondary, #374151);
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .modal-overlay {
      padding: 10px;
    }
    
    .modal-content {
      max-height: 95vh;
    }
    
    .products-grid {
      grid-template-columns: 1fr;
    }
    
    .training-actions {
      flex-direction: column;
    }
    
    .results-actions {
      flex-direction: column;
    }
  }
</style>