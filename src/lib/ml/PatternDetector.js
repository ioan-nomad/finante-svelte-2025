// PatternDetector.js - Avansate pattern recognition pentru detectarea băncilor și formatelor
import { learningDatabase } from './LearningDatabase.js';

export class PatternDetector {
  constructor() {
    this.bankSignatures = new Map();
    this.documentPatterns = new Map();
    this.transactionPatterns = new Map();
    
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadBankPatterns();
      await this.initializeDefaultPatterns();
      this.isInitialized = true;
      console.log('🔍 PatternDetector initialized with', this.bankSignatures.size, 'bank signatures');
    } catch (error) {
      console.error('❌ PatternDetector initialization failed:', error);
    }
  }

  async loadBankPatterns() {
    const patterns = await learningDatabase.getBankPatterns();
    
    patterns.forEach(pattern => {
      if (!this.bankSignatures.has(pattern.bank)) {
        this.bankSignatures.set(pattern.bank, {
          signatures: [],
          documentPatterns: [],
          fieldPatterns: {},
          confidence: 0
        });
      }
      
      const bankData = this.bankSignatures.get(pattern.bank);
      
      switch (pattern.patternType) {
        case 'signature':
          bankData.signatures.push(pattern.pattern);
          break;
        case 'document':
          bankData.documentPatterns.push(new RegExp(pattern.pattern, 'i'));
          break;
        case 'field':
          if (!bankData.fieldPatterns[pattern.bank]) {
            bankData.fieldPatterns[pattern.bank] = {};
          }
          bankData.fieldPatterns[pattern.bank] = new RegExp(pattern.pattern, 'g');
          break;
      }
      
      bankData.confidence = Math.max(bankData.confidence, pattern.accuracy);
    });
  }

  async initializeDefaultPatterns() {
    const defaultPatterns = [
      // BCR Patterns
      {
        bank: 'BCR',
        signatures: [
          'BANCA COMERCIALA ROMANA',
          'BCR',
          'GEORGE',
          'BCR24',
          'EXTRAS DE CONT BCR'
        ],
        documentPatterns: [
          /EXTRAS\s+DE\s+CONT/i,
          /SITUAȚIA\s+CONTULUI/i,
          /BCR\s+BANK/i,
          /GEORGE\s+BCR/i,
          /BANCA\s+COMERCIALĂ\s+ROMÂNĂ/i
        ],
        fieldPatterns: {
          date: /\b\d{2}[\.\/-]\d{2}[\.\/-]\d{4}\b/g,
          amount: /[+-]?\d{1,3}(?:[\.‚]\d{3})*[\.‚]\d{2}(?=\s|$|RON|LEI)/g,
          description: /(?:PLATA|CUMPARARE|TRANSFER|RETRAGERE)\s+.{10,}/gi,
          balance: /SOLD\s*:?\s*([+-]?\d+[\.‚]\d{2})/i,
          reference: /REF\s*:?\s*(\w+)/i
        },
        confidence: 0.9
      },

      // Banca Transilvania Patterns
      {
        bank: 'BT',
        signatures: [
          'BANCA TRANSILVANIA',
          'BT',
          'NEO BT',
          'BT24',
          'BT PAY'
        ],
        documentPatterns: [
          /BANCA\s+TRANSILVANIA/i,
          /EXTRAS\s+CONT/i,
          /BT24/i,
          /NEO\s+BT/i
        ],
        fieldPatterns: {
          date: /\b\d{2}-\d{2}-\d{4}\b/g,
          amount: /\d+[\.,]\d{2}\s*(?:RON|LEI)/g,
          description: /POS\s+.{5,}|CARD\s+.{5,}|TRANSFER\s+.{5,}/gi,
          balance: /SOLD\s+DISPONIBIL\s*:?\s*([+-]?\d+[,\.]\d{2})/i
        },
        confidence: 0.85
      },

      // ING Bank Patterns
      {
        bank: 'ING',
        signatures: [
          'ING BANK',
          'ING',
          'ING PERSONAL',
          'ING HOME BANK',
          'HOME BANK'
        ],
        documentPatterns: [
          /ING\s+BANK/i,
          /EXTRAS\s+BANCAR/i,
          /HOME\s+BANK/i,
          /ING\s+PERSONAL/i
        ],
        fieldPatterns: {
          date: /\d{2}\.\d{2}\.\d{4}/g,
          amount: /-?\d+,\d{2}/g,
          description: /Tranzacție\s+.{10,}|Plată\s+.{10,}/gi,
          balance: /SOLD\s*:?\s*([+-]?\d+,\d{2})/i
        },
        confidence: 0.8
      },

      // Raiffeisen Bank Patterns
      {
        bank: 'RAIFFEISEN',
        signatures: [
          'RAIFFEISEN BANK',
          'RAIFFEISEN',
          'SMART MOBILE',
          'RAIFFEISEN DIRECT'
        ],
        documentPatterns: [
          /RAIFFEISEN\s+BANK/i,
          /SMART\s+MOBILE/i,
          /RAIFFEISEN\s+DIRECT/i
        ],
        fieldPatterns: {
          date: /\d{2}\/\d{2}\/\d{4}/g,
          amount: /[+-]\s*\d+\.\d{2}/g,
          description: /CUMPARARE\s+.{5,}|RETRAGERE\s+.{5,}/gi
        },
        confidence: 0.75
      },

      // UniCredit Bank Patterns
      {
        bank: 'UNICREDIT',
        signatures: [
          'UNICREDIT BANK',
          'UNICREDIT',
          'HVB BANK',
          'UNICREDIT TIRIAC'
        ],
        documentPatterns: [
          /UNICREDIT\s+BANK/i,
          /HVB/i,
          /UNICREDIT\s+ȚIRIAC/i
        ],
        fieldPatterns: {
          date: /\d{2}\.\d{2}\.\d{4}/g,
          amount: /[+-]?\d+,\d{2}\s*RON/g,
          description: /.{20,}/g
        },
        confidence: 0.7
      }
    ];

    // Save default patterns to database
    for (const bankPattern of defaultPatterns) {
      // Save signatures
      for (const signature of bankPattern.signatures) {
        await learningDatabase.saveBankPattern(
          bankPattern.bank, 
          signature, 
          'signature', 
          bankPattern.confidence
        );
      }

      // Save document patterns
      for (const docPattern of bankPattern.documentPatterns) {
        await learningDatabase.saveBankPattern(
          bankPattern.bank, 
          docPattern.source, 
          'document', 
          bankPattern.confidence
        );
      }

      // Save field patterns
      for (const [fieldType, pattern] of Object.entries(bankPattern.fieldPatterns)) {
        await learningDatabase.saveBankPattern(
          bankPattern.bank, 
          pattern.source, 
          `field_${fieldType}`, 
          bankPattern.confidence
        );
      }

      // Store in memory
      this.bankSignatures.set(bankPattern.bank, {
        signatures: bankPattern.signatures,
        documentPatterns: bankPattern.documentPatterns,
        fieldPatterns: bankPattern.fieldPatterns,
        confidence: bankPattern.confidence
      });
    }
  }

  // === MAIN DETECTION METHODS ===

  async detectBank(text) {
    const startTime = Date.now();
    
    try {
      // Method 1: Signature matching (fastest)
      const signatureResult = this.detectBankBySignature(text);
      if (signatureResult.confidence > 0.8) {
        await this.logDetectionResult('signature', signatureResult, Date.now() - startTime);
        return signatureResult;
      }

      // Method 2: Document pattern matching
      const patternResult = await this.detectBankByPatterns(text);
      if (patternResult.confidence > 0.6) {
        await this.logDetectionResult('patterns', patternResult, Date.now() - startTime);
        return patternResult;
      }

      // Method 3: Advanced heuristics
      const heuristicResult = await this.detectBankByHeuristics(text);
      if (heuristicResult.confidence > 0.5) {
        await this.logDetectionResult('heuristics', heuristicResult, Date.now() - startTime);
        return heuristicResult;
      }

      // Method 4: ML-based fuzzy matching
      const fuzzyResult = await this.detectBankByFuzzyMatching(text);
      await this.logDetectionResult('fuzzy', fuzzyResult, Date.now() - startTime);
      
      return fuzzyResult;

    } catch (error) {
      console.error('Error in bank detection:', error);
      return {
        bank: 'UNKNOWN',
        confidence: 0,
        method: 'error',
        error: error.message
      };
    }
  }

  detectBankBySignature(text) {
    const upperText = text.toUpperCase();
    let bestMatch = { bank: 'UNKNOWN', confidence: 0, method: 'signature' };

    for (const [bank, data] of this.bankSignatures) {
      for (const signature of data.signatures) {
        if (upperText.includes(signature.toUpperCase())) {
          const confidence = data.confidence * this.calculateSignatureRelevance(signature, text);
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              bank: bank,
              confidence: confidence,
              method: 'signature',
              matchedSignature: signature
            };
          }
        }
      }
    }

    return bestMatch;
  }

  async detectBankByPatterns(text) {
    let bestMatch = { bank: 'UNKNOWN', confidence: 0, method: 'patterns' };

    for (const [bank, data] of this.bankSignatures) {
      let matchCount = 0;
      const matchedPatterns = [];

      for (const pattern of data.documentPatterns) {
        if (pattern.test(text)) {
          matchCount++;
          matchedPatterns.push(pattern.source);
        }
      }

      if (matchCount > 0) {
        const confidence = (matchCount / data.documentPatterns.length) * data.confidence;
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            bank: bank,
            confidence: confidence,
            method: 'patterns',
            matchedPatterns: matchedPatterns
          };
        }
      }
    }

    return bestMatch;
  }

  async detectBankByHeuristics(text) {
    // Advanced heuristics based on document structure
    const features = this.extractDocumentFeatures(text);
    
    const heuristicRules = {
      'BCR': [
        { feature: 'hasGeorgeReference', weight: 0.9 },
        { feature: 'hasBCRFormat', weight: 0.8 },
        { feature: 'hasRomanianDateFormat', weight: 0.6 }
      ],
      'BT': [
        { feature: 'hasBTFormat', weight: 0.8 },
        { feature: 'hasNeoReference', weight: 0.9 },
        { feature: 'hasDashDateFormat', weight: 0.7 }
      ],
      'ING': [
        { feature: 'hasDotDateFormat', weight: 0.8 },
        { feature: 'hasINGStructure', weight: 0.9 },
        { feature: 'hasPersonalReference', weight: 0.6 }
      ]
    };

    let bestMatch = { bank: 'UNKNOWN', confidence: 0, method: 'heuristics' };

    for (const [bank, rules] of Object.entries(heuristicRules)) {
      let score = 0;
      let totalWeight = 0;
      const appliedRules = [];

      for (const rule of rules) {
        if (features[rule.feature]) {
          score += rule.weight;
          appliedRules.push(rule.feature);
        }
        totalWeight += rule.weight;
      }

      const confidence = totalWeight > 0 ? (score / totalWeight) * 0.8 : 0;
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          bank: bank,
          confidence: confidence,
          method: 'heuristics',
          appliedRules: appliedRules
        };
      }
    }

    return bestMatch;
  }

  async detectBankByFuzzyMatching(text) {
    // Implement fuzzy string matching for unknown bank formats
    const words = text.toLowerCase().split(/\s+/);
    const bankKeywords = {
      'BCR': ['banca', 'comerciala', 'romana', 'bcr', 'george'],
      'BT': ['banca', 'transilvania', 'bt', 'neo'],
      'ING': ['ing', 'bank', 'personal', 'home'],
      'RAIFFEISEN': ['raiffeisen', 'smart', 'mobile'],
      'UNICREDIT': ['unicredit', 'hvb', 'tiriac']
    };

    let bestMatch = { bank: 'UNKNOWN', confidence: 0, method: 'fuzzy' };

    for (const [bank, keywords] of Object.entries(bankKeywords)) {
      let matches = 0;
      const matchedKeywords = [];

      for (const keyword of keywords) {
        for (const word of words) {
          if (this.fuzzyMatch(word, keyword) > 0.7) {
            matches++;
            matchedKeywords.push({ word, keyword });
            break;
          }
        }
      }

      const confidence = Math.min((matches / keywords.length) * 0.6, 0.6);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          bank: bank,
          confidence: confidence,
          method: 'fuzzy',
          matchedKeywords: matchedKeywords
        };
      }
    }

    return bestMatch;
  }

  // === TRANSACTION PATTERN DETECTION ===

  detectTransactionPatterns(text, detectedBank) {
    const bankData = this.bankSignatures.get(detectedBank);
    if (!bankData) return null;

    const patterns = bankData.fieldPatterns;
    const results = {
      datePattern: null,
      amountPattern: null,
      descriptionPattern: null,
      confidence: 0
    };

    // Detect date patterns
    if (patterns.date) {
      const dateMatches = text.match(patterns.date);
      if (dateMatches && dateMatches.length > 0) {
        results.datePattern = patterns.date;
        results.confidence += 0.3;
      }
    }

    // Detect amount patterns
    if (patterns.amount) {
      const amountMatches = text.match(patterns.amount);
      if (amountMatches && amountMatches.length > 0) {
        results.amountPattern = patterns.amount;
        results.confidence += 0.4;
      }
    }

    // Detect description patterns
    if (patterns.description) {
      const descMatches = text.match(patterns.description);
      if (descMatches && descMatches.length > 0) {
        results.descriptionPattern = patterns.description;
        results.confidence += 0.3;
      }
    }

    return results;
  }

  // === UTILITY METHODS ===

  calculateSignatureRelevance(signature, text) {
    const textLength = text.length;
    const signatureLength = signature.length;
    
    // Longer signatures in shorter texts are more relevant
    const lengthFactor = Math.min(signatureLength / textLength * 10, 1);
    
    // Position matters - signatures at the beginning are more relevant
    const position = text.toUpperCase().indexOf(signature.toUpperCase());
    const positionFactor = position < textLength * 0.1 ? 1.2 : 1.0;
    
    return Math.min(lengthFactor * positionFactor, 1.0);
  }

  extractDocumentFeatures(text) {
    return {
      hasGeorgeReference: /george/i.test(text),
      hasBCRFormat: /extras\s+de\s+cont/i.test(text),
      hasRomanianDateFormat: /\d{2}\.\d{2}\.\d{4}/.test(text),
      hasBTFormat: /banca\s+transilvania/i.test(text),
      hasNeoReference: /neo\s+bt/i.test(text),
      hasDashDateFormat: /\d{2}-\d{2}-\d{4}/.test(text),
      hasDotDateFormat: /\d{2}\.\d{2}\.\d{4}/.test(text),
      hasINGStructure: /ing\s+(bank|personal)/i.test(text),
      hasPersonalReference: /personal/i.test(text),
      hasAmountInRON: /\d+[,\.]\d{2}\s*ron/i.test(text),
      hasIBAN: /RO\d{2}\s?[A-Z]{4}\s?\d{16}/.test(text)
    };
  }

  fuzzyMatch(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // === LEARNING AND IMPROVEMENT ===

  async learnFromFeedback(originalText, detectedBank, correctBank, confidence) {
    if (detectedBank !== correctBank) {
      // Save corrected pattern
      await learningDatabase.saveBankPattern(
        correctBank,
        originalText.substring(0, 100), // First 100 chars as signature
        'learned_signature',
        Math.max(confidence, 0.8)
      );

      console.log(`🎓 Learned new pattern for ${correctBank} from user feedback`);
    }

    // Update pattern accuracy based on feedback
    const patterns = await learningDatabase.getBankPatterns(detectedBank);
    for (const pattern of patterns) {
      // Adjust accuracy based on feedback success
      const newAccuracy = detectedBank === correctBank 
        ? Math.min(pattern.accuracy * 1.1, 1.0)
        : Math.max(pattern.accuracy * 0.9, 0.1);
      
      await learningDatabase.saveBankPattern(
        pattern.bank,
        pattern.pattern,
        pattern.patternType,
        newAccuracy
      );
    }
  }

  async logDetectionResult(method, result, duration) {
    await learningDatabase.logPerformance(
      `bank_detection_${method}`,
      duration,
      null,
      result.confidence,
      {
        bank: result.bank,
        method: result.method
      }
    );
  }

  // === PUBLIC API ===

  getBankPatterns(bank) {
    return this.bankSignatures.get(bank) || null;
  }

  getSupportedBanks() {
    return Array.from(this.bankSignatures.keys());
  }

  async addCustomPattern(bank, pattern, patternType, confidence = 0.7) {
    await learningDatabase.saveBankPattern(bank, pattern, patternType, confidence);
    
    // Update in-memory patterns
    if (!this.bankSignatures.has(bank)) {
      this.bankSignatures.set(bank, {
        signatures: [],
        documentPatterns: [],
        fieldPatterns: {},
        confidence: confidence
      });
    }

    const bankData = this.bankSignatures.get(bank);
    
    switch (patternType) {
      case 'signature':
        bankData.signatures.push(pattern);
        break;
      case 'document':
        bankData.documentPatterns.push(new RegExp(pattern, 'i'));
        break;
      default:
        // Field pattern
        bankData.fieldPatterns[patternType] = new RegExp(pattern, 'g');
    }
    
    console.log(`✅ Added custom pattern for ${bank}: ${pattern}`);
  }

  async getDetectionStats() {
    return await learningDatabase.getPerformanceMetrics('bank_detection');
  }
}

// Export singleton instance
export const patternDetector = new PatternDetector();