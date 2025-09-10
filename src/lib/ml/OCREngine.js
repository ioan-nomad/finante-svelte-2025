/**
 * OCR ENGINE - Advanced Optical Character Recognition cu Web Workers
 * Features: Canvas preprocessing, Web Workers, Text enhancement, Multi-language support
 */

export class OCREngine {
  constructor() {
    console.log('👁️ Initializing OCR Engine...');
    
    // OCR configuration
    this.config = {
      languages: 'ron+eng+hun', // Romanian, English, Hungarian
      workers: 2, // Number of Web Workers
      options: {
        logger: this.ocrLogger.bind(this),
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js',
        cacheMethod: 'indexedDB'
      }
    };
    
    // Workers pool
    this.workers = [];
    this.workerQueue = [];
    this.busyWorkers = new Set();
    
    // Canvas pentru preprocessing
    this.canvas = null;
    this.ctx = null;
    
    // OCR statistics
    this.stats = {
      totalProcessed: 0,
      averageAccuracy: 0,
      averageTime: 0,
      preprocessingEnabled: true
    };
    
    this.initialized = false;
  }

  /**
   * Initialize OCR cu Web Workers
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('⚙️ Setting up OCR workers...');
    
    try {
      // Setup Canvas pentru preprocessing
      this.setupCanvas();
      
      // Load Tesseract.js din CDN
      await this.loadTesseractJS();
      
      // Initialize Worker pool
      await this.initializeWorkerPool();
      
      // Test OCR capability
      await this.testOCRCapability();
      
      this.initialized = true;
      console.log('✅ OCR Engine initialized successfully!');
      
    } catch (error) {
      console.error('❌ OCR Engine initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Load Tesseract.js din CDN
   */
  async loadTesseractJS() {
    if (window.Tesseract) return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      
      script.onload = () => {
        console.log('✅ Tesseract.js loaded from CDN');
        resolve();
      };
      
      script.onerror = () => {
        console.warn('⚠️ Tesseract.js failed to load, using fallback');
        this.createFallbackTesseract();
        resolve();
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Worker Pool pentru parallel processing
   */
  async initializeWorkerPool() {
    if (!window.Tesseract) {
      console.warn('⚠️ Tesseract not available, skipping worker pool');
      return;
    }
    
    console.log(`🔧 Creating ${this.config.workers} OCR workers...`);
    
    for (let i = 0; i < this.config.workers; i++) {
      try {
        const worker = await this.createWorker(i);
        this.workers.push(worker);
        console.log(`✅ OCR Worker ${i + 1} ready`);
      } catch (error) {
        console.warn(`⚠️ OCR Worker ${i + 1} failed:`, error);
      }
    }
    
    if (this.workers.length === 0) {
      throw new Error('No OCR workers could be initialized');
    }
  }

  /**
   * Create individual OCR worker
   */
  async createWorker(index) {
    const worker = await Tesseract.createWorker(this.config.languages, 1, {
      ...this.config.options,
      logger: (m) => this.ocrLogger(m, index)
    });
    
    // Optimize pentru Romanian banking documents
    await worker.setParameters({
      'tessedit_char_whitelist': '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzăâîșțĂÂÎȘȚ .,:-/()[]',
      'preserve_interword_spaces': '1',
      'tessedit_pageseg_mode': Tesseract.PSM.AUTO,
      'tessedit_ocr_engine_mode': Tesseract.OEM.LSTM_ONLY
    });
    
    return worker;
  }

  /**
   * MAIN OCR PROCESSING - Process scanned PDF
   */
  async processScannedPDF(pdfData) {
    if (!this.initialized) {
      throw new Error('OCR Engine not initialized');
    }
    
    const startTime = performance.now();
    console.log('📷 Processing scanned PDF cu OCR...');
    
    try {
      // Convert PDF la images
      const images = await this.convertPDFToImages(pdfData);
      console.log(`📄 Extracted ${images.length} images from PDF`);
      
      // Process images în parallel
      const ocrResults = await this.processImagesParallel(images);
      
      // Combine și cleanup results
      const combinedText = this.combineOCRResults(ocrResults);
      
      // Post-process text
      const cleanedText = this.postProcessOCRText(combinedText);
      
      // Update statistics
      const processingTime = performance.now() - startTime;
      this.updateStats(cleanedText, processingTime);
      
      console.log('✅ OCR processing completed în', processingTime.toFixed(2), 'ms');
      
      return {
        text: cleanedText,
        confidence: this.calculateOverallConfidence(ocrResults),
        processingTime: processingTime,
        pagesProcessed: images.length,
        method: 'tesseract_ocr'
      };
      
    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      return this.fallbackOCR(pdfData);
    }
  }

  /**
   * Convert PDF la images pentru OCR
   */
  async convertPDFToImages(pdfData) {
    // Use PDF-lib sau canvas pentru conversion
    console.log('🔄 Converting PDF pages la images...');
    
    try {
      // Implementare simplificată - în production ar fi mai complexă
      // Ar folosi pdf.js pentru real PDF la canvas conversion
      
      // Mock implementation pentru demonstrație
      return [this.createMockImageFromPDF(pdfData)];
      
    } catch (error) {
      console.error('❌ PDF la image conversion failed:', error);
      throw error;
    }
  }

  /**
   * Process multiple images în parallel cu Worker pool
   */
  async processImagesParallel(images) {
    console.log(`🔧 Processing ${images.length} images cu ${this.workers.length} workers...`);
    
    const results = [];
    const promises = [];
    
    for (let i = 0; i < images.length; i++) {
      const worker = this.getAvailableWorker();
      const promise = this.processImageWithWorker(worker, images[i], i);
      promises.push(promise);
    }
    
    // Wait pentru all OCR tasks
    const ocrResults = await Promise.all(promises);
    
    return ocrResults.filter(result => result !== null);
  }

  /**
   * Process single image cu specific worker
   */
  async processImageWithWorker(worker, imageData, pageIndex) {
    if (!worker) {
      console.warn(`⚠️ No worker available pentru page ${pageIndex}`);
      return null;
    }
    
    this.busyWorkers.add(worker);
    
    try {
      // Preprocess image pentru better OCR
      const processedImage = await this.preprocessImage(imageData);
      
      // Run OCR
      const result = await worker.recognize(processedImage);
      
      console.log(`✅ Page ${pageIndex + 1} OCR completed - Confidence: ${result.data.confidence.toFixed(1)}%`);
      
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        pageIndex: pageIndex,
        words: result.data.words,
        lines: result.data.lines
      };
      
    } catch (error) {
      console.error(`❌ OCR failed pentru page ${pageIndex}:`, error);
      return null;
    } finally {
      this.busyWorkers.delete(worker);
    }
  }

  /**
   * IMAGE PREPROCESSING - Enhance images pentru better OCR
   */
  setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    console.log('🖼️ Canvas setup pentru image preprocessing');
  }

  async preprocessImage(imageData) {
    if (!this.ctx || !this.stats.preprocessingEnabled) {
      return imageData;
    }
    
    try {
      // Load image la canvas
      const img = await this.loadImageToCanvas(imageData);
      
      // Apply preprocessing filters
      this.applyContrastEnhancement();
      this.applyNoiseReduction();
      this.applySharpening();
      this.applyBinarization();
      
      // Convert înapoi la image data
      return this.canvas.toDataURL('image/png');
      
    } catch (error) {
      console.warn('⚠️ Image preprocessing failed:', error);
      return imageData;
    }
  }

  async loadImageToCanvas(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Resize canvas la image dimensions
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Draw image
        this.ctx.drawImage(img, 0, 0);
        resolve(img);
      };
      
      img.onerror = reject;
      
      // Handle different image data types
      if (typeof imageData === 'string') {
        img.src = imageData;
      } else {
        // Convert binary data la data URL
        const blob = new Blob([imageData]);
        img.src = URL.createObjectURL(blob);
      }
    });
  }

  applyContrastEnhancement() {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Simple contrast enhancement
    const contrast = 1.2;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] * contrast);     // Red
      data[i + 1] = Math.min(255, data[i + 1] * contrast); // Green
      data[i + 2] = Math.min(255, data[i + 2] * contrast); // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  applyNoiseReduction() {
    // Simple blur pentru noise reduction
    this.ctx.filter = 'blur(0.5px)';
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.filter = 'none';
  }

  applySharpening() {
    // Sharpen filter pentru better text recognition
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Simple sharpening kernel
    const sharpen = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    // Apply convolution (simplified implementation)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Apply kernel la each color channel
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[kidx] * sharpen[(ky + 1) * 3 + (kx + 1)];
            }
          }
          data[idx + c] = Math.max(0, Math.min(255, sum));
        }
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  applyBinarization() {
    // Convert la black & white pentru better text recognition
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    // Calculate optimal threshold
    const threshold = this.calculateOtsuThreshold(data);
    
    // Apply binarization
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const binary = gray > threshold ? 255 : 0;
      
      data[i] = binary;     // Red
      data[i + 1] = binary; // Green
      data[i + 2] = binary; // Blue
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }

  calculateOtsuThreshold(data) {
    // Simplified Otsu's method
    const histogram = new Array(256).fill(0);
    let total = 0;
    
    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      histogram[gray]++;
      total++;
    }
    
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }
    
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let varMax = 0;
    let threshold = 0;
    
    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      
      wF = total - wB;
      if (wF === 0) break;
      
      sumB += t * histogram[t];
      
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      
      if (varBetween > varMax) {
        varMax = varBetween;
        threshold = t;
      }
    }
    
    return threshold;
  }

  /**
   * TEXT POST-PROCESSING
   */
  combineOCRResults(results) {
    // Sort by page index și combine text
    const sortedResults = results.sort((a, b) => a.pageIndex - b.pageIndex);
    
    let combinedText = '';
    for (const result of sortedResults) {
      if (result && result.text) {
        combinedText += result.text + '\\n\\n';
      }
    }
    
    return combinedText.trim();
  }

  postProcessOCRText(text) {
    if (!text) return '';
    
    let processed = text;
    
    // Fix common OCR errors pentru Romanian text
    const replacements = [
      // Numbers confused cu letters
      [/([0-9])O/g, '$10'], // O -> 0
      [/O([0-9])/g, '0$1'],
      [/([0-9])I/g, '$11'], // I -> 1
      [/I([0-9])/g, '1$1'],
      [/([0-9])S/g, '$15'], // S -> 5
      [/S([0-9])/g, '5$1'],
      
      // Romanian diacritics
      [/ă/g, 'ă'], [/â/g, 'â'], [/î/g, 'î'], [/ș/g, 'ș'], [/ț/g, 'ț'],
      [/Ă/g, 'Ă'], [/Â/g, 'Â'], [/Î/g, 'Î'], [/Ș/g, 'Ș'], [/Ț/g, 'Ț'],
      
      // Common banking terms
      [/PIJATA/gi, 'PLATA'],
      [/TRANZACTIE/gi, 'TRANZACȚIE'],
      [/CUMPARARE/gi, 'CUMPĂRARE'],
      [/SOLIJ/gi, 'SOLD'],
      
      // Clean up whitespace
      [/\\s+/g, ' '],
      [/\\n{3,}/g, '\\n\\n']
    ];
    
    for (const [pattern, replacement] of replacements) {
      processed = processed.replace(pattern, replacement);
    }
    
    return processed.trim();
  }

  /**
   * UTILITY FUNCTIONS
   */
  getAvailableWorker() {
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker)) {
        return worker;
      }
    }
    return null; // All workers busy
  }

  calculateOverallConfidence(results) {
    if (!results || results.length === 0) return 0;
    
    const confidences = results.map(r => r.confidence).filter(c => c > 0);
    if (confidences.length === 0) return 0;
    
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  updateStats(text, processingTime) {
    this.stats.totalProcessed++;
    
    // Update average processing time
    this.stats.averageTime = (
      (this.stats.averageTime * (this.stats.totalProcessed - 1)) + 
      processingTime
    ) / this.stats.totalProcessed;
    
    // Simple text quality heuristic
    const textQuality = text.length > 100 && 
                       /[0-9]/.test(text) && 
                       /[a-zA-Z]/.test(text) ? 0.8 : 0.4;
    
    this.stats.averageAccuracy = (
      (this.stats.averageAccuracy * (this.stats.totalProcessed - 1)) + 
      textQuality
    ) / this.stats.totalProcessed;
  }

  createMockImageFromPDF(pdfData) {
    // Mock implementation pentru development
    // În production ar face real PDF la image conversion
    console.log('📄 Creating mock image from PDF data...');
    
    // Create a simple canvas cu sample text
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    const mockCtx = mockCanvas.getContext('2d');
    
    // White background
    mockCtx.fillStyle = 'white';
    mockCtx.fillRect(0, 0, 800, 600);
    
    // Sample bank statement text
    mockCtx.fillStyle = 'black';
    mockCtx.font = '16px monospace';
    
    const sampleText = [
      'BANCA COMERCIALĂ ROMÂNĂ',
      'EXTRAS DE CONT',
      '',
      'Data      Descriere                    Suma',
      '15/09/2025  PLATA CARD KAUFLAND      -45.67',
      '14/09/2025  TRANSFER INCOMING       +1200.00',
      '13/09/2025  ATM RETRAGERE CASH       -100.00',
      '12/09/2025  PLATA UTILITATI ENEL     -156.43'
    ];
    
    sampleText.forEach((line, index) => {
      mockCtx.fillText(line, 50, 100 + index * 30);
    });
    
    return mockCanvas.toDataURL('image/png');
  }

  ocrLogger(m, workerIndex = 0) {
    if (m.status === 'recognizing text') {
      console.log(`🔍 Worker ${workerIndex + 1}: ${(m.progress * 100).toFixed(1)}%`);
    }
  }

  createFallbackTesseract() {
    // Fallback când Tesseract.js nu se poate încărca
    window.Tesseract = {
      createWorker: () => Promise.resolve({
        recognize: () => Promise.resolve({
          data: {
            text: 'Fallback OCR - Tesseract.js not available',
            confidence: 50
          }
        }),
        setParameters: () => Promise.resolve(),
        terminate: () => Promise.resolve()
      }),
      PSM: { AUTO: 13 },
      OEM: { LSTM_ONLY: 1 }
    };
  }

  async fallbackOCR(pdfData) {
    console.log('⚠️ Using fallback OCR method...');
    
    return {
      text: 'OCR processing failed - fallback text extraction',
      confidence: 20,
      processingTime: 100,
      pagesProcessed: 1,
      method: 'fallback'
    };
  }

  async testOCRCapability() {
    if (this.workers.length === 0) {
      console.warn('⚠️ No OCR workers available');
      return false;
    }
    
    console.log('🧪 Testing OCR capability...');
    
    try {
      // Create simple test image
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 200;
      testCanvas.height = 50;
      const testCtx = testCanvas.getContext('2d');
      
      testCtx.fillStyle = 'white';
      testCtx.fillRect(0, 0, 200, 50);
      testCtx.fillStyle = 'black';
      testCtx.font = '20px Arial';
      testCtx.fillText('TEST 123', 10, 30);
      
      // Test OCR cu first worker
      const result = await this.workers[0].recognize(testCanvas.toDataURL());
      const success = result.data.text.includes('TEST') || result.data.text.includes('123');
      
      console.log(success ? '✅ OCR test passed' : '⚠️ OCR test failed');
      return success;
      
    } catch (error) {
      console.warn('⚠️ OCR test failed:', error);
      return false;
    }
  }

  isInitialized() {
    return this.initialized;
  }

  getStats() {
    return {
      ...this.stats,
      workersAvailable: this.workers.length,
      busyWorkers: this.busyWorkers.size,
      queueLength: this.workerQueue.length
    };
  }

  async cleanup() {
    console.log('🧹 Cleaning up OCR workers...');
    
    // Terminate all workers
    for (const worker of this.workers) {
      try {
        await worker.terminate();
      } catch (error) {
        console.warn('⚠️ Worker cleanup failed:', error);
      }
    }
    
    this.workers = [];
    this.busyWorkers.clear();
    this.workerQueue = [];
    
    console.log('✅ OCR cleanup completed');
  }
}