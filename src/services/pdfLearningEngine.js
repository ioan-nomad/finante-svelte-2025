/**
 * PDF Learning Engine - Machine Learning System pentru Pattern Recognition
 * Învață din fiecare import PDF și îmbunătățește accuracy în timp real
 */

class PDFLearningEngine {
  constructor() {
    this.STORAGE_KEY = 'pdf_learning_patterns';
    this.MERCHANT_KEY = 'merchant_intelligence';
    this.ACCURACY_KEY = 'learning_accuracy_stats';
    this.USER_FEEDBACK_KEY = 'user_feedback_patterns';
    
    this.initializeEngine();
  }

  initializeEngine() {
    // Inițializare pattern database
    if (!this.getStoredPatterns()) {
      this.savePatterns({
        bankPatterns: {},
        merchantDict: {},
        accuracyStats: {
          totalImports: 0,
          successfulPredictions: 0,
          accuracyByBank: {}
        },
        userFeedback: []
      });
    }
  }

  /**
   * CORE LEARNING: Învață un pattern nou din tranzacție
   */
  learnFromTransaction(bankName, transaction, userCorrections = null) {
    const patterns = this.getStoredPatterns();
    const bankKey = this.normalizeBankName(bankName);
    
    // 1. Învață pattern-uri de formatare pentru bancă
    this.learnBankPattern(patterns, bankKey, transaction);
    
    // 2. Învață merchant intelligence
    this.learnMerchantPattern(patterns, transaction, userCorrections);
    
    // 3. Procesează feedback utilizator dacă există
    if (userCorrections) {
      this.procesUserFeedback(patterns, transaction, userCorrections);
    }
    
    // 4. Actualizează statistici accuracy
    this.updateAccuracyStats(patterns, bankKey, !!userCorrections);
    
    this.savePatterns(patterns);
    
    return {
      learned: true,
      confidence: this.calculateConfidence(patterns, bankKey, transaction),
      patternsCount: Object.keys(patterns.bankPatterns[bankKey] || {}).length,
      merchantsCount: Object.keys(patterns.merchantDict).length
    };
  }

  /**
   * Învață pattern-uri specifice băncii din structura tranzacției
   */
  learnBankPattern(patterns, bankKey, transaction) {
    if (!patterns.bankPatterns[bankKey]) {
      patterns.bankPatterns[bankKey] = {
        dateFormats: new Set(),
        amountFormats: new Set(),
        descriptionPatterns: new Set(),
        fieldPositions: {},
        successRate: 0,
        totalProcessed: 0
      };
    }
    
    const bankPattern = patterns.bankPatterns[bankKey];
    
    // Învață formate de dată
    if (transaction.data) {
      bankPattern.dateFormats.add(this.extractDatePattern(transaction.data));
    }
    
    // Învață formate de sumă
    if (transaction.suma) {
      bankPattern.amountFormats.add(this.extractAmountPattern(transaction.suma));
    }
    
    // Învață pattern-uri de descriere
    if (transaction.descriere) {
      const descPattern = this.extractDescriptionPattern(transaction.descriere);
      bankPattern.descriptionPatterns.add(descPattern);
    }
    
    bankPattern.totalProcessed++;
    
    // Convertim Set-urile înapoi la Array pentru storage
    patterns.bankPatterns[bankKey] = {
      ...bankPattern,
      dateFormats: Array.from(bankPattern.dateFormats),
      amountFormats: Array.from(bankPattern.amountFormats),
      descriptionPatterns: Array.from(bankPattern.descriptionPatterns)
    };
  }

  /**
   * Învață despre comercianți și categorizarea lor
   */
  learnMerchantPattern(patterns, transaction, userCorrections) {
    const merchant = this.extractMerchantName(transaction.descriere);
    if (!merchant) return;
    
    const normalizedMerchant = merchant.toLowerCase().trim();
    
    if (!patterns.merchantDict[normalizedMerchant]) {
      patterns.merchantDict[normalizedMerchant] = {
        originalName: merchant,
        category: null,
        confidence: 0.1,
        occurrences: 0,
        lastSeen: new Date().toISOString(),
        patterns: []
      };
    }
    
    const merchantData = patterns.merchantDict[normalizedMerchant];
    merchantData.occurrences++;
    merchantData.lastSeen = new Date().toISOString();
    
    // Dacă avem categorie din user corrections sau din tranzacție
    if (userCorrections?.categorie || transaction.categorie) {
      const category = userCorrections?.categorie || transaction.categorie;
      if (merchantData.category === category) {
        merchantData.confidence = Math.min(1.0, merchantData.confidence + 0.1);
      } else {
        merchantData.category = category;
        merchantData.confidence = 0.6; // Reset confidence cu nouă categorie
      }
    }
    
    // Învață pattern-uri în descriere pentru acest merchant
    if (transaction.descriere) {
      const pattern = this.extractMerchantPattern(transaction.descriere, merchant);
      if (!merchantData.patterns.includes(pattern)) {
        merchantData.patterns.push(pattern);
      }
    }
  }

  /**
   * Procesează feedback-ul utilizatorului pentru învățare
   */
  procesUserFeedback(patterns, originalTransaction, corrections) {
    patterns.userFeedback.push({
      timestamp: new Date().toISOString(),
      original: {
        descriere: originalTransaction.descriere,
        suma: originalTransaction.suma,
        categorie: originalTransaction.categorie
      },
      corrected: corrections,
      learned: true
    });
    
    // Păstrează doar ultimele 1000 feedback-uri
    if (patterns.userFeedback.length > 1000) {
      patterns.userFeedback = patterns.userFeedback.slice(-1000);
    }
  }

  /**
   * PREDICTION: Prezice categoria și corectează tranzacția
   */
  predictAndEnhance(bankName, transaction) {
    const patterns = this.getStoredPatterns();
    const bankKey = this.normalizeBankName(bankName);
    
    const prediction = {
      originalTransaction: { ...transaction },
      enhancedTransaction: { ...transaction },
      confidence: 0,
      improvements: [],
      merchantData: null
    };
    
    // 1. Îmbunătățește parsing bazat pe pattern-uri învățate
    if (patterns.bankPatterns[bankKey]) {
      this.enhanceWithBankPatterns(prediction, patterns.bankPatterns[bankKey]);
    }
    
    // 2. Prezice categoria bazat pe merchant intelligence
    this.predictCategory(prediction, patterns.merchantDict);
    
    // 3. Aplică lecții din user feedback
    this.applyUserLearnings(prediction, patterns.userFeedback);
    
    // 4. Calculează confidence total
    prediction.confidence = this.calculateOverallConfidence(prediction);
    
    return prediction;
  }

  enhanceWithBankPatterns(prediction, bankPattern) {
    const transaction = prediction.enhancedTransaction;
    
    // Îmbunătățește parsing-ul datei dacă e necesar
    if (!transaction.data || !this.isValidDate(transaction.data)) {
      const datePattern = bankPattern.dateFormats[0];
      if (datePattern && transaction.descriere) {
        const extractedDate = this.tryExtractDateWithPattern(
          transaction.descriere, 
          datePattern
        );
        if (extractedDate) {
          transaction.data = extractedDate;
          prediction.improvements.push('Data corectată cu pattern învățat');
        }
      }
    }
    
    // Îmbunătățește parsing-ul sumei
    if (!transaction.suma || transaction.suma === 0) {
      const amountPattern = bankPattern.amountFormats[0];
      if (amountPattern && transaction.descriere) {
        const extractedAmount = this.tryExtractAmountWithPattern(
          transaction.descriere,
          amountPattern
        );
        if (extractedAmount) {
          transaction.suma = extractedAmount;
          prediction.improvements.push('Suma corectată cu pattern învățat');
        }
      }
    }
  }

  predictCategory(prediction, merchantDict) {
    const merchant = this.extractMerchantName(prediction.enhancedTransaction.descriere);
    if (!merchant) return;
    
    const normalizedMerchant = merchant.toLowerCase().trim();
    
    // Căutare exactă
    let merchantData = merchantDict[normalizedMerchant];
    
    // Căutare fuzzy dacă nu găsește exact
    if (!merchantData) {
      merchantData = this.findSimilarMerchant(normalizedMerchant, merchantDict);
    }
    
    if (merchantData && merchantData.category && merchantData.confidence > 0.5) {
      prediction.enhancedTransaction.categorie = merchantData.category;
      prediction.merchantData = {
        name: merchantData.originalName,
        confidence: merchantData.confidence,
        occurrences: merchantData.occurrences,
        lastSeen: merchantData.lastSeen
      };
      prediction.improvements.push(`Categorie prezisă: ${merchantData.category} (${Math.round(merchantData.confidence * 100)}% confidence)`);
    }
  }

  applyUserLearnings(prediction, userFeedback) {
    const transaction = prediction.enhancedTransaction;
    
    // Caută în feedback-uri similare
    const similarFeedback = userFeedback.filter(feedback => {
      return this.calculateSimilarity(
        feedback.original.descriere, 
        transaction.descriere
      ) > 0.7;
    });
    
    if (similarFeedback.length > 0) {
      const mostRecent = similarFeedback[similarFeedback.length - 1];
      
      // Aplică corectările învățate
      if (mostRecent.corrected.categorie && !transaction.categorie) {
        transaction.categorie = mostRecent.corrected.categorie;
        prediction.improvements.push('Categorie aplicată din experiență anterioară');
      }
      
      if (mostRecent.corrected.descriere && 
          mostRecent.corrected.descriere !== mostRecent.original.descriere) {
        transaction.descriere = mostRecent.corrected.descriere;
        prediction.improvements.push('Descriere îmbunătățită din experiență');
      }
    }
  }

  /**
   * INTELLIGENCE: Metodele de extracție și pattern matching
   */
  extractMerchantName(description) {
    if (!description) return null;
    
    // Pattern-uri pentru extragerea numelui comerciantului
    const patterns = [
      /(?:POS|CARD)\s+(.+?)(?:\s+\d{2}\/\d{2}|\s+RRN|\s*$)/i,
      /(?:PLATA|CUMPARARE)\s+(.+?)(?:\s+\d{2}\/\d{2}|\s*$)/i,
      /TRANSFER\s+CATRE\s+(.+?)(?:\s+REF|\s*$)/i,
      /(.+?)\s+(?:BUCURESTI|CLUJ|TIMISOARA|IASI|CONSTANTA)/i,
      /(.+?)\s+(?:SRL|SA|PFA|II)/i
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, ' ');
      }
    }
    
    // Fallback: ia primele cuvinte până la un separator
    const words = description.trim().split(/\s+/);
    if (words.length >= 2) {
      return words.slice(0, 2).join(' ');
    }
    
    return words[0];
  }

  extractDatePattern(dateStr) {
    if (!dateStr) return null;
    
    // Identifică pattern-ul datei
    if (/\d{2}\/\d{2}\/\d{4}/.test(dateStr)) return 'DD/MM/YYYY';
    if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return 'YYYY-MM-DD';
    if (/\d{2}\.\d{2}\.\d{4}/.test(dateStr)) return 'DD.MM.YYYY';
    if (/\d{2}-\d{2}-\d{4}/.test(dateStr)) return 'DD-MM-YYYY';
    
    return 'UNKNOWN';
  }

  extractAmountPattern(amountStr) {
    if (!amountStr) return null;
    
    const str = amountStr.toString();
    
    if (/^\d+\.\d{2}$/.test(str)) return 'DECIMAL_DOT';
    if (/^\d+,\d{2}$/.test(str)) return 'DECIMAL_COMMA';
    if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(str)) return 'THOUSAND_COMMA_DECIMAL_DOT';
    if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(str)) return 'THOUSAND_DOT_DECIMAL_COMMA';
    
    return 'SIMPLE_NUMBER';
  }

  extractDescriptionPattern(description) {
    if (!description) return null;
    
    // Înlocuiește numerele și datele cu placeholders pentru pattern
    return description
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '[DATE]')
      .replace(/\d{2}\.\d{2}\.\d{4}/g, '[DATE]')
      .replace(/\d{2}-\d{2}-\d{4}/g, '[DATE]')
      .replace(/\d+\.\d{2}/g, '[AMOUNT]')
      .replace(/\d+,\d{2}/g, '[AMOUNT]')
      .replace(/\d{4,}/g, '[NUMBER]')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractMerchantPattern(description, merchantName) {
    // Creează un pattern în care numele comerciantului e placeholder
    return description.replace(new RegExp(merchantName, 'gi'), '[MERCHANT]');
  }

  /**
   * UTILITIES: Funcții helper
   */
  normalizeBankName(bankName) {
    return bankName.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w]/g, '');
  }

  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  findSimilarMerchant(merchantName, merchantDict) {
    let bestMatch = null;
    let bestSimilarity = 0;
    
    for (const [key, data] of Object.entries(merchantDict)) {
      const similarity = this.calculateSimilarity(merchantName, key);
      if (similarity > bestSimilarity && similarity > 0.8) {
        bestSimilarity = similarity;
        bestMatch = data;
      }
    }
    
    return bestMatch;
  }

  calculateConfidence(patterns, bankKey, transaction) {
    let confidence = 0.1;
    
    // Confidence bazat pe numărul de pattern-uri învățate
    if (patterns.bankPatterns[bankKey]) {
      const bankPattern = patterns.bankPatterns[bankKey];
      confidence += Math.min(0.3, bankPattern.totalProcessed * 0.01);
    }
    
    // Confidence bazat pe merchant intelligence
    const merchant = this.extractMerchantName(transaction.descriere);
    if (merchant) {
      const merchantData = patterns.merchantDict[merchant.toLowerCase()];
      if (merchantData) {
        confidence += merchantData.confidence * 0.4;
      }
    }
    
    // Confidence bazat pe user feedback
    confidence += Math.min(0.2, patterns.userFeedback.length * 0.001);
    
    return Math.min(1.0, confidence);
  }

  calculateOverallConfidence(prediction) {
    let confidence = 0.3; // Base confidence
    
    // +0.2 pentru merchant data
    if (prediction.merchantData) {
      confidence += prediction.merchantData.confidence * 0.2;
    }
    
    // +0.3 pentru improvements
    confidence += Math.min(0.3, prediction.improvements.length * 0.1);
    
    // +0.2 pentru completitudine datelor
    const transaction = prediction.enhancedTransaction;
    if (transaction.data && transaction.suma && transaction.categorie) {
      confidence += 0.2;
    }
    
    return Math.min(1.0, confidence);
  }

  updateAccuracyStats(patterns, bankKey, hadUserCorrections) {
    patterns.accuracyStats.totalImports++;
    
    if (!hadUserCorrections) {
      patterns.accuracyStats.successfulPredictions++;
    }
    
    // Stats pe bancă
    if (!patterns.accuracyStats.accuracyByBank[bankKey]) {
      patterns.accuracyStats.accuracyByBank[bankKey] = {
        total: 0,
        successful: 0,
        accuracy: 0
      };
    }
    
    const bankStats = patterns.accuracyStats.accuracyByBank[bankKey];
    bankStats.total++;
    if (!hadUserCorrections) {
      bankStats.successful++;
    }
    bankStats.accuracy = bankStats.successful / bankStats.total;
  }

  /**
   * ANALYTICS: Funcții pentru statistici și monitorizare
   */
  getAnalytics() {
    const patterns = this.getStoredPatterns();
    
    const totalMerchants = Object.keys(patterns.merchantDict).length;
    const totalBanks = Object.keys(patterns.bankPatterns).length;
    const totalFeedback = patterns.userFeedback.length;
    
    const overallAccuracy = patterns.accuracyStats.totalImports > 0 
      ? patterns.accuracyStats.successfulPredictions / patterns.accuracyStats.totalImports
      : 0;
    
    return {
      overview: {
        totalImports: patterns.accuracyStats.totalImports,
        overallAccuracy: Math.round(overallAccuracy * 100),
        merchantsLearned: totalMerchants,
        banksSupported: totalBanks,
        feedbackProcessed: totalFeedback
      },
      bankAccuracy: patterns.accuracyStats.accuracyByBank,
      topMerchants: this.getTopMerchants(patterns.merchantDict),
      recentLearnings: patterns.userFeedback.slice(-10)
    };
  }

  getTopMerchants(merchantDict) {
    return Object.entries(merchantDict)
      .map(([key, data]) => ({
        name: data.originalName,
        category: data.category,
        confidence: Math.round(data.confidence * 100),
        occurrences: data.occurrences,
        lastSeen: data.lastSeen
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 20);
  }

  /**
   * STORAGE: Salvare și încărcare pattern-uri
   */
  getStoredPatterns() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading patterns:', error);
      return null;
    }
  }

  savePatterns(patterns) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
      return true;
    } catch (error) {
      console.error('Error saving patterns:', error);
      return false;
    }
  }

  /**
   * MAINTENANCE: Curățare și optimizare
   */
  cleanup() {
    const patterns = this.getStoredPatterns();
    if (!patterns) return;
    
    // Șterge merchant-ii vechi nefolosiți (peste 6 luni)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (const [key, data] of Object.entries(patterns.merchantDict)) {
      if (new Date(data.lastSeen) < sixMonthsAgo && data.occurrences < 3) {
        delete patterns.merchantDict[key];
      }
    }
    
    // Păstrează doar ultimele 500 feedback-uri
    if (patterns.userFeedback.length > 500) {
      patterns.userFeedback = patterns.userFeedback.slice(-500);
    }
    
    this.savePatterns(patterns);
  }

  /**
   * DEV/TESTING: Funcții pentru development și testing
   */
  exportData() {
    return this.getStoredPatterns();
  }

  importData(data) {
    return this.savePatterns(data);
  }

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeEngine();
  }

  // Helper functions pentru tryExtract...
  tryExtractDateWithPattern(text, pattern) {
    // Implementare simplă - poate fi extinsă
    const dateRegex = /\d{2}[\/\.\-]\d{2}[\/\.\-]\d{4}/;
    const match = text.match(dateRegex);
    return match ? match[0] : null;
  }

  tryExtractAmountWithPattern(text, pattern) {
    // Implementare simplă - poate fi extinsă
    const amountRegex = /\d+[,\.]\d{2}/;
    const match = text.match(amountRegex);
    return match ? parseFloat(match[0].replace(',', '.')) : null;
  }

  isValidDate(dateStr) {
    return !isNaN(new Date(dateStr).getTime());
  }
}

// Singleton instance
const pdfLearningEngine = new PDFLearningEngine();

export default pdfLearningEngine;