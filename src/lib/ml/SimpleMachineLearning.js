// SimpleMachineLearning.js - Pure JS ML implementation for PDF parsing
// folosește doar native JavaScript fără dependențe native

import Dexie from 'dexie';
import LZString from 'lz-string';

class SimpleMLDatabase extends Dexie {
  constructor() {
    super('FinanteMLDatabase');
    this.version(1).stores({
      patterns: '++id, bank, pattern, accuracy, usageCount, lastUsed',
      transactions: '++id, original, parsed, feedback, bank, timestamp',
      merchants: '++id, name, aliases, category, confidence, occurrences'
    });
  }
}

class SimpleNeuralNetwork {
  constructor(inputSize = 10, hiddenSize = 15, outputSize = 5) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    
    // Inițializare weights cu valori mici random
    this.weightsIH = this.randomMatrix(inputSize, hiddenSize);
    this.weightsHO = this.randomMatrix(hiddenSize, outputSize);
    this.biasH = this.randomArray(hiddenSize);
    this.biasO = this.randomArray(outputSize);
    
    this.learningRate = 0.1;
  }
  
  randomMatrix(rows, cols) {
    return Array(rows).fill().map(() => 
      Array(cols).fill().map(() => (Math.random() * 2 - 1) * 0.5)
    );
  }
  
  randomArray(size) {
    return Array(size).fill().map(() => (Math.random() * 2 - 1) * 0.5);
  }
  
  sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
  }
  
  sigmoidDerivative(x) {
    return x * (1 - x);
  }
  
  predict(inputs) {
    // Forward pass
    const hidden = this.weightsIH[0].map((_, j) => {
      let sum = this.biasH[j];
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.weightsIH[i][j];
      }
      return this.sigmoid(sum);
    });
    
    const outputs = this.weightsHO[0].map((_, j) => {
      let sum = this.biasO[j];
      for (let i = 0; i < this.hiddenSize; i++) {
        sum += hidden[i] * this.weightsHO[i][j];
      }
      return this.sigmoid(sum);
    });
    
    return { outputs, hidden };
  }
  
  train(inputs, targets) {
    const { outputs, hidden } = this.predict(inputs);
    
    // Calculate output errors
    const outputErrors = outputs.map((output, i) => targets[i] - output);
    const outputGradients = outputs.map((output, i) => 
      outputErrors[i] * this.sigmoidDerivative(output) * this.learningRate
    );
    
    // Calculate hidden errors
    const hiddenErrors = hidden.map((_, i) => {
      let error = 0;
      for (let j = 0; j < this.outputSize; j++) {
        error += outputErrors[j] * this.weightsHO[i][j];
      }
      return error;
    });
    
    const hiddenGradients = hidden.map((h, i) => 
      hiddenErrors[i] * this.sigmoidDerivative(h) * this.learningRate
    );
    
    // Update weights and biases
    for (let i = 0; i < this.hiddenSize; i++) {
      for (let j = 0; j < this.outputSize; j++) {
        this.weightsHO[i][j] += hiddenGradients[i] * hidden[i];
      }
    }
    
    for (let i = 0; i < this.inputSize; i++) {
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsIH[i][j] += hiddenGradients[j] * inputs[i];
      }
    }
    
    // Update biases
    for (let i = 0; i < this.outputSize; i++) {
      this.biasO[i] += outputGradients[i];
    }
    
    for (let i = 0; i < this.hiddenSize; i++) {
      this.biasH[i] += hiddenGradients[i];
    }
    
    return Math.sqrt(outputErrors.reduce((sum, err) => sum + err * err, 0) / outputErrors.length);
  }
}

export class SimpleMLEngine {
  constructor() {
    this.db = new SimpleMLDatabase();
    this.neuralNet = new SimpleNeuralNetwork();
    this.isInitialized = false;
    this.patterns = new Map();
    this.merchants = new Map();
    
    this.init();
  }
  
  async init() {
    try {
      await this.loadPatterns();
      await this.loadMerchants();
      await this.loadNeuralNetwork();
      this.isInitialized = true;
      console.log('🧠 SimpleML Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ML Engine:', error);
    }
  }
  
  async loadPatterns() {
    const patterns = await this.db.patterns.toArray();
    patterns.forEach(pattern => {
      if (!this.patterns.has(pattern.bank)) {
        this.patterns.set(pattern.bank, []);
      }
      this.patterns.get(pattern.bank).push(pattern);
    });
  }
  
  async loadMerchants() {
    const merchants = await this.db.merchants.toArray();
    merchants.forEach(merchant => {
      this.merchants.set(merchant.name.toLowerCase(), merchant);
      merchant.aliases.forEach(alias => {
        this.merchants.set(alias.toLowerCase(), merchant);
      });
    });
  }
  
  async loadNeuralNetwork() {
    try {
      const saved = localStorage.getItem('finante_neural_network');
      if (saved) {
        const compressed = LZString.decompress(saved);
        const data = JSON.parse(compressed);
        Object.assign(this.neuralNet, data);
        console.log('🧠 Neural network loaded from storage');
      }
    } catch (error) {
      console.warn('⚠️ Could not load neural network, using fresh one');
    }
  }
  
  async saveNeuralNetwork() {
    try {
      const data = {
        weightsIH: this.neuralNet.weightsIH,
        weightsHO: this.neuralNet.weightsHO,
        biasH: this.neuralNet.biasH,
        biasO: this.neuralNet.biasO
      };
      const compressed = LZString.compress(JSON.stringify(data));
      localStorage.setItem('finante_neural_network', compressed);
    } catch (error) {
      console.warn('⚠️ Could not save neural network:', error);
    }
  }
  
  // Feature extraction pentru neural network
  extractFeatures(text) {
    const features = new Array(10).fill(0);
    
    // Feature 1: Raportul de cifre
    features[0] = (text.match(/\d/g) || []).length / text.length;
    
    // Feature 2: Raportul de caractere mari
    features[1] = (text.match(/[A-Z]/g) || []).length / text.length;
    
    // Feature 3: Raportul de spații
    features[2] = (text.match(/\s/g) || []).length / text.length;
    
    // Feature 4: Prezența datei
    features[3] = /\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}/.test(text) ? 1 : 0;
    
    // Feature 5: Prezența sumei
    features[4] = /\d+[,\.]\d{2}/.test(text) ? 1 : 0;
    
    // Feature 6: Prezența cuvintelor cheie de tranzacție
    features[5] = /(plata|cumparare|transfer|retragere|pos)/i.test(text) ? 1 : 0;
    
    // Feature 7: Lungimea textului (normalizată)
    features[6] = Math.min(text.length / 100, 1);
    
    // Feature 8: Prezența codurilor bancare
    features[7] = /(bcr|bt|ing|raiffeisen|unicredit)/i.test(text) ? 1 : 0;
    
    // Feature 9: Raportul de punctuație
    features[8] = (text.match(/[.,;:!?]/g) || []).length / text.length;
    
    // Feature 10: Prezența valutei
    features[9] = /(ron|lei|eur|usd)/i.test(text) ? 1 : 0;
    
    return features;
  }
  
  // Detectare bancă folosind ML
  async detectBankML(text) {
    const features = this.extractFeatures(text);
    const prediction = this.neuralNet.predict(features);
    
    const banks = ['BCR', 'BT', 'ING', 'RAIFFEISEN', 'UNICREDIT'];
    const maxIndex = prediction.outputs.indexOf(Math.max(...prediction.outputs));
    const confidence = prediction.outputs[maxIndex];
    
    // Fallback la detection clasic dacă confidence e scăzut
    if (confidence < 0.6) {
      return this.detectBankClassic(text);
    }
    
    return {
      bank: banks[maxIndex],
      confidence: confidence,
      method: 'neural_network'
    };
  }
  
  detectBankClassic(text) {
    const bankPatterns = {
      'BCR': [/bcr/i, /banca comerciala romana/i, /george/i],
      'BT': [/banca transilvania/i, /\bbt\b/i, /bt24/i],
      'ING': [/ing bank/i, /ing home/i, /homebank/i],
      'RAIFFEISEN': [/raiffeisen/i, /smart mobile/i],
      'UNICREDIT': [/unicredit/i, /hvb/i]
    };
    
    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return {
            bank: bank,
            confidence: 0.8,
            method: 'pattern_matching'
          };
        }
      }
    }
    
    return {
      bank: 'UNKNOWN',
      confidence: 0.3,
      method: 'unknown'
    };
  }
  
  // Detectare și îmbunătățire comercianți
  enhanceMerchant(description) {
    const cleaned = description.toLowerCase().trim();
    
    // Încearcă să găsească merchant cunoscut
    if (this.merchants.has(cleaned)) {
      const merchant = this.merchants.get(cleaned);
      merchant.occurrences++;
      return {
        name: merchant.name,
        category: merchant.category,
        confidence: merchant.confidence,
        occurrences: merchant.occurrences
      };
    }
    
    // Încearcă să găsească parțial
    for (const [alias, merchant] of this.merchants) {
      if (cleaned.includes(alias) || alias.includes(cleaned)) {
        merchant.occurrences++;
        return {
          name: merchant.name,
          category: merchant.category,
          confidence: merchant.confidence * 0.8,
          occurrences: merchant.occurrences
        };
      }
    }
    
    // Merchant nou - încearcă să-l categorizeze
    const category = this.categorizeMerchant(description);
    const newMerchant = {
      name: this.cleanMerchantName(description),
      aliases: [cleaned],
      category: category,
      confidence: 0.5,
      occurrences: 1
    };
    
    this.merchants.set(cleaned, newMerchant);
    this.saveMerchant(newMerchant);
    
    return {
      name: newMerchant.name,
      category: newMerchant.category,
      confidence: newMerchant.confidence,
      occurrences: 1
    };
  }
  
  cleanMerchantName(description) {
    return description
      .replace(/\bpos\b/gi, '')
      .replace(/\bcard\b/gi, '')
      .replace(/\bterminal\b/gi, '')
      .replace(/\d+/g, '')
      .replace(/[*#]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  }
  
  categorizeMerchant(description) {
    const categories = {
      'Alimente': /lidl|kaufland|carrefour|auchan|mega|profi|penny|cora/i,
      'Combustibil': /omv|petrom|rompetrol|mol|lukoil|shell/i,
      'Utilități': /enel|eon|electrica|engie|digi|rds|rcs|telekom/i,
      'Farmacie': /farmaci|catena|sensiblu|help|dona/i,
      'Transport': /ratb|metrorex|uber|bolt|taxi/i,
      'Restaurante': /mcdonald|kfc|pizza|restaurant|bistro/i,
      'Îmbrăcăminte': /hm|zara|c&a|deichmann|nike|adidas/i,
      'Electronice': /emag|altex|flanco|media galaxy/i,
      'ATM': /atm|bancomat|retragere|cash/i
    };
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(description)) {
        return category;
      }
    }
    
    return 'Altele';
  }
  
  async saveMerchant(merchant) {
    try {
      await this.db.merchants.add(merchant);
    } catch (error) {
      console.warn('Could not save merchant:', error);
    }
  }
  
  // Procesare completă PDF cu ML
  async processPDFWithML(pdfArrayBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
      // Extrage text din PDF
      const text = await this.extractTextFromPDF(pdfArrayBuffer);
      
      // Detectează banca
      const bankDetection = await this.detectBankML(text);
      
      // Extrage tranzacțiile
      const transactions = await this.extractTransactionsML(text, bankDetection.bank);
      
      // Îmbunătățește tranzacțiile cu ML
      const enhancedTransactions = transactions.map(tx => this.enhanceTransactionML(tx));
      
      const processingTime = Date.now() - startTime;
      
      const result = {
        transactions: enhancedTransactions,
        bankDetection: bankDetection,
        metrics: {
          totalTransactions: enhancedTransactions.length,
          mlEnhancedCount: enhancedTransactions.filter(tx => tx.mlEnhanced).length,
          averageConfidence: enhancedTransactions.reduce((sum, tx) => sum + (tx.confidence || 0.5), 0) / enhancedTransactions.length,
          neuralNetworksApplied: true,
          ocrUsed: false
        },
        processingTime: processingTime,
        signature: {
          hash: this.generateSignature(text),
          timestamp: Date.now()
        },
        confidence: bankDetection.confidence
      };
      
      // Salvează rezultatul pentru învățare
      await this.saveProcessingResult(result);
      
      return result;
      
    } catch (error) {
      console.error('Error in ML PDF processing:', error);
      throw error;
    }
  }
  
  async extractTextFromPDF(pdfArrayBuffer) {
    // Import PDF.js dinamic pentru a evita probleme de build
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument(pdfArrayBuffer).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }
  
  async extractTransactionsML(text, detectedBank) {
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    const transactions = [];
    
    for (const line of lines) {
      const features = this.extractFeatures(line);
      const prediction = this.neuralNet.predict(features);
      
      // Verifică dacă linia conține o tranzacție (threshold 0.6)
      if (prediction.outputs[0] > 0.6) {
        const transaction = this.parseTransactionLine(line, detectedBank);
        if (transaction) {
          transaction.confidence = prediction.outputs[0];
          transaction.mlEnhanced = true;
          transactions.push(transaction);
        }
      }
    }
    
    // Fallback la parsing clasic dacă ML nu găsește suficient
    if (transactions.length < 3) {
      return this.extractTransactionsClassic(text, detectedBank);
    }
    
    return transactions;
  }
  
  extractTransactionsClassic(text, detectedBank) {
    const lines = text.split('\n');
    const transactions = [];
    
    const patterns = this.getBankPatterns(detectedBank);
    
    for (const line of lines) {
      if (patterns.datePattern.test(line) && patterns.amountPattern.test(line)) {
        const transaction = this.parseTransactionLine(line, detectedBank);
        if (transaction) {
          transaction.confidence = 0.7;
          transaction.mlEnhanced = false;
          transactions.push(transaction);
        }
      }
    }
    
    return transactions;
  }
  
  getBankPatterns(bank) {
    const patterns = {
      'BCR': {
        datePattern: /\b\d{2}[\.\/-]\d{2}[\.\/-]\d{4}\b/,
        amountPattern: /[+-]?\d{1,3}(?:[\.‚]\d{3})*[\.‚]\d{2}(?=\s|$|RON|LEI)/
      },
      'BT': {
        datePattern: /\b\d{2}-\d{2}-\d{4}\b/,
        amountPattern: /\d+[\.,]\d{2}\s*(?:RON|LEI)/
      },
      'ING': {
        datePattern: /\d{2}\.\d{2}\.\d{4}/,
        amountPattern: /-?\d+,\d{2}/
      },
      'RAIFFEISEN': {
        datePattern: /\d{2}\/\d{2}\/\d{4}/,
        amountPattern: /[+-]\s*\d+\.\d{2}/
      }
    };
    
    return patterns[bank] || patterns['BCR'];
  }
  
  parseTransactionLine(line, bank) {
    const patterns = this.getBankPatterns(bank);
    
    const dateMatch = line.match(patterns.datePattern);
    const amountMatch = line.match(patterns.amountPattern);
    
    if (!dateMatch || !amountMatch) return null;
    
    const date = this.normalizeDate(dateMatch[0]);
    const amount = this.parseAmount(amountMatch[0]);
    const description = this.extractDescription(line, dateMatch[0], amountMatch[0]);
    const type = amount < 0 ? 'expense' : 'income';
    
    return {
      data: date,
      suma: Math.abs(amount),
      descriere: description,
      tip: type,
      categorie: this.categorizeMerchant(description),
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  normalizeDate(dateStr) {
    const parts = dateStr.split(/[\.\/\-]/);
    if (parts.length === 3) {
      let [day, month, year] = parts;
      if (year.length === 2) {
        year = '20' + year;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  }
  
  parseAmount(amountStr) {
    return parseFloat(amountStr.replace(/[^\d,\.\-]/g, '').replace(',', '.'));
  }
  
  extractDescription(line, dateStr, amountStr) {
    return line
      .replace(dateStr, '')
      .replace(amountStr, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }
  
  enhanceTransactionML(transaction) {
    const merchantInfo = this.enhanceMerchant(transaction.descriere);
    
    return {
      ...transaction,
      merchantData: merchantInfo,
      improvements: [],
      enhancedTransaction: transaction,
      originalTransaction: transaction
    };
  }
  
  generateSignature(text) {
    // Hash simplu pentru identificare document
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  async saveProcessingResult(result) {
    try {
      await this.db.transactions.add({
        original: result.signature.hash,
        parsed: result.transactions,
        feedback: null,
        bank: result.bankDetection.bank,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Could not save processing result:', error);
    }
  }
  
  // Învățare din feedback
  async learnFromFeedback(feedback) {
    const features = this.extractFeatures(feedback.originalText);
    
    // Target pentru neural network
    const targets = new Array(5).fill(0);
    if (feedback.isCorrect) {
      targets[0] = 1; // Este tranzacție validă
    }
    
    // Antrenează rețeaua
    const error = this.neuralNet.train(features, targets);
    
    // Salvează feedback în baza de date
    await this.db.transactions.where('id').equals(feedback.transactionId).modify({
      feedback: feedback
    });
    
    // Salvează rețeaua antrenată
    await this.saveNeuralNetwork();
    
    return {
      accuracy: 1 - error,
      trained: true
    };
  }
  
  async saveModels() {
    await this.saveNeuralNetwork();
    console.log('🧠 ML models saved successfully');
  }
}

// Export singleton instance
export const mlEngine = new SimpleMLEngine();