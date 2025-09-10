<script>
  import * as pdfjsLib from 'pdfjs-dist';
  
  // Inițializare PDF.js cu worker path corect și error handling
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    console.log('📚 PDF.js inițializat cu worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  }
  
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  
  // IMPORT ML ENGINE MODULAR - SECȚIUNE NOUĂ
  let mlEngine = null;
  let mlReady = false;
  let mlConfidence = 0;
  
  onMount(async () => {
    try {
      // Import MLEngine modular existent
      const { MLEngine } = await import('../lib/ml/MLEngine.js');
      mlEngine = new MLEngine();
      
      // Inițializare
      await mlEngine.initialize();
      mlReady = true;
      
      console.log('✅ ML Engine initialized in PDFImporter');
      
      // Get stats pentru UI
      if (mlEngine.getAdvancedMetrics) {
        const stats = await mlEngine.getAdvancedMetrics();
        console.log('📊 ML Stats:', stats);
      }
      
    } catch (error) {
      console.warn('⚠️ ML Engine not available, using fallback parser:', error);
      mlReady = false;
    }
  });
  
  const dispatch = createEventDispatcher();
  
  let fileInput;
  let extractedData = [];
  let isProcessing = false;
  let previewMode = false;
  let processingMethod = 'simple'; // 'simple' sau 'ml'
  let detectedBank = '';
  let enhancedTransactions = [];
  let learningResults = null;
  
  const BANK_PATTERNS = {
    'BT': ['BANCA TRANSILVANIA', 'BT24'],
    'BCR': ['BCR', 'BANCA COMERCIALA ROMANA'],
    'ING': ['ING BANK', 'ING Personal'],
    'Raiffeisen': ['RAIFFEISEN BANK'],
    'UniCredit': ['UNICREDIT BANK']
  };
  
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Te rog selectează un fișier PDF valid');
      return;
    }
    
    isProcessing = true;
    console.log('📄 Processing PDF:', file.name, file.size, 'bytes');
    
    try {
      // IMPORTANT: Creează o copie a ArrayBuffer pentru a evita detached error
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log('✅ Data loaded:', uint8Array.length, 'bytes');
      
      // Folosește uint8Array în loc de arrayBuffer direct
      let pdf;
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
        });
        
        pdf = await loadingTask.promise;
        console.log('✅ PDF loaded with options, pages:', pdf.numPages);
        
      } catch (pdfError) {
        console.error('⚠️ PDF with options failed, trying simple method:', pdfError);
        
        // Re-citește fișierul pentru fallback
        const freshArrayBuffer = await file.arrayBuffer();
        const freshUint8Array = new Uint8Array(freshArrayBuffer);
        
        const simpleLoadTask = pdfjsLib.getDocument(freshUint8Array);
        pdf = await simpleLoadTask.promise;
        console.log('✅ PDF loaded with simple method, pages:', pdf.numPages);
      }
      
      // Extrage text din toate paginile
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📖 Processing page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        allText += pageText + '\n';
      }
      
      console.log('📝 Total text extracted:', allText.length, 'characters');
      console.log('📝 Preview:', allText.substring(0, 200) + '...');
      
      // Procesează cu ML Engine dacă e disponibil
      if (mlReady && mlEngine) {
        console.log('🤖 Processing with ML Engine...');
        processingMethod = 'ml';
        
        try {
          const mlResult = await mlEngine.processPDF(allText);
          console.log('✅ ML Result:', mlResult);
          
          if (mlResult && mlResult.transactions && mlResult.transactions.length > 0) {
            extractedData = mlResult.transactions.map(tx => ({
              data: tx.date || tx.data || 'N/A',
              suma: tx.amount || tx.suma || 0,
              descriere: tx.description || tx.descriere || tx.merchant || 'Unknown',
              tip: tx.type || tx.tip || (tx.amount < 0 ? 'expense' : 'income'),
              categorie: tx.category || tx.categorie || 'Altele',
              confidence: tx.confidence || 0.5,
              mlProcessed: true
            }));
            
            enhancedTransactions = extractedData.map((tx, index) => ({
              enhancedTransaction: tx,
              originalText: allText,
              confidence: tx.confidence || mlResult.confidence || 0.8,
              isEnhanced: true,
              merchantData: mlResult.merchantData?.[index],
              improvements: mlResult.improvements?.[index] || [],
              index
            }));
            
            mlConfidence = mlResult.confidence || 0;
            console.log(`✅ ML extracted ${extractedData.length} transactions`);
            
            if (mlResult.bankDetected || mlResult.bankDetection?.bank) {
              console.log(`🏦 Bancă detectată: ${mlResult.bankDetected || mlResult.bankDetection?.bank}`);
            }
            
            // Advanced ML results pentru UI
            learningResults = {
              detectedBank: mlResult.bankDetection?.bank || mlResult.bankDetected || detectBank(allText),
              bankConfidence: mlResult.bankDetection?.confidence || 0,
              detectionMethod: mlResult.bankDetection?.method || 'pattern',
              totalTransactions: extractedData.length,
              enhancedTransactions: mlResult.metrics?.mlEnhancedCount || extractedData.length,
              averageConfidence: mlResult.metrics?.averageConfidence || mlResult.confidence || 0.8,
              processingTime: mlResult.processingTime || 0,
              signature: mlResult.signature?.hash || 'no_signature',
              patternsUsed: mlResult.pattern?.patterns || [],
              mlEngineUsed: true,
              ocrUsed: mlResult.metrics?.ocrUsed || false,
              neuralNetworksApplied: mlResult.metrics?.neuralNetworksApplied || false
            };
          } else {
            throw new Error('ML nu a returnat tranzacții');
          }
          
        } catch (mlError) {
          console.error('ML processing failed, falling back to simple parser:', mlError);
          processingMethod = 'simple';
          const simpleTransactions = parseTransactions(allText);
          extractedData = simpleTransactions;
          enhancedTransactions = extractedData.map((tx, index) => ({
            enhancedTransaction: tx,
            originalText: allText,
            confidence: 0.6,
            isEnhanced: false,
            improvements: [],
            index
          }));
          console.log(`📝 Simple parser extracted ${extractedData.length} transactions`);
        }
        
      } else {
        console.log('📝 ML not ready, using simple parser...');
        processingMethod = 'simple';
        const simpleTransactions = parseTransactions(allText);
        extractedData = simpleTransactions;
        enhancedTransactions = extractedData.map((tx, index) => ({
          enhancedTransaction: tx,
          originalText: allText,
          confidence: 0.6,
          isEnhanced: false,
          improvements: [],
          index
        }));
        console.log(`📝 Simple parser extracted ${extractedData.length} transactions`);
      }
      
      if (extractedData.length === 0) {
        alert('Nu am găsit tranzacții în PDF. Verifică dacă PDF-ul conține text (nu imagini).');
      } else {
        console.log('✅ Ready for preview:', extractedData.length, 'transactions');
        previewMode = true;
      }
      
    } catch (error) {
      console.error('❌ Eroare procesare PDF:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // User-friendly messages
      if (error.name === 'InvalidPDFException') {
        alert('Fișierul nu pare să fie un PDF valid.');
      } else if (error.name === 'PasswordException') {
        alert('PDF-ul este protejat cu parolă.');
      } else if (error.message.includes('detached')) {
        alert('Eroare internă. Te rog încearcă din nou.');
      } else {
        alert('Eroare la procesarea PDF: ' + error.message);
      }
    }
    
    isProcessing = false;
  }
  
  function parseTransactions(text) {
    console.log('📝 Simple parser analyzing text...');
    const transactions = [];
    const lines = text.split('\n');
    
    // Pattern-uri pentru diferite formate de date și sume
    const datePatterns = [
      /(\d{2})[.-](\d{2})[.-](\d{4})/,  // DD-MM-YYYY
      /(\d{4})[.-](\d{2})[.-](\d{2})/   // YYYY-MM-DD
    ];
    
    const amountPattern = /([+-]?\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Caută dată
      let dateMatch = null;
      let dateFormat = null;
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          dateMatch = match;
          dateFormat = pattern;
          break;
        }
      }
      
      // Caută sumă
      const amountMatch = line.match(amountPattern);
      
      if (dateMatch && amountMatch) {
        let date;
        if (dateFormat.source.includes('(\\d{4})')) {
          // YYYY-MM-DD
          date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        } else {
          // DD-MM-YYYY
          date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        }
        
        const amountStr = amountMatch[1]
          .replace(/\./g, '')    // Remove thousand separator
          .replace(',', '.');    // Convert decimal separator
        
        const amount = parseFloat(amountStr);
        
        // Extrage descrierea (tot ce e între dată și sumă)
        const dateIndex = line.indexOf(dateMatch[0]);
        const amountIndex = line.indexOf(amountMatch[0]);
        const description = line.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        
        transactions.push({
          data: date,
          suma: Math.abs(amount),
          descriere: description || 'Tranzacție',
          tip: amount < 0 ? 'expense' : 'income',
          categorie: detectCategory(description),
          confidence: 0.6
        });
      }
    }
    
    console.log(`✅ Simple parser found ${transactions.length} transactions`);
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
      desc = desc.replace(new RegExp(word, 'g'), '');
    });
    return desc.trim().substring(0, 50);
  }
  
  function detectCategory(description) {
    if (!description) return 'Altele';
    
    const desc = description.toUpperCase();
    
    const categories = {
      'Alimente': ['LIDL', 'KAUFLAND', 'CARREFOUR', 'MEGA', 'PROFI', 'PENNY'],
      'Transport': ['OMV', 'PETROM', 'MOL', 'UBER', 'BOLT', 'STB'],
      'Utilități': ['ENEL', 'EON', 'ELECTRICA', 'DIGI', 'VODAFONE', 'ORANGE'],
      'Restaurant': ['GLOVO', 'TAZZ', 'RESTAURANT', 'PIZZA'],
      'ATM': ['ATM', 'RETRAGERE', 'CASH'],
      'Transfer': ['TRANSFER', 'VIRAMENT'],
      'Online': ['PAYPAL', 'AMAZON', 'EMAG']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'Altele';
  }
  
  function detectBank(text) {
    const bankNames = Object.entries(BANK_PATTERNS);
    
    for (const [bankCode, patterns] of bankNames) {
      for (const pattern of patterns) {
        if (text.toUpperCase().includes(pattern.toUpperCase())) {
          return bankCode;
        }
      }
    }
    
    // Detectare fuzzy pentru bănci noi
    if (text.includes('BANK') || text.includes('BANCA')) {
      return 'UNKNOWN_BANK';
    }
    
    return 'GENERIC';
  }
  
  // Funcția de feedback pentru ML learning
  async function provideFeedback(transactionIndex, feedback) {
    if (!mlReady || !mlEngine) return;
    
    const transaction = extractedData[transactionIndex];
    
    try {
      await mlEngine.learnFromFeedback({
        originalData: transaction,
        correction: feedback,
        timestamp: new Date()
      });
      
      console.log('✅ Feedback salvat pentru learning');
      
      // Update transaction cu corecția
      extractedData[transactionIndex] = {
        ...transaction,
        ...feedback,
        corrected: true
      };
      
      // Update enhanced transactions too
      enhancedTransactions[transactionIndex] = {
        ...enhancedTransactions[transactionIndex],
        ...feedback,
        corrected: true
      };
      
      // Trigger Svelte reactivity
      extractedData = extractedData;
      enhancedTransactions = enhancedTransactions;
      
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }
  
  async function confirmImport() {
    // Învață din tranzacțiile confirmate cu noul ML Engine
    if (enhancedTransactions && enhancedTransactions.length > 0) {
      for (const enhancedTx of enhancedTransactions) {
        try {
          // Feedback pozitiv pentru tranzacțiile confirmate
          const feedback = {
            transactionId: enhancedTx.enhancedTransaction.id || `tx_${Date.now()}_${Math.random()}`,
            originalText: enhancedTx.originalText || enhancedTx.enhancedTransaction.descriere,
            extractedData: enhancedTx.enhancedTransaction,
            isCorrect: true, // Confirmată de utilizator
            corrections: null,
            confidence: enhancedTx.confidence || 0.8,
            bank: detectedBank,
            timestamp: Date.now()
          };
          
          // Învață din feedback cu noul ML Engine
          const learningResult = await mlEngine.learnFromFeedback(feedback);
          
          console.log(`🧠 ML Engine învățat: ${enhancedTx.enhancedTransaction.descriere} - accuracy: ${Math.round(learningResult.accuracy * 100)}%`);
          
          // Actualizează modelele neural networks
          if (enhancedTx.merchantData) {
            await mlEngine.neuralNetworkEngine.learnMerchantPattern(
              enhancedTx.enhancedTransaction.descriere,
              enhancedTx.merchantData.name
            );
          }
          
        } catch (error) {
          console.warn(`⚠️ Eroare la învățare ML pentru tranzacția: ${enhancedTx.enhancedTransaction.descriere}`, error);
        }
      }
      
      // Salvează toate modelele actualizate
      try {
        await mlEngine.saveModels();
        console.log(`💾 Modele ML salvate cu succes pentru banca ${detectedBank}`);
      } catch (error) {
        console.warn('⚠️ Eroare la salvarea modelelor ML:', error);
      }
      
      console.log(`🎓 Import completat cu învățare ML avansată pentru banca ${detectedBank}`);
    }
    
    dispatch('import', extractedData);
    closeImporter();
  }
  
  function closeImporter() {
    extractedData = [];
    previewMode = false;
    enhancedTransactions = [];
    learningResults = null;
    detectedBank = '';
    if (fileInput) fileInput.value = '';
    dispatch('close');
  }
  
  function getConfidenceColor(confidence) {
    if (confidence >= 0.8) return '#10b981'; // verde
    if (confidence >= 0.6) return '#f59e0b'; // galben
    return '#ef4444'; // roșu
  }
</script>

<div class="pdf-importer-overlay" on:click={closeImporter}>
  <div class="pdf-importer-modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📄 Import Extras Bancar PDF</h2>
      
      <!-- INDICATOR ML STATUS - NOU -->
      {#if mlReady}
        <span class="ml-indicator" title="Machine Learning Activ">
          🤖 ML Active
        </span>
      {:else}
        <span class="ml-indicator inactive" title="Parser Simplu">
          📝 Simple Mode
        </span>
      {/if}
      
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
        
        <!-- Machine Learning Results -->
        {#if learningResults}
          <div class="ml-results">
            <div class="ml-header">
              <h4>🧠 Rezultate Machine Learning</h4>
            </div>
            <div class="ml-stats">
              <div class="ml-stat">
                <span class="ml-label">Bancă detectată:</span>
                <span class="ml-value bank">{learningResults.detectedBank}</span>
              </div>
              <div class="ml-stat">
                <span class="ml-label">Tranzacții îmbunătățite:</span>
                <span class="ml-value enhanced">{learningResults.enhancedTransactions}/{learningResults.totalTransactions}</span>
              </div>
              <div class="ml-stat">
                <span class="ml-label">Confidence mediu:</span>
                <span class="ml-value confidence" style="color: {getConfidenceColor(learningResults.averageConfidence)}">
                  {Math.round(learningResults.averageConfidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- ML Engine Confidence Score - NOU -->
        {#if previewMode && processingMethod === 'ml'}
          <div class="ml-confidence">
            <strong>🎯 ML Engine Confidence:</strong>
            <progress value={mlConfidence} max="1"></progress>
            <span>{(mlConfidence * 100).toFixed(1)}%</span>
          </div>
        {/if}
        
        <div class="transactions-preview">
          <table>
            <thead>
              <tr>
                <th>ML</th>
                <th>Data</th>
                <th>Descriere</th>
                <th>Sumă</th>
                <th>Tip</th>
                <th>Categorie</th>
                <th>Confidence</th>
                {#if processingMethod === 'ml'}
                  <th>Acțiuni</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each enhancedTransactions.slice(0, 10) as t, i}
                <tr class:enhanced={t.isEnhanced}>
                  <td class="ml-indicator">
                    {#if t.isEnhanced}
                      <span class="enhanced-badge" title="Îmbunătățit de AI">🧠</span>
                    {:else}
                      <span class="original-badge" title="Parsing standard">📄</span>
                    {/if}
                  </td>
                  <td>{t.enhancedTransaction.data}</td>
                  <td class="description-cell">
                    {t.enhancedTransaction.descriere}
                    {#if t.merchantData}
                      <div class="merchant-info">
                        👤 {t.merchantData.name} ({t.merchantData.occurrences}×)
                      </div>
                    {/if}
                  </td>
                  <td class:income={t.enhancedTransaction.tip === 'income'} class:expense={t.enhancedTransaction.tip === 'expense'}>
                    {t.enhancedTransaction.suma.toFixed(2)} RON
                  </td>
                  <td>{t.enhancedTransaction.tip === 'income' ? '↓' : '↑'}</td>
                  <td class="category-cell">
                    {t.enhancedTransaction.categorie}
                    {#if t.improvements.length > 0}
                      <div class="improvements">
                        {#each t.improvements as improvement}
                          <div class="improvement-tag">✨ {improvement}</div>
                        {/each}
                      </div>
                    {/if}
                  </td>
                  <td class="confidence-cell">
                    <span class="confidence-score" style="color: {getConfidenceColor(t.confidence)}">
                      {Math.round(t.confidence * 100)}%
                    </span>
                  </td>
                  {#if processingMethod === 'ml'}
                    <td class="actions-cell">
                      <button 
                        class="btn-correct"
                        on:click={() => {
                          const correct = prompt('Corectează descrierea:', t.enhancedTransaction.descriere);
                          if (correct) {
                            provideFeedback(i, { descriere: correct });
                          }
                        }}
                        title="Corectează pentru a îmbunătăți ML-ul"
                      >
                        ✏️
                      </button>
                    </td>
                  {/if}
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
    gap: 15px;
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
  
  /* Machine Learning Results Styles */
  .ml-results {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
    color: white;
  }
  
  .ml-header h4 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .ml-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .ml-stat {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 12px;
    backdrop-filter: blur(10px);
  }
  
  .ml-label {
    display: block;
    font-size: 12px;
    opacity: 0.9;
    margin-bottom: 5px;
  }
  
  .ml-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
  }
  
  .ml-value.bank {
    color: #ffd700;
    text-transform: uppercase;
  }
  
  .ml-value.enhanced {
    color: #10b981;
  }
  
  .ml-value.confidence {
    font-weight: 700;
  }
  
  /* Enhanced Table Styles */
  .ml-indicator {
    text-align: center;
    width: 40px;
  }
  
  .enhanced-badge, .original-badge {
    font-size: 16px;
    padding: 2px;
    border-radius: 50%;
  }
  
  .enhanced-badge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  tr.enhanced {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), transparent);
    border-left: 3px solid #10b981;
  }
  
  .description-cell {
    max-width: 200px;
  }
  
  .merchant-info {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
    padding: 2px 6px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    display: inline-block;
  }
  
  .category-cell {
    position: relative;
  }
  
  .improvements {
    margin-top: 8px;
  }
  
  .improvement-tag {
    font-size: 10px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    margin: 2px 0;
    display: inline-block;
  }
  
  .confidence-cell {
    text-align: center;
  }
  
  .confidence-score {
    font-weight: 700;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Dark Mode ML Styles */
  :global(body.dark) .ml-results {
    background: linear-gradient(135deg, #2a2d3a 0%, #1a1d29 100%);
    border: 1px solid rgba(102, 126, 234, 0.3);
  }
  
  :global(body.dark) .merchant-info {
    background: rgba(102, 126, 234, 0.2);
    color: #a0aec0;
  }
  
  :global(body.dark) tr.enhanced {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.15), transparent);
  }
  
  :global(body.dark) .confidence-score {
    background: rgba(255, 255, 255, 0.05);
  }
  
  /* Mobile Responsive */
  @media (max-width: 768px) {
    .ml-stats {
      grid-template-columns: 1fr;
    }
    
    table {
      font-size: 12px;
    }
    
    th, td {
      padding: 6px 8px;
    }
    
    .description-cell {
      max-width: 150px;
    }
    
    .improvement-tag {
      font-size: 9px;
      padding: 1px 4px;
    }
  }
  
  /* ML ENGINE INTEGRATION STYLES - NOU */
  .ml-indicator {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    animation: pulse 2s infinite;
    margin-left: auto;
  }
  
  .ml-indicator.inactive {
    background: #6c757d;
    animation: none;
  }
  
  .ml-confidence {
    background: #e8f5e9;
    padding: 12px;
    border-radius: 8px;
    margin: 12px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .ml-confidence progress {
    flex: 1;
    height: 20px;
  }
  
  .confidence-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .confidence-badge.high {
    background: #4caf50;
    color: white;
  }
  
  .confidence-badge.medium {
    background: #ff9800;
    color: white;
  }
  
  .btn-correct {
    background: none;
    border: 1px solid #2196f3;
    color: #2196f3;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  
  .btn-correct:hover {
    background: #2196f3;
    color: white;
    transform: scale(1.1);
  }
  
  .actions-cell {
    text-align: center;
    width: 60px;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
</style>