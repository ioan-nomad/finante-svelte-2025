/**
 * PATTERN RECOGNITION ENGINE - Advanced pattern detection și learning
 * Features: Document signatures, Bank detection, Transaction patterns, Fuzzy matching
 */

export class PatternRecognitionEngine {
  constructor() {
    console.log('🔍 Initializing Pattern Recognition Engine...');
    
    // Bank detection patterns
    this.bankPatterns = new Map([
      ['BCR', {
        signatures: [
          'BANCA COMERCIALĂ ROMÂNĂ',
          'BCR',
          'EXTRAS DE CONT BCR',
          'GEORGE BCR'
        ],
        documentPatterns: [
          /EXTRAS\s+DE\s+CONT/i,
          /SITUAȚIA\s+CONTULUI/i,
          /BCR\s+BANK/i
        ],
        fieldPatterns: {
          date: /\b\d{2}[\.\/-]\d{2}[\.\/-]\d{4}\b/g,
          amount: /[+-]?\d{1,3}(?:[\.,]\d{3})*[\.,]\d{2}(?=\s|$|RON|LEI)/g,
          description: /(?:PLATA|CUMPARARE|TRANSFER|RETRAGERE)\s+.{10,}/gi
        },
        confidence: 0.9
      }],
      
      ['BT', {
        signatures: [
          'BANCA TRANSILVANIA',
          'BT',
          'NEO BT',
          'BT24'
        ],
        documentPatterns: [
          /BANCA\s+TRANSILVANIA/i,
          /EXTRAS\s+CONT/i,
          /BT24/i
        ],
        fieldPatterns: {
          date: /\b\d{2}-\d{2}-\d{4}\b/g,
          amount: /\d+[\.,]\d{2}\s*(?:RON|LEI)/g,
          description: /POS\s+.{5,}|CARD\s+.{5,}|TRANSFER\s+.{5,}/gi
        },
        confidence: 0.85
      }],
      
      ['ING', {
        signatures: [
          'ING BANK ROMÂNIA',
          'ING PERSONAL',
          'ING HOME BANK'
        ],
        documentPatterns: [
          /ING\s+BANK/i,
          /EXTRAS\s+BANCAR/i,
          /HOME\s+BANK/i
        ],
        fieldPatterns: {
          date: /\d{2}\.\d{2}\.\d{4}/g,
          amount: /-?\d+,\d{2}/g,
          description: /Tranzacție\s+.{10,}|Plată\s+.{10,}/gi
        },
        confidence: 0.8
      }],
      
      ['RAIFFEISEN', {
        signatures: [
          'RAIFFEISEN BANK',
          'SMART MOBILE',
          'RAIFFEISEN DIRECT'
        ],
        documentPatterns: [
          /RAIFFEISEN\s+BANK/i,
          /SMART\s+MOBILE/i
        ],
        fieldPatterns: {
          date: /\d{2}\/\d{2}\/\d{4}/g,
          amount: /[+-]\s*\d+\.\d{2}/g,
          description: /CUMPARARE\s+.{5,}|RETRAGERE\s+.{5,}/gi
        },
        confidence: 0.75
      }]
    ]);
    
    // Learned patterns storage
    this.learnedPatterns = new Map();
    
    // Document signatures pentru rapid detection
    this.documentSignatures = new Map();
    
    // Pattern matching statistics
    this.stats = {
      totalDocuments: 0,
      correctDetections: 0,
      averageConfidence: 0,
      patternsLearned: 0
    };
    
    this.initialized = false;
  }

  /**
   * Initialize Pattern Recognition Engine
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('⚙️ Setting up pattern recognition...');
    
    try {
      // Load learned patterns from storage
      await this.loadLearnedPatterns();
      
      // Initialize document signatures
      this.initializeSignatures();
      
      // Setup fuzzy matching algorithms
      this.initializeFuzzyMatching();
      
      this.initialized = true;
      console.log('✅ Pattern Recognition Engine ready!');
      
    } catch (error) {
      console.error('❌ Pattern Recognition initialization failed:', error);
    }
  }

  /**
   * BANK DETECTION - Main entry point
   */
  async detectBank(text) {
    if (!text) {
      return { bank: 'UNKNOWN', confidence: 0, method: 'no_input' };
    }
    
    console.log('🏦 Detecting bank from document...');
    
    // Generate document signature
    const signature = this.generateSignature(text);
    
    // Try known signature match first
    const knownMatch = this.matchKnownSignature(signature);
    if (knownMatch.confidence > 0.8) {
      return knownMatch;
    }
    
    // Try pattern-based detection
    const patternMatch = this.detectBankByPatterns(text);
    if (patternMatch.confidence > 0.6) {
      return patternMatch;
    }
    
    // Try fuzzy matching pentru learned patterns
    const fuzzyMatch = await this.fuzzyMatchBank(text);
    if (fuzzyMatch.confidence > 0.5) {
      return fuzzyMatch;
    }
    
    // Fallback la keyword detection
    const keywordMatch = this.detectBankByKeywords(text);
    
    return {
      bank: keywordMatch.bank || 'UNKNOWN',
      confidence: keywordMatch.confidence || 0.2,
      method: 'fallback_keywords',
      signature: signature
    };
  }

  /**
   * SIGNATURE GENERATION - Create unique document fingerprint
   */
  generateSignature(text) {
    const features = {
      // Text statistics
      length: Math.min(text.length / 1000, 1),
      lineCount: (text.match(/\\n/g) || []).length / 100,
      
      // Character patterns
      digitRatio: (text.match(/\d/g) || []).length / text.length,
      uppercaseRatio: (text.match(/[A-Z]/g) || []).length / text.length,
      
      // Banking keywords density
      bankKeywords: this.countBankKeywords(text) / text.length,
      
      // Structure patterns
      tableStructure: this.detectTableStructure(text),
      datePatterns: this.countDatePatterns(text),
      amountPatterns: this.countAmountPatterns(text)
    };
    
    // Create hash-like signature
    const signature = this.createFeatureHash(features);
    
    return {
      hash: signature,
      features: features,
      created: Date.now()
    };
  }

  createFeatureHash(features) {
    // Simple feature hash pentru signature
    const values = Object.values(features).map(v => 
      typeof v === 'number' ? Math.round(v * 1000) : 
      typeof v === 'boolean' ? (v ? 1 : 0) : 0
    );
    
    let hash = 0;
    const str = values.join('');
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert la 32bit
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * PATTERN MATCHING
   */
  detectBankByPatterns(text) {
    let bestMatch = { bank: 'UNKNOWN', confidence: 0, patterns: [] };
    
    for (const [bankName, config] of this.bankPatterns.entries()) {
      let score = 0;
      const matchedPatterns = [];
      
      // Check document patterns
      for (const pattern of config.documentPatterns) {
        if (pattern.test(text)) {
          score += 0.3;
          matchedPatterns.push(`document_pattern: ${pattern}`);
        }
      }
      
      // Check signature strings
      for (const signature of config.signatures) {
        if (text.toUpperCase().includes(signature.toUpperCase())) {
          score += 0.4;
          matchedPatterns.push(`signature: ${signature}`);
        }
      }
      
      // Check field patterns
      const fieldScore = this.evaluateFieldPatterns(text, config.fieldPatterns);
      score += fieldScore * 0.3;
      
      if (fieldScore > 0) {
        matchedPatterns.push(`field_patterns: ${fieldScore.toFixed(2)}`);
      }
      
      // Apply bank confidence modifier
      score *= config.confidence;
      
      if (score > bestMatch.confidence) {
        bestMatch = {
          bank: bankName,
          confidence: Math.min(score, 1.0),
          patterns: matchedPatterns,
          method: 'pattern_matching'
        };
      }
    }
    
    return bestMatch;
  }

  evaluateFieldPatterns(text, patterns) {
    let score = 0;
    let totalPatterns = Object.keys(patterns).length;
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Score bazat pe numărul de matches
        score += Math.min(matches.length / 10, 1);
      }
    }
    
    return score / totalPatterns;
  }

  /**
   * FUZZY MATCHING pentru learned patterns
   */
  async fuzzyMatchBank(text) {
    const documentSignature = this.generateSignature(text);
    let bestMatch = { bank: 'UNKNOWN', confidence: 0 };
    
    for (const [signature, bankInfo] of this.learnedPatterns.entries()) {
      const similarity = this.calculateSignatureSimilarity(
        documentSignature.features,
        bankInfo.features
      );
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          bank: bankInfo.bank,
          confidence: similarity,
          method: 'fuzzy_learned_pattern',
          learnedFrom: bankInfo.samples
        };
      }
    }
    
    return bestMatch;
  }

  calculateSignatureSimilarity(features1, features2) {
    let similarity = 0;
    let validFeatures = 0;
    
    const featureKeys = Object.keys(features1);
    
    for (const key of featureKeys) {
      const val1 = features1[key];
      const val2 = features2[key];
      
      if (typeof val1 === 'number' && typeof val2 === 'number') {
        // Euclidean similarity pentru numerical features
        const diff = Math.abs(val1 - val2);
        similarity += Math.max(0, 1 - diff);
        validFeatures++;
      } else if (typeof val1 === 'boolean' && typeof val2 === 'boolean') {
        similarity += val1 === val2 ? 1 : 0;
        validFeatures++;
      }
    }
    
    return validFeatures > 0 ? similarity / validFeatures : 0;
  }

  /**
   * TRANSACTION PATTERN ANALYSIS
   */
  async isTransactionLine(line, pattern) {
    if (!line || line.trim().length < 10) {
      return { probability: 0, confidence: 0 };
    }
    
    let score = 0;
    const features = [];
    
    // Check pentru date pattern
    if (this.containsDatePattern(line)) {
      score += 0.3;
      features.push('date_found');
    }
    
    // Check pentru amount pattern
    if (this.containsAmountPattern(line)) {
      score += 0.4;
      features.push('amount_found');
    }
    
    // Check pentru transaction keywords
    const transactionKeywords = [
      'plata', 'cumparare', 'transfer', 'retragere', 'depunere', 
      'card', 'pos', 'atm', 'virament', 'debit', 'credit'
    ];
    
    for (const keyword of transactionKeywords) {
      if (line.toLowerCase().includes(keyword)) {
        score += 0.1;
        features.push(`keyword_${keyword}`);
        break;
      }
    }
    
    // Check pentru merchant indicators
    if (this.containsMerchantIndicators(line)) {
      score += 0.2;
      features.push('merchant_indicators');
    }
    
    return {
      probability: Math.min(score, 1.0),
      confidence: score > 0.6 ? 0.8 : score > 0.3 ? 0.6 : 0.3,
      features: features
    };
  }

  async extractTransactionFields(line, pattern) {
    const fields = {
      date: null,
      amount: null,
      description: null,
      type: null,
      category: null,
      confidence: 0
    };
    
    try {
      // Extract date
      const dateMatch = this.extractDate(line);
      if (dateMatch) {
        fields.date = dateMatch.value;
        fields.confidence += 0.25;
      }
      
      // Extract amount
      const amountMatch = this.extractAmount(line);
      if (amountMatch) {
        fields.amount = amountMatch.value;
        fields.type = amountMatch.value < 0 ? 'expense' : 'income';
        fields.confidence += 0.35;
      }
      
      // Extract description
      const descriptionMatch = this.extractDescription(line, dateMatch, amountMatch);
      if (descriptionMatch) {
        fields.description = descriptionMatch.value;
        fields.confidence += 0.2;
      }
      
      // Predict category
      if (fields.description) {
        const categoryPrediction = this.predictCategoryFromDescription(fields.description);
        fields.category = categoryPrediction.category;
        fields.confidence += categoryPrediction.confidence * 0.2;
      }
      
    } catch (error) {
      console.warn('⚠️ Transaction field extraction failed:', error);
      fields.confidence = 0.1;
    }
    
    return fields;
  }

  /**
   * FIELD EXTRACTION METHODS
   */
  extractDate(line) {
    const datePatterns = [
      /\b(\d{2})[\.\/-](\d{2})[\.\/-](\d{4})\b/,
      /\b(\d{4})[\.\/-](\d{2})[\.\/-](\d{2})\b/,
      /\b(\d{2})[\.\/-](\d{2})[\.\/-](\d{2})\b/
    ];
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        return {
          value: this.normalizeDate(match[0]),
          confidence: 0.9,
          raw: match[0]
        };
      }
    }
    
    return null;
  }

  extractAmount(line) {
    const amountPatterns = [
      /([+-]?)\s*(\d{1,3}(?:[\.,]\d{3})*[\.,]\d{2})\s*(?:RON|LEI|$)?/g,
      /([+-]?)\s*(\d+[\.,]\d{2})\s*(?:RON|LEI|$)?/g
    ];
    
    const amounts = [];
    
    for (const pattern of amountPatterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const sign = match[1] === '-' || line.includes('debit') ? -1 : 1;
        const value = parseFloat(match[2].replace(',', '.')) * sign;
        
        amounts.push({
          value: value,
          confidence: 0.8,
          raw: match[0]
        });
      }
    }
    
    // Return largest amount dacă sunt multiple
    return amounts.length > 0 ? 
      amounts.reduce((max, current) => 
        Math.abs(current.value) > Math.abs(max.value) ? current : max
      ) : null;
  }

  extractDescription(line, dateMatch, amountMatch) {
    let description = line;
    
    // Remove date și amount din description
    if (dateMatch) {
      description = description.replace(dateMatch.raw, '');
    }
    if (amountMatch) {
      description = description.replace(amountMatch.raw, '');
    }
    
    // Clean up description
    description = description
      .replace(/\\s+/g, ' ')
      .replace(/^[\\s\\-\\*]+|[\\s\\-\\*]+$/g, '')
      .trim();
    
    if (description.length > 5) {
      return {
        value: description,
        confidence: 0.7
      };
    }
    
    return null;
  }

  /**
   * PATTERN LEARNING
   */
  async findOrLearnPattern(signature, text, bankName) {
    // Check dacă pattern-ul există deja
    const existingPattern = this.learnedPatterns.get(signature.hash);
    
    if (existingPattern) {
      existingPattern.usage++;
      existingPattern.lastUsed = Date.now();
      return existingPattern;
    }
    
    // Learn new pattern
    const newPattern = {
      signature: signature,
      bank: bankName,
      text: text.substring(0, 500), // Sample pentru reference
      learned: Date.now(),
      usage: 1,
      lastUsed: Date.now(),
      accuracy: 0.5, // Initial accuracy
      features: signature.features,
      samples: 1
    };
    
    this.learnedPatterns.set(signature.hash, newPattern);
    this.stats.patternsLearned++;
    
    console.log(`📚 Learned new pattern pentru ${bankName}`);
    
    return newPattern;
  }

  async updatePatternAccuracy(signatureHash, wasCorrect) {
    const pattern = this.learnedPatterns.get(signatureHash);
    if (!pattern) return;
    
    // Update accuracy cu learning rate
    const learningRate = 0.1;
    const target = wasCorrect ? 1.0 : 0.0;
    
    pattern.accuracy = pattern.accuracy * (1 - learningRate) + target * learningRate;
    pattern.samples++;
    pattern.lastUsed = Date.now();
    
    console.log(`📊 Updated pattern accuracy: ${pattern.accuracy.toFixed(3)}`);
  }

  async updatePatterns(feedbackData) {
    console.log('🔄 Updating patterns cu feedback data...');
    
    for (const feedback of feedbackData) {
      if (feedback.signature) {
        await this.updatePatternAccuracy(
          feedback.signature, 
          feedback.wasCorrect
        );
      }
    }
  }

  /**
   * FUZZY MATCHING pentru merchant recognition
   */
  async fuzzyMatchMerchant(description) {
    // Simple fuzzy matching implementation
    // În production ar folosi algoritmi mai avansați
    
    const merchants = [
      { name: 'Kaufland', patterns: ['kaufland', 'kaufl'], category: 'Alimentar' },
      { name: 'Lidl', patterns: ['lidl'], category: 'Alimentar' },
      { name: 'OMV', patterns: ['omv', 'petrom'], category: 'Transport' },
      { name: 'McDonals', patterns: ['mcdonald', 'mcdon'], category: 'Restaurant' }
    ];
    
    let bestMatch = null;
    let bestScore = 0;
    
    const normalizedDesc = description.toLowerCase();
    
    for (const merchant of merchants) {
      for (const pattern of merchant.patterns) {
        const score = this.calculateStringsimilarity(normalizedDesc, pattern);
        
        if (score > bestScore && score > 0.6) {
          bestScore = score;
          bestMatch = {
            name: merchant.name,
            confidence: score,
            category: merchant.category,
            matchedPattern: pattern
          };
        }
      }
    }
    
    return bestMatch;
  }

  calculateStringSimilarity(str1, str2) {
    // Jaro-Winkler similarity simplificată
    if (str1.includes(str2) || str2.includes(str1)) {
      return 0.9;
    }
    
    // Levenshtein distance
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return 1 - (distance / maxLength);
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

  /**
   * UTILITY FUNCTIONS
   */
  countBankKeywords(text) {
    const keywords = [
      'banca', 'bank', 'cont', 'sold', 'extras', 'tranzactie',
      'plata', 'transfer', 'card', 'debit', 'credit'
    ];
    
    let count = 0;
    const lowerText = text.toLowerCase();
    
    for (const keyword of keywords) {
      const matches = lowerText.match(new RegExp(keyword, 'g'));
      count += matches ? matches.length : 0;
    }
    
    return count;
  }

  detectTableStructure(text) {
    // Simple table detection
    const lines = text.split('\\n');
    let tableLines = 0;
    
    for (const line of lines) {
      // Check pentru tab-separated values sau multiple spaces
      if (/\\t/.test(line) || /\\s{3,}/.test(line)) {
        tableLines++;
      }
    }
    
    return tableLines > 3; // Consider table dacă >3 lines cu structure
  }

  countDatePatterns(text) {
    const datePattern = /\b\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4}\b/g;
    const matches = text.match(datePattern);
    return matches ? matches.length : 0;
  }

  countAmountPatterns(text) {
    const amountPattern = /\d+[\.,]\d{2}/g;
    const matches = text.match(amountPattern);
    return matches ? matches.length : 0;
  }

  containsDatePattern(line) {
    return /\b\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4}\b/.test(line);
  }

  containsAmountPattern(line) {
    return /\d+[\.,]\d{2}/.test(line);
  }

  containsMerchantIndicators(line) {
    const indicators = ['srl', 'sa', 'pfa', 'ii', 'ltd', 'inc'];
    const lowerLine = line.toLowerCase();
    return indicators.some(indicator => lowerLine.includes(indicator));
  }

  normalizeDate(dateStr) {
    // Normalize date la YYYY-MM-DD format
    const parts = dateStr.split(/[\\.\\/\\-]/);
    
    if (parts.length === 3) {
      const [p1, p2, p3] = parts;
      
      // Determine format
      if (p1.length === 4) {
        // YYYY-MM-DD
        return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      } else if (p3.length === 4) {
        // DD-MM-YYYY
        return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
      }
    }
    
    return dateStr; // Fallback la original
  }

  predictCategoryFromDescription(description) {
    const categories = {
      'Alimentar': ['kaufland', 'lidl', 'carrefour', 'mega', 'profi', 'auchan'],
      'Transport': ['omv', 'petrom', 'rompetrol', 'benzina', 'uber', 'taxi'],
      'Utilități': ['enel', 'eon', 'electrica', 'gaz', 'apa', 'salubris'],
      'Restaurant': ['mcdonald', 'kfc', 'burger', 'pizza', 'restaurant'],
      'Shopping': ['zara', 'h&m', 'emag', 'fashion', 'mall']
    };
    
    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return { category, confidence: 0.8 };
        }
      }
    }
    
    return { category: 'Altele', confidence: 0.3 };
  }

  detectBankByKeywords(text) {
    // Fallback bank detection prin keywords
    const bankKeywords = {
      'BCR': ['bcr', 'comercială română', 'george'],
      'BT': ['transilvania', 'bt24', 'neo'],
      'ING': ['ing bank', 'homebank', 'ing personal'],
      'RAIFFEISEN': ['raiffeisen', 'smart mobile'],
      'UNICREDIT': ['unicredit', 'credit bank']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [bank, keywords] of Object.entries(bankKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return { bank, confidence: 0.4 };
        }
      }
    }
    
    return { bank: 'UNKNOWN', confidence: 0.1 };
  }

  matchKnownSignature(signature) {
    // Match known document signatures
    for (const [hash, pattern] of this.documentSignatures.entries()) {
      const similarity = this.calculateSignatureSimilarity(
        signature.features,
        pattern.features
      );
      
      if (similarity > 0.8) {
        return {
          bank: pattern.bank,
          confidence: similarity,
          method: 'known_signature',
          signatureHash: hash
        };
      }
    }
    
    return { bank: 'UNKNOWN', confidence: 0 };
  }

  initializeSignatures() {
    // Initialize known document signatures
    // Ar fi populate cu patterns cunoscute
    console.log('📝 Initializing document signatures...');
  }

  initializeFuzzyMatching() {
    // Setup fuzzy matching algorithms
    console.log('🔍 Initializing fuzzy matching...');
  }

  async loadLearnedPatterns() {
    // Load patterns from IndexedDB
    // Implementation ar încărca pattern-urile salvate
    console.log('📥 Loading learned patterns...');
  }
}