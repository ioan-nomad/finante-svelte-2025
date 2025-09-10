// OCRProcessor.js - OCR processing pentru PDF-uri scanate și imagini
import { learningDatabase } from './LearningDatabase.js';

export class OCRProcessor {
  constructor() {
    this.isInitialized = false;
    this.ocrEngine = null;
    this.supportedFormats = ['image/jpeg', 'image/png', 'application/pdf'];
    this.processingQueue = [];
    this.isProcessing = false;
    
    this.init();
  }

  async init() {
    try {
      // OCR se va initializa on-demand pentru a evita încărcarea inutilă
      this.isInitialized = true;
      console.log('👁️ OCRProcessor ready (OCR engine will load on-demand)');
    } catch (error) {
      console.error('❌ OCRProcessor initialization failed:', error);
    }
  }

  // === OCR ENGINE MANAGEMENT ===

  async initializeOCREngine() {
    if (this.ocrEngine) return this.ocrEngine;

    try {
      // Try to load Tesseract.js if available
      if (typeof window !== 'undefined' && window.Tesseract) {
        console.log('🔍 Initializing Tesseract OCR engine...');
        this.ocrEngine = await window.Tesseract.createWorker();
        await this.ocrEngine.loadLanguage('ron+eng'); // Romanian + English
        await this.ocrEngine.initialize('ron+eng');
        
        console.log('✅ Tesseract OCR engine initialized');
        return this.ocrEngine;
      }

      // Fallback to basic image analysis
      console.log('⚠️ Tesseract not available, using fallback OCR');
      this.ocrEngine = new FallbackOCR();
      return this.ocrEngine;

    } catch (error) {
      console.error('❌ OCR Engine initialization failed:', error);
      this.ocrEngine = new FallbackOCR();
      return this.ocrEngine;
    }
  }

  // === MAIN OCR METHODS ===

  async processDocument(file, options = {}) {
    const startTime = Date.now();
    const documentHash = await this.generateDocumentHash(file);
    
    try {
      // Check cache first
      const cached = await learningDatabase.getOCRResult(documentHash);
      if (cached && cached.confidence > 0.5) {
        console.log('📋 Using cached OCR result');
        return {
          text: cached.ocrText,
          confidence: cached.confidence,
          method: cached.method,
          fromCache: true,
          processingTime: Date.now() - startTime
        };
      }

      // Determine processing method
      const processingMethod = await this.determineProcessingMethod(file);
      let result;

      switch (processingMethod) {
        case 'native_pdf':
          result = await this.processNativePDF(file, options);
          break;
        case 'scanned_pdf':
          result = await this.processScannedPDF(file, options);
          break;
        case 'image':
          result = await this.processImage(file, options);
          break;
        default:
          throw new Error(`Unsupported processing method: ${processingMethod}`);
      }

      // Cache result
      await learningDatabase.saveOCRResult(
        documentHash,
        result.text,
        result.confidence,
        result.method
      );

      result.processingTime = Date.now() - startTime;
      result.fromCache = false;

      await learningDatabase.logPerformance(
        `ocr_${processingMethod}`,
        result.processingTime,
        null,
        result.confidence,
        {
          fileSize: file.size,
          method: result.method
        }
      );

      return result;

    } catch (error) {
      console.error('Error in OCR processing:', error);
      return {
        text: '',
        confidence: 0,
        method: 'error',
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  async determineProcessingMethod(file) {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
    if (fileType.startsWith('image/')) {
      return 'image';
    }
    
    if (fileType === 'application/pdf') {
      // Check if PDF contains text or is scanned
      const hasText = await this.checkPDFForText(file);
      return hasText ? 'native_pdf' : 'scanned_pdf';
    }
    
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  async checkPDFForText(file) {
    try {
      // Quick check using PDF.js to see if there's extractable text
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Check first page for text
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str).join(' ').trim();
      
      return text.length > 50; // If more than 50 characters, likely has text
    } catch (error) {
      console.warn('Could not check PDF for text:', error);
      return false; // Assume scanned if we can't check
    }
  }

  // === PDF PROCESSING ===

  async processNativePDF(file, options) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let fullText = '';
      const maxPages = options.maxPages || pdf.numPages;
      
      for (let i = 1; i <= Math.min(maxPages, pdf.numPages); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return {
        text: fullText.trim(),
        confidence: 0.95,
        method: 'native_pdf',
        pagesProcessed: Math.min(maxPages, pdf.numPages)
      };
      
    } catch (error) {
      throw new Error(`Native PDF processing failed: ${error.message}`);
    }
  }

  async processScannedPDF(file, options) {
    try {
      // Convert PDF pages to images, then OCR
      const images = await this.convertPDFToImages(file, options);
      let allText = '';
      let totalConfidence = 0;
      
      const ocrEngine = await this.initializeOCREngine();
      
      for (let i = 0; i < images.length; i++) {
        const imageResult = await this.performOCR(images[i], ocrEngine, options);
        allText += imageResult.text + '\n';
        totalConfidence += imageResult.confidence;
        
        // Progress callback if provided
        if (options.onProgress) {
          options.onProgress({
            page: i + 1,
            totalPages: images.length,
            currentText: imageResult.text
          });
        }
      }
      
      const avgConfidence = images.length > 0 ? totalConfidence / images.length : 0;
      
      return {
        text: allText.trim(),
        confidence: avgConfidence / 100, // Convert to 0-1 scale
        method: 'scanned_pdf_ocr',
        pagesProcessed: images.length
      };
      
    } catch (error) {
      throw new Error(`Scanned PDF processing failed: ${error.message}`);
    }
  }

  async processImage(file, options) {
    try {
      const ocrEngine = await this.initializeOCREngine();
      const result = await this.performOCR(file, ocrEngine, options);
      
      return {
        text: result.text,
        confidence: result.confidence / 100, // Convert to 0-1 scale
        method: 'image_ocr'
      };
      
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // === OCR UTILITIES ===

  async convertPDFToImages(file, options = {}) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      const images = [];
      const maxPages = options.maxPages || Math.min(pdf.numPages, 5); // Limit for performance
      const scale = options.scale || 2.0; // Higher scale for better OCR
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        // Convert to blob
        const imageBlob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png', 0.9);
        });
        
        images.push(imageBlob);
      }
      
      return images;
      
    } catch (error) {
      throw new Error(`PDF to images conversion failed: ${error.message}`);
    }
  }

  async performOCR(imageFile, ocrEngine, options = {}) {
    try {
      if (ocrEngine instanceof FallbackOCR) {
        return await ocrEngine.processImage(imageFile);
      }
      
      // Tesseract OCR
      const ocrOptions = {
        rectangle: options.rectangle || null,
        rotateAuto: true,
        ...options.ocrOptions
      };
      
      const { data: { text, confidence } } = await ocrEngine.recognize(imageFile, ocrOptions);
      
      return {
        text: text.trim(),
        confidence: confidence
      };
      
    } catch (error) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  // === POST-PROCESSING ===

  async enhanceOCRText(rawText, context = {}) {
    try {
      let enhancedText = rawText;
      
      // Fix common OCR errors for Romanian banking documents
      enhancedText = this.fixCommonOCRErrors(enhancedText);
      
      // Apply banking-specific corrections
      enhancedText = this.fixBankingTerms(enhancedText);
      
      // Fix dates and amounts
      enhancedText = this.fixDatesAndAmounts(enhancedText);
      
      // Apply machine learning improvements if available
      if (context.bankType) {
        enhancedText = await this.applyBankSpecificCorrections(enhancedText, context.bankType);
      }
      
      return enhancedText;
      
    } catch (error) {
      console.warn('Text enhancement failed:', error);
      return rawText;
    }
  }

  fixCommonOCRErrors(text) {
    const corrections = [
      // Common character misrecognitions
      [/0/g, 'O'], // In context of letters
      [/1/g, 'l'], // In context of words
      [/5/g, 'S'], // In certain contexts
      [/8/g, 'B'], // In certain contexts
      
      // Romanian specific
      [/ã/g, 'ă'],
      [/î/g, 'î'],
      [/ş/g, 'ș'],
      [/ţ/g, 'ț'],
      
      // Banking terms
      [/BANCÃ/g, 'BANCA'],
      [/C0NT/g, 'CONT'],
      [/R0N/g, 'RON'],
      [/lEl/g, 'LEI'],
      
      // Common word fixes
      [/\bCUMPÃRARE\b/g, 'CUMPARARE'],
      [/\bTRANZACŢIE\b/g, 'TRANZACTIE'],
      [/\bRETRAGERE\b/g, 'RETRAGERE']
    ];
    
    let correctedText = text;
    corrections.forEach(([pattern, replacement]) => {
      correctedText = correctedText.replace(pattern, replacement);
    });
    
    return correctedText;
  }

  fixBankingTerms(text) {
    const bankingTerms = {
      // BCR terms
      'BANCA C0MERCIALÃ R0MÂNÃ': 'BANCA COMERCIALA ROMANA',
      'GE0RGE': 'GEORGE',
      'EXTRAS DE C0NT': 'EXTRAS DE CONT',
      
      // BT terms
      'BANCA TRANSILVANÏA': 'BANCA TRANSILVANIA',
      'NEO BT': 'NEO BT',
      
      // ING terms
      'ING BANK': 'ING BANK',
      'H0ME BANK': 'HOME BANK',
      
      // Common banking terms
      'S0LD': 'SOLD',
      'CREDIT': 'CREDIT',
      'DEBIT': 'DEBIT',
      'TRANSFER': 'TRANSFER',
      'CUMPARARE': 'CUMPARARE',
      'RETRAGERE': 'RETRAGERE',
      'POS': 'POS'
    };
    
    let correctedText = text;
    Object.entries(bankingTerms).forEach(([incorrect, correct]) => {
      correctedText = correctedText.replace(new RegExp(incorrect, 'gi'), correct);
    });
    
    return correctedText;
  }

  fixDatesAndAmounts(text) {
    let correctedText = text;
    
    // Fix date formats
    correctedText = correctedText.replace(
      /(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})/g,
      (match, day, month, year) => {
        return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year.length === 2 ? '20' + year : year}`;
      }
    );
    
    // Fix amount formats
    correctedText = correctedText.replace(
      /(\d{1,3}(?:[.,]\d{3})*)[.,](\d{2})\s*(RON|LEI)/gi,
      (match, amount, cents, currency) => {
        return `${amount.replace(/[.,]/g, '.')},${cents} ${currency.toUpperCase()}`;
      }
    );
    
    return correctedText;
  }

  async applyBankSpecificCorrections(text, bankType) {
    // Load bank-specific correction patterns from database
    const patterns = await learningDatabase.getBankPatterns(bankType);
    
    let correctedText = text;
    
    patterns.forEach(pattern => {
      if (pattern.patternType === 'ocr_correction') {
        try {
          const regex = new RegExp(pattern.pattern, 'gi');
          const correction = pattern.metadata?.correction || pattern.pattern;
          correctedText = correctedText.replace(regex, correction);
        } catch (error) {
          console.warn('Invalid correction pattern:', pattern.pattern);
        }
      }
    });
    
    return correctedText;
  }

  // === UTILITY METHODS ===

  async generateDocumentHash(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback hash
      return `${file.name}_${file.size}_${file.lastModified}`.replace(/[^a-zA-Z0-9]/g, '_');
    }
  }

  getFileTypeFromName(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // === LEARNING AND IMPROVEMENT ===

  async learnFromCorrection(originalText, correctedText, context = {}) {
    try {
      // Find differences and create correction patterns
      const corrections = this.findTextDifferences(originalText, correctedText);
      
      for (const correction of corrections) {
        if (correction.pattern && correction.replacement) {
          await learningDatabase.saveBankPattern(
            context.bank || 'GENERIC',
            correction.pattern,
            'ocr_correction',
            0.8,
            {
              correction: correction.replacement,
              context: context,
              createdAt: Date.now()
            }
          );
        }
      }
      
      console.log(`🎓 Learned ${corrections.length} OCR corrections`);
      
    } catch (error) {
      console.error('Error learning from OCR correction:', error);
    }
  }

  findTextDifferences(original, corrected) {
    const corrections = [];
    
    // Simple word-by-word comparison
    const originalWords = original.split(/\s+/);
    const correctedWords = corrected.split(/\s+/);
    
    for (let i = 0; i < Math.min(originalWords.length, correctedWords.length); i++) {
      if (originalWords[i] !== correctedWords[i]) {
        corrections.push({
          pattern: originalWords[i],
          replacement: correctedWords[i],
          position: i
        });
      }
    }
    
    return corrections;
  }

  // === PUBLIC API ===

  async getProcessingStats() {
    return await learningDatabase.getPerformanceMetrics('ocr_');
  }

  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  async clearOCRCache(olderThanDays = 30) {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    return await learningDatabase.ocrCache.where('timestamp').below(cutoff).delete();
  }

  // === BATCH PROCESSING ===

  async addToQueue(file, options = {}) {
    return new Promise((resolve, reject) => {
      this.processingQueue.push({
        file,
        options,
        resolve,
        reject,
        addedAt: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.processingQueue.length > 0) {
        const job = this.processingQueue.shift();
        
        try {
          const result = await this.processDocument(job.file, job.options);
          job.resolve(result);
        } catch (error) {
          job.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Fallback OCR class for when Tesseract is not available
class FallbackOCR {
  async processImage(imageFile) {
    console.warn('🔍 Using fallback OCR - limited functionality');
    
    // Basic image analysis - can detect some patterns but no real OCR
    return {
      text: `[Fallback OCR] File: ${imageFile.name} (${imageFile.size} bytes)\nReal OCR processing requires Tesseract.js library.`,
      confidence: 10 // Very low confidence
    };
  }
}

// Export singleton instance
export const ocrProcessor = new OCRProcessor();