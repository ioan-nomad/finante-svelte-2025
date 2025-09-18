<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { groceryInventory } from '../../../stores/groceryStore.js';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let video;
  let canvas;
  let stream;
  let capturedImage = null;
  let isProcessing = false;
  let extractedText = '';
  let parsedItems = [];
  let ocrWorker;

  // Camera states
  let hasCamera = false;
  let cameraError = '';
  let isCapturing = false;

  onMount(async () => {
    // Check for camera availability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      hasCamera = true;
      await startCamera();
      await initOCR();
    } else {
      cameraError = 'Camera nu este disponibilă pe acest dispozitiv';
    }
  });

  onDestroy(() => {
    stopCamera();
    if (ocrWorker) {
      ocrWorker.terminate();
    }
  });

  async function initOCR() {
    // Load Tesseract.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    document.head.appendChild(script);

    await new Promise(resolve => {
      script.onload = resolve;
    });
  }

  async function startCamera() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Back camera pe mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (video) {
        video.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      cameraError = 'Nu pot accesa camera. Verifică permisiunile.';
      hasCamera = false;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  function captureImage() {
    if (!video || !canvas) return;

    isCapturing = true;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    capturedImage = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();

    processImage();
  }

  async function processImage() {
    if (!capturedImage || !window.Tesseract) {
      alert('OCR nu este încărcat. Încearcă din nou.');
      return;
    }

    isProcessing = true;

    try {
      // OCR processing
      const result = await Tesseract.recognize(
        capturedImage,
        'ron', // Romanian language
        {
          logger: m => console.log(m)
        }
      );

      extractedText = result.data.text;
      parseReceipt(extractedText);

    } catch (error) {
      console.error('OCR Error:', error);
      alert('Eroare la procesarea imaginii. Încearcă din nou.');
    } finally {
      isProcessing = false;
    }
  }

  function parseReceipt(text) {
    // Patterns pentru magazine românești
    const patterns = {
      kaufland: /KAUFLAND/i,
      lidl: /LIDL/i,
      carrefour: /CARREFOUR/i,
      mega: /MEGA\s*IMAGE/i,
      auchan: /AUCHAN/i,
      penny: /PENNY/i,
      profi: /PROFI/i
    };

    // Detect store
    let store = 'Necunoscut';
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        store = key.toUpperCase();
        break;
      }
    }

    // Parse items - pattern general pentru produse și prețuri
    const itemPattern = /([A-Z\s]+)\s+(\d+[,\.]\d{2})/gi;
    const matches = [...text.matchAll(itemPattern)];

    parsedItems = matches.map(match => ({
      name: match[1].trim(),
      price: parseFloat(match[2].replace(',', '.')),
      quantity: 1,
      category: detectCategory(match[1])
    })).filter(item =>
      item.name.length > 2 &&
      item.price > 0 &&
      item.price < 1000 // Filter out invalid prices
    );

    // Find total
    const totalPattern = /TOTAL\s*:?\s*(\d+[,\.]\d{2})/i;
    const totalMatch = text.match(totalPattern);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) :
                  parsedItems.reduce((sum, item) => sum + item.price, 0);

    // Store result
    if (parsedItems.length > 0) {
      const receipt = {
        store,
        date: new Date().toISOString().split('T')[0],
        items: parsedItems,
        total,
        method: 'camera-scan'
      };

      // Preview pentru user
      console.log('Parsed receipt:', receipt);
    }
  }

  function detectCategory(productName) {
    const categories = {
      'Lactate': ['LAPTE', 'IAURT', 'BRANZA', 'SMANTANA', 'UNT'],
      'Carne': ['PUI', 'PORC', 'VITA', 'CARNE', 'SALAM', 'PARIZER'],
      'Legume': ['ROSII', 'CASTRAVETI', 'ARDEI', 'CEAPA', 'MORCOV'],
      'Fructe': ['MERE', 'PERE', 'BANANE', 'PORTOCALE', 'STRUGURI'],
      'Pâine': ['PAINE', 'FRANZELA', 'CHIFLE', 'COVRIGI'],
      'Băuturi': ['APA', 'SUC', 'COLA', 'BERE', 'VIN']
    };

    const upperName = productName.toUpperCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => upperName.includes(keyword))) {
        return category;
      }
    }

    return 'Altele';
  }

  function saveReceipt() {
    if (parsedItems.length === 0) {
      alert('Nu am găsit produse. Încearcă o poză mai clară.');
      return;
    }

    const receipt = {
      store: 'Camera Scan',
      date: new Date().toISOString().split('T')[0],
      items: parsedItems,
      total: parsedItems.reduce((sum, item) => sum + item.price, 0),
      method: 'camera-scan'
    };

    groceryInventory.addReceipt(receipt);

    dispatch('close');
    alert(`Salvat ${parsedItems.length} produse!`);
    resetScanner();
  }

  function retakePhoto() {
    capturedImage = null;
    parsedItems = [];
    extractedText = '';
    isCapturing = false;
    startCamera();
  }

  function resetScanner() {
    capturedImage = null;
    parsedItems = [];
    extractedText = '';
    isCapturing = false;
  }

  function close() {
    stopCamera();
    dispatch('close');
  }
</script>

{#if isOpen}
<div class="scanner-modal" transition:fade={{duration: 200}}>
  <div class="scanner-container" transition:fly={{y: 50, duration: 300}}>
    <div class="scanner-header">
      <h2>📸 Scanează Bon</h2>
      <button class="close-btn" on:click={close}>✕</button>
    </div>

    <div class="scanner-body">
      {#if !capturedImage}
        <!-- Camera View -->
        <div class="camera-container">
          {#if hasCamera}
            <video
              bind:this={video}
              autoplay
              playsinline
              class="camera-video"
            ></video>
            <canvas bind:this={canvas} style="display: none;"></canvas>

            <div class="camera-controls">
              <button
                class="capture-btn"
                on:click={captureImage}
                disabled={isCapturing}
              >
                📷 Fotografiază
              </button>
            </div>

            <div class="camera-tips">
              💡 Ține bonul drept, în lumină bună
            </div>
          {:else}
            <div class="error-message">
              {cameraError || 'Camera nu este disponibilă'}
            </div>
          {/if}
        </div>
      {:else}
        <!-- Captured Image View -->
        <div class="preview-container">
          <img src={capturedImage} alt="Bon capturat" class="preview-image" />

          {#if isProcessing}
            <div class="processing-overlay">
              <div class="spinner"></div>
              <p>Procesez imaginea...</p>
            </div>
          {/if}

          {#if !isProcessing && parsedItems.length > 0}
            <div class="results-container">
              <h3>Produse detectate: {parsedItems.length}</h3>
              <div class="items-list">
                {#each parsedItems as item}
                  <div class="detected-item">
                    <span class="item-name">{item.name}</span>
                    <span class="item-price">{item.price.toFixed(2)} RON</span>
                  </div>
                {/each}
              </div>

              <div class="total-row">
                <strong>Total:</strong>
                <strong>{parsedItems.reduce((s, i) => s + i.price, 0).toFixed(2)} RON</strong>
              </div>
            </div>
          {/if}

          <div class="action-buttons">
            <button class="retake-btn" on:click={retakePhoto}>
              🔄 Fotografiază din nou
            </button>

            {#if parsedItems.length > 0}
              <button class="save-btn" on:click={saveReceipt}>
                💾 Salvează în Stoc
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
.scanner-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.scanner-container {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.scanner-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.5rem;
}

.scanner-body {
  padding: 1rem;
}

.camera-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: auto;
  display: block;
}

.camera-controls {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.capture-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.capture-btn:hover {
  transform: scale(1.05);
}

.capture-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.camera-tips {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.preview-container {
  position: relative;
}

.preview-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 8px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.results-container {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.results-container h3 {
  margin: 0 0 1rem 0;
  color: var(--primary);
}

.items-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.detected-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.item-name {
  flex: 1;
  color: var(--text-primary);
}

.item-price {
  color: var(--primary);
  font-weight: 500;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  font-size: 1.1rem;
  border-top: 2px solid var(--primary);
  margin-top: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.retake-btn, .save-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.retake-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.save-btn {
  background: var(--success);
  color: white;
}

.retake-btn:hover, .save-btn:hover {
  transform: translateY(-2px);
}

.error-message {
  padding: 2rem;
  text-align: center;
  color: var(--danger);
  background: var(--bg-secondary);
  border-radius: 8px;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .scanner-container {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }

  .camera-controls {
    bottom: 1rem;
  }

  .capture-btn {
    padding: 0.75rem 1.5rem;
  }
}

/* Dark mode support */
:global(.dark) .scanner-container {
  background: #1a1a1a;
  color: #e0e0e0;
}

:global(.dark) .results-container {
  background: #2a2a2a;
}

:global(.dark) .detected-item {
  border-bottom-color: #3a3a3a;
}
</style>