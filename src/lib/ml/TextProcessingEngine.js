/**
 * TEXT PROCESSING ENGINE - Advanced NLP pentru banking documents
 * Features: Tokenization, Entity extraction, Sentiment analysis, Text enhancement
 */

export class TextProcessingEngine {
  constructor() {
    console.log('📝 Initializing Text Processing Engine...');
    
    // NLP Configuration
    this.config = {
      maxTokens: 1000,
      minWordLength: 2,
      stopWords: new Set([
        'si', 'sau', 'dar', 'pentru', 'cu', 'la', 'de', 'din', 'pe', 'prin',
        'and', 'or', 'but', 'for', 'with', 'at', 'of', 'from', 'on', 'by'
      ]),
      entityTypes: [
        'MERCHANT', 'AMOUNT', 'DATE', 'REFERENCE', 'LOCATION', 'BANK'
      ]
    };
    
    // Romanian banking vocabulary
    this.bankingVocabulary = new Map([
      // Transaction types
      ['plata', { type: 'TRANSACTION_TYPE', category: 'payment', weight: 0.9 }],
      ['cumparare', { type: 'TRANSACTION_TYPE', category: 'purchase', weight: 0.9 }],
      ['transfer', { type: 'TRANSACTION_TYPE', category: 'transfer', weight: 0.9 }],
      ['retragere', { type: 'TRANSACTION_TYPE', category: 'withdrawal', weight: 0.9 }],
      ['depunere', { type: 'TRANSACTION_TYPE', category: 'deposit', weight: 0.9 }],
      
      // Merchant indicators
      ['srl', { type: 'MERCHANT_TYPE', category: 'company', weight: 0.7 }],
      ['sa', { type: 'MERCHANT_TYPE', category: 'company', weight: 0.7 }],
      ['pfa', { type: 'MERCHANT_TYPE', category: 'freelancer', weight: 0.6 }],
      ['ii', { type: 'MERCHANT_TYPE', category: 'individual', weight: 0.5 }],
      
      // Payment methods
      ['card', { type: 'PAYMENT_METHOD', category: 'card', weight: 0.8 }],
      ['pos', { type: 'PAYMENT_METHOD', category: 'pos', weight: 0.8 }],
      ['atm', { type: 'PAYMENT_METHOD', category: 'atm', weight: 0.8 }],
      ['online', { type: 'PAYMENT_METHOD', category: 'online', weight: 0.7 }],
      
      // Currencies și amounts
      ['ron', { type: 'CURRENCY', category: 'romanian_leu', weight: 1.0 }],
      ['lei', { type: 'CURRENCY', category: 'romanian_leu', weight: 1.0 }],
      ['eur', { type: 'CURRENCY', category: 'euro', weight: 0.9 }],
      ['usd', { type: 'CURRENCY', category: 'dollar', weight: 0.9 }]
    ]);
    
    // Text patterns pentru entity recognition
    this.patterns = {
      amounts: [
        /([+-]?\s*\d{1,3}(?:[,.]?\d{3})*[,.]\d{2})\s*(?:RON|LEI|EUR|USD)?/gi,
        /([+-]?\s*\d+[,.]\d{2})\s*(?:RON|LEI|EUR|USD)?/gi
      ],
      dates: [
        /\b(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})\b/g,
        /\b(\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2})\b/g
      ],
      references: [
        /(?:REF|REFERINTA|RRN|TRN)[\s:]*([A-Z0-9]{6,})/gi,
        /([A-Z0-9]{8,})/g
      ],
      merchants: [
        /(?:PLATA|CUMPARARE|POS)\s+(.{5,30}?)(?:\s+(?:BUCURESTI|CLUJ|TIMISOARA|IASI)|$)/gi,
        /TRANSFER\s+(?:CATRE|TO)\s+(.{5,30})(?:\s+REF|$)/gi
      ],
      locations: [
        /(BUCURESTI|CLUJ|TIMISOARA|IASI|CONSTANTA|BRASOV|CRAIOVA|GALATI|PLOIESTI)/gi
      ]
    };
    
    // Sentiment indicators pentru transaction analysis
    this.sentimentIndicators = {
      positive: ['bonus', 'cashback', 'refund', 'deposit', 'income'],
      negative: ['taxa', 'penalizare', 'comision', 'dobanda', 'fee'],
      neutral: ['transfer', 'plata', 'cumparare', 'retragere']
    };
    
    this.initialized = false;
  }

  /**
   * Initialize Text Processing Engine
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('⚙️ Setting up text processing...');
    
    try {
      // Load extended vocabulary dacă e disponibil
      await this.loadExtendedVocabulary();
      
      // Initialize pattern matchers
      this.initializePatternMatchers();
      
      // Setup tokenization rules
      this.setupTokenization();
      
      this.initialized = true;
      console.log('✅ Text Processing Engine ready!');
      
    } catch (error) {
      console.error('❌ Text Processing initialization failed:', error);
    }
  }

  /**
   * MAIN ANALYSIS FUNCTION
   */
  async analyzeTransaction(description) {
    if (!description || typeof description !== 'string') {
      return this.createEmptyAnalysis();
    }
    
    console.log('🔍 Analyzing transaction text...');
    
    const analysis = {
      originalText: description,
      cleanedText: this.cleanText(description),
      tokens: [],
      entities: [],
      sentiment: null,
      merchantExtracted: null,
      extractionConfidence: 0,
      features: {},
      suggestions: []
    };
    
    try {
      // Step 1: Tokenization
      analysis.tokens = this.tokenize(analysis.cleanedText);
      
      // Step 2: Entity extraction
      analysis.entities = this.extractEntities(analysis.cleanedText);
      
      // Step 3: Merchant extraction
      const merchantInfo = this.extractMerchant(analysis.cleanedText);
      analysis.merchantExtracted = merchantInfo.name;
      analysis.extractionConfidence = merchantInfo.confidence;
      
      // Step 4: Sentiment analysis
      analysis.sentiment = this.analyzeSentiment(analysis.tokens);
      
      // Step 5: Feature extraction
      analysis.features = this.extractFeatures(analysis.cleanedText, analysis.entities);
      
      // Step 6: Generate suggestions
      analysis.suggestions = this.generateSuggestions(analysis);
      
      console.log('✅ Text analysis completed');
      
    } catch (error) {
      console.error('❌ Text analysis failed:', error);
      analysis.extractionConfidence = 0.1;
    }
    
    return analysis;
  }

  /**
   * TEXT CLEANING AND NORMALIZATION
   */
  cleanText(text) {
    let cleaned = text;
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Fix Romanian diacritics
    const diacriticMap = new Map([
      ['ă', 'ă'], ['â', 'â'], ['î', 'î'], ['ș', 'ș'], ['ț', 'ț'],
      ['Ă', 'Ă'], ['Â', 'Â'], ['Î', 'Î'], ['Ș', 'Ș'], ['Ț', 'Ț']
    ]);
    
    for (const [incorrect, correct] of diacriticMap) {
      cleaned = cleaned.replace(new RegExp(incorrect, 'g'), correct);
    }
    
    // Fix common OCR errors în banking context
    const ocrFixes = [
      [/PIJATA/gi, 'PLATA'],
      [/CUIMPARARE/gi, 'CUMPARARE'],
      [/TRANZACTIE/gi, 'TRANZACȚIE'],
      [/SOLIJ/gi, 'SOLD'],
      [/0/g, (match, offset, string) => {
        // Replace O cu 0 dacă e surrounded by digits
        const before = string[offset - 1];
        const after = string[offset + 1];
        return (/\d/.test(before) || /\d/.test(after)) ? '0' : match;
      }]
    ];
    
    for (const [pattern, replacement] of ocrFixes) {
      cleaned = cleaned.replace(pattern, replacement);
    }
    
    return cleaned.trim();
  }

  /**
   * TOKENIZATION
   */
  tokenize(text) {
    if (!text) return [];
    
    // Split by whitespace și punctuation, dar păstrează numerele
    const tokens = text
      .toLowerCase()
      .split(/[\s\(\)\[\],;]+/)
      .filter(token => 
        token.length >= this.config.minWordLength && 
        !this.config.stopWords.has(token)
      )
      .map(token => this.createToken(token))
      .slice(0, this.config.maxTokens);
    
    return tokens;
  }

  createToken(text) {
    const token = {
      text: text,
      type: 'WORD',
      features: {
        isNumber: /^\d+$/.test(text),
        isAmount: /^\d+[,.]?\d*$/.test(text),
        isDate: /^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}$/.test(text),
        isUpperCase: text === text.toUpperCase(),
        length: text.length
      }
    };
    
    // Check pentru banking vocabulary
    const vocabEntry = this.bankingVocabulary.get(text);
    if (vocabEntry) {
      token.type = vocabEntry.type;
      token.category = vocabEntry.category;
      token.weight = vocabEntry.weight;
    }
    
    return token;
  }

  /**
   * ENTITY EXTRACTION
   */
  extractEntities(text) {
    const entities = [];
    
    // Extract amounts
    for (const pattern of this.patterns.amounts) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'AMOUNT',
          value: match[1],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.9
        });
      }
    }
    
    // Extract dates
    for (const pattern of this.patterns.dates) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'DATE',
          value: match[1],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.85
        });
      }
    }
    
    // Extract references
    for (const pattern of this.patterns.references) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'REFERENCE',
          value: match[1],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.7
        });
      }
    }
    
    // Extract merchants
    for (const pattern of this.patterns.merchants) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'MERCHANT',
          value: match[1].trim(),
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.8
        });
      }
    }
    
    // Extract locations
    for (const pattern of this.patterns.locations) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          type: 'LOCATION',
          value: match[1],
          start: match.index,
          end: match.index + match[0].length,
          confidence: 0.75
        });
      }
    }
    
    // Sort by position și remove duplicates
    return entities
      .sort((a, b) => a.start - b.start)
      .filter((entity, index, arr) => 
        index === 0 || 
        entity.value !== arr[index - 1].value ||
        entity.type !== arr[index - 1].type
      );
  }

  /**
   * MERCHANT EXTRACTION
   */
  extractMerchant(text) {
    const merchantEntities = this.extractEntities(text)
      .filter(entity => entity.type === 'MERCHANT');
    
    if (merchantEntities.length > 0) {
      const bestMerchant = merchantEntities
        .sort((a, b) => b.confidence - a.confidence)[0];
      
      return {
        name: this.cleanMerchantName(bestMerchant.value),
        confidence: bestMerchant.confidence,
        method: 'pattern_extraction'
      };
    }
    
    // Fallback la heuristic extraction
    return this.extractMerchantHeuristic(text);
  }

  extractMerchantHeuristic(text) {
    // Look pentru company suffixes
    const companySuffixes = ['SRL', 'SA', 'PFA', 'II', 'LTD', 'INC'];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i].toUpperCase();
      const nextWord = words[i + 1].toUpperCase();
      
      if (companySuffixes.includes(nextWord)) {
        // Found company suffix, take previous 1-3 words
        const start = Math.max(0, i - 2);
        const merchantName = words.slice(start, i + 2).join(' ');
        
        return {
          name: this.cleanMerchantName(merchantName),
          confidence: 0.6,
          method: 'heuristic_company'
        };
      }
    }
    
    // Look pentru capitalized words (probable merchant names)
    const capitalizedWords = words.filter(word => 
      word.length > 3 && 
      word[0] === word[0].toUpperCase() &&
      !this.config.stopWords.has(word.toLowerCase())
    );
    
    if (capitalizedWords.length > 0) {
      return {
        name: this.cleanMerchantName(capitalizedWords[0]),
        confidence: 0.4,
        method: 'heuristic_capitalized'
      };
    }
    
    return {
      name: null,
      confidence: 0,
      method: 'no_extraction'
    };
  }

  cleanMerchantName(name) {
    if (!name) return null;
    
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-&]/g, '')
      .substring(0, 50); // Limit length
  }

  /**
   * SENTIMENT ANALYSIS
   */
  analyzeSentiment(tokens) {
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    
    for (const token of tokens) {
      const text = token.text.toLowerCase();
      
      if (this.sentimentIndicators.positive.includes(text)) {
        positiveScore += token.weight || 1;
      } else if (this.sentimentIndicators.negative.includes(text)) {
        negativeScore += token.weight || 1;
      } else {
        neutralScore += token.weight || 0.5;
      }
    }
    
    const total = positiveScore + negativeScore + neutralScore;
    
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0.5, scores: { positive: 0, negative: 0, neutral: 1 } };
    }
    
    const scores = {
      positive: positiveScore / total,
      negative: negativeScore / total,
      neutral: neutralScore / total
    };
    
    const dominantSentiment = Object.keys(scores)
      .reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return {
      sentiment: dominantSentiment,
      confidence: scores[dominantSentiment],
      scores: scores
    };
  }

  /**
   * FEATURE EXTRACTION
   */
  extractFeatures(text, entities) {
    const features = {
      // Text statistics
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      sentenceCount: text.split(/[.!?]+/).length,
      
      // Entity counts
      entityCounts: {},
      
      // Banking features
      hasAmount: false,
      hasDate: false,
      hasMerchant: false,
      hasReference: false,
      
      // Pattern indicators
      isPayment: /plata|cumparare|achizitie/i.test(text),
      isTransfer: /transfer|virament/i.test(text),
      isWithdrawal: /retragere|atm/i.test(text),
      isDeposit: /depunere|income/i.test(text),
      
      // Quality indicators
      textQuality: this.assessTextQuality(text),
      extractabilityScore: 0
    };
    
    // Count entities by type
    for (const entity of entities) {
      features.entityCounts[entity.type] = (features.entityCounts[entity.type] || 0) + 1;
      
      switch (entity.type) {
        case 'AMOUNT':
          features.hasAmount = true;
          break;
        case 'DATE':
          features.hasDate = true;
          break;
        case 'MERCHANT':
          features.hasMerchant = true;
          break;
        case 'REFERENCE':
          features.hasReference = true;
          break;
      }
    }
    
    // Calculate extractability score
    features.extractabilityScore = this.calculateExtractabilityScore(features);
    
    return features;
  }

  assessTextQuality(text) {
    let score = 0.5; // Base score
    
    // Length indicator
    if (text.length > 20 && text.length < 200) score += 0.2;
    
    // Has numbers și letters
    if (/\d/.test(text) && /[a-zA-Z]/.test(text)) score += 0.2;
    
    // Contains banking keywords
    const bankingKeywords = ['plata', 'card', 'transfer', 'pos', 'atm'];
    const hasBankingKeyword = bankingKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    if (hasBankingKeyword) score += 0.2;
    
    // Proper capitalization
    if (/[A-Z]/.test(text)) score += 0.1;
    
    return Math.min(1.0, score);
  }

  calculateExtractabilityScore(features) {
    let score = 0;
    
    // Bonus pentru key entities
    if (features.hasAmount) score += 0.3;
    if (features.hasDate) score += 0.2;
    if (features.hasMerchant) score += 0.3;
    if (features.hasReference) score += 0.1;
    
    // Bonus pentru transaction type clarity
    const transactionTypes = [
      features.isPayment, features.isTransfer, 
      features.isWithdrawal, features.isDeposit
    ];
    if (transactionTypes.some(Boolean)) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * SUGGESTIONS GENERATION
   */
  generateSuggestions(analysis) {
    const suggestions = [];
    
    // Suggest better merchant extraction
    if (!analysis.merchantExtracted && analysis.features.hasMerchant) {
      suggestions.push({
        type: 'merchant_extraction',
        message: 'Comerciant detectat dar nu extras corect',
        priority: 'medium'
      });
    }
    
    // Suggest amount validation
    if (!analysis.features.hasAmount) {
      suggestions.push({
        type: 'amount_missing',
        message: 'Nu s-a detectat suma tranzacției',
        priority: 'high'
      });
    }
    
    // Suggest date validation
    if (!analysis.features.hasDate) {
      suggestions.push({
        type: 'date_missing',
        message: 'Nu s-a detectat data tranzacției',
        priority: 'high'
      });
    }
    
    // Suggest text quality improvement
    if (analysis.features.textQuality < 0.6) {
      suggestions.push({
        type: 'text_quality',
        message: 'Calitatea textului pare scăzută, verificați OCR',
        priority: 'low'
      });
    }
    
    return suggestions;
  }

  /**
   * UTILITY FUNCTIONS
   */
  createEmptyAnalysis() {
    return {
      originalText: '',
      cleanedText: '',
      tokens: [],
      entities: [],
      sentiment: { sentiment: 'neutral', confidence: 0.5 },
      merchantExtracted: null,
      extractionConfidence: 0,
      features: {},
      suggestions: []
    };
  }

  setupTokenization() {
    // Setup advanced tokenization rules
    console.log('📝 Setting up tokenization rules...');
  }

  initializePatternMatchers() {
    // Initialize pattern matching algorithms
    console.log('🔍 Initializing pattern matchers...');
  }

  async loadExtendedVocabulary() {
    // Load extended vocabulary from external sources
    console.log('📚 Loading extended vocabulary...');
  }

  /**
   * PUBLIC API METHODS
   */
  async extractKeyInfo(text) {
    // Quick extraction pentru key information
    const analysis = await this.analyzeTransaction(text);
    
    return {
      merchant: analysis.merchantExtracted,
      amount: analysis.entities.find(e => e.type === 'AMOUNT')?.value,
      date: analysis.entities.find(e => e.type === 'DATE')?.value,
      reference: analysis.entities.find(e => e.type === 'REFERENCE')?.value,
      confidence: analysis.extractionConfidence
    };
  }

  async enhanceText(text) {
    // Enhance și clean text pentru better processing
    return this.cleanText(text);
  }

  async validateTransaction(text) {
    // Validate dacă text-ul pare o tranzacție validă
    const features = this.extractFeatures(text, this.extractEntities(text));
    
    return {
      isValid: features.extractabilityScore > 0.4,
      confidence: features.extractabilityScore,
      missingElements: this.identifyMissingElements(features),
      quality: features.textQuality
    };
  }

  identifyMissingElements(features) {
    const missing = [];
    
    if (!features.hasAmount) missing.push('amount');
    if (!features.hasDate) missing.push('date');
    if (!features.hasMerchant) missing.push('merchant');
    
    return missing;
  }
}