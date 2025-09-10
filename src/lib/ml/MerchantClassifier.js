// MerchantClassifier.js - Advanced merchant classification și categorization
import { learningDatabase } from './LearningDatabase.js';

export class MerchantClassifier {
  constructor() {
    this.merchantDatabase = new Map();
    this.categoryPatterns = new Map();
    this.aliasNetwork = new Map();
    this.categoryHierarchy = new Map();
    
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.loadMerchants();
      await this.initializeCategorySystem();
      await this.buildAliasNetwork();
      this.isInitialized = true;
      console.log('🏪 MerchantClassifier initialized with', this.merchantDatabase.size, 'merchants');
    } catch (error) {
      console.error('❌ MerchantClassifier initialization failed:', error);
    }
  }

  async loadMerchants() {
    const merchants = await learningDatabase.merchants.toArray();
    
    merchants.forEach(merchant => {
      this.merchantDatabase.set(merchant.normalizedName, {
        id: merchant.id,
        name: merchant.name,
        normalizedName: merchant.normalizedName,
        aliases: merchant.aliases || [],
        category: merchant.category,
        subcategory: merchant.subcategory,
        confidence: merchant.confidence,
        occurrences: merchant.occurrences,
        lastSeen: merchant.lastSeen,
        metadata: merchant.metadata || {}
      });
    });
  }

  async initializeCategorySystem() {
    // Comprehensive category system
    const categories = {
      'Alimente': {
        patterns: [
          /lidl|kaufland|carrefour|auchan|mega|profi|penny|cora|selgros/i,
          /magazin|supermarket|alimentar|grocery/i,
          /fresh|market|food/i
        ],
        subcategories: {
          'Supermarket': /lidl|kaufland|carrefour|auchan|mega|profi|penny|cora/i,
          'Cash & Carry': /selgros|metro/i,
          'Magazin Local': /alimentara|magazin.*alimentar/i,
          'Online Food': /tazz|glovo|foodpanda|uber.*eats/i
        },
        confidence: 0.9
      },

      'Combustibil': {
        patterns: [
          /omv|petrom|rompetrol|mol|lukoil|shell|benzinarie/i,
          /carburant|combustibil|benzina|motorina/i,
          /gas.*station|fuel/i
        ],
        subcategories: {
          'Benzinărie Lanț': /omv|petrom|rompetrol|mol|lukoil|shell/i,
          'Benzinărie Locală': /benzinarie|statia.*carburant/i
        },
        confidence: 0.95
      },

      'Transport': {
        patterns: [
          /ratb|metrorex|stb|uber|bolt|taxi|clever/i,
          /transport|autobuz|metro|tramvai/i,
          /parcare|parking/i,
          /bilet|abonament.*transport/i
        ],
        subcategories: {
          'Transport Public': /ratb|metrorex|stb/i,
          'Ride Sharing': /uber|bolt|clever|star.*taxi/i,
          'Taxi': /taxi/i,
          'Parcare': /parcare|parking/i
        },
        confidence: 0.85
      },

      'Utilități': {
        patterns: [
          /enel|eon|electrica|engie|digi|rds|rcs|telekom|orange|vodafone/i,
          /curent|gaz|apa|canal|gunoi|salubrizare/i,
          /internet|telefon|tv|cablu/i
        ],
        subcategories: {
          'Electricitate': /enel|eon|electrica|curent/i,
          'Gaz': /engie|gaz.*metan|distrigaz/i,
          'Apă': /apa.*canal|aquabis|compania.*apa/i,
          'Telecom': /digi|rds|rcs|telekom|orange|vodafone/i,
          'Salubritate': /gunoi|salubrizare|deseuri/i
        },
        confidence: 0.9
      },

      'Farmacie': {
        patterns: [
          /farmaci|catena|sensiblu|help|dona|pharmacia|dr\.max/i,
          /medicamente|farmacie|medicina/i
        ],
        subcategories: {
          'Farmacie Lanț': /catena|sensiblu|help|dona|dr\.max/i,
          'Farmacie Locală': /farmacia/i
        },
        confidence: 0.95
      },

      'Sănătate': {
        patterns: [
          /spital|clinica|medical|doctor|dentist|laborator/i,
          /analize|consulta|medic|chirurg/i,
          /radiologie|ecografie|rmn/i
        ],
        subcategories: {
          'Clinică': /clinica.*medical|clinica.*dentara/i,
          'Spital': /spital/i,
          'Laborator': /laborator.*analize|synevo|bioclinica/i,
          'Cabinet Medical': /cabinet.*medical|doctor|dentist/i
        },
        confidence: 0.85
      },

      'Restaurante': {
        patterns: [
          /mcdonald|kfc|pizza|burger|restaurant|bistro|cafenea/i,
          /food|eat|dining|terasa/i,
          /mancare|delivery/i
        ],
        subcategories: {
          'Fast Food': /mcdonald|kfc|burger.*king|subway/i,
          'Pizza': /pizza.*hut|domino|pizza.*express/i,
          'Restaurant': /restaurant|bistro|terasa/i,
          'Cafenea': /starbucks|coffee|cafenea/i,
          'Delivery': /tazz|glovo|foodpanda|uber.*eats/i
        },
        confidence: 0.85
      },

      'Îmbrăcăminte': {
        patterns: [
          /h&m|zara|c&a|deichmann|nike|adidas|bershka/i,
          /haine|incaltaminte|fashion|clothing/i,
          /magazin.*haine|boutique/i
        ],
        subcategories: {
          'Fashion Retail': /h&m|zara|bershka|pull.*bear/i,
          'Încălțăminte': /deichmann|nike|adidas|office.*shoes/i,
          'Department Store': /c&a|marks.*spencer/i
        },
        confidence: 0.9
      },

      'Electronice': {
        patterns: [
          /emag|altex|flanco|media.*galaxy|cel\.ro/i,
          /electronic|computer|telefon|laptop/i,
          /tech|digital|gadget/i
        ],
        subcategories: {
          'Retail Electronics': /emag|altex|flanco|media.*galaxy/i,
          'Mobile': /orange|vodafone|telekom.*shop/i,
          'IT Services': /service.*pc|reparatii/i
        },
        confidence: 0.9
      },

      'ATM': {
        patterns: [
          /atm|bancomat|retragere|cash/i,
          /numerar|withdraw/i
        ],
        subcategories: {
          'ATM': /atm|bancomat/i,
          'Cash Advance': /avans.*numerar/i
        },
        confidence: 0.95
      },

      'Divertisment': {
        patterns: [
          /cinema|teatru|concert|bilet|netflix|spotify|steam|hbo/i,
          /entertainment|fun|hobby/i,
          /sala.*sport|fitness|gym/i
        ],
        subcategories: {
          'Cinema': /cinema|movie|film/i,
          'Streaming': /netflix|hbo|disney|amazon.*prime/i,
          'Gaming': /steam|epic.*games|playstation/i,
          'Sport': /fitness|gym|sala.*sport/i
        },
        confidence: 0.8
      },

      'Servicii Financiare': {
        patterns: [
          /banca|credit|imprumut|asigurare|insurance/i,
          /financiar|banking|loan/i
        ],
        subcategories: {
          'Banking': /bcr|bt|ing|raiffeisen|unicredit/i,
          'Asigurări': /allianz|generali|omniasig|city.*insurance/i,
          'Credite': /credit|imprumut|loan/i
        },
        confidence: 0.9
      },

      'Educație': {
        patterns: [
          /scoala|universitate|curs|training|education/i,
          /invatare|studiu|certificat/i
        ],
        subcategories: {
          'Școală': /scoala|liceu|gimnaziu/i,
          'Universitate': /universitate|facultate|ase/i,
          'Cursuri Online': /udemy|coursera|skillshare/i
        },
        confidence: 0.8
      }
    };

    // Store categories
    for (const [category, data] of Object.entries(categories)) {
      this.categoryPatterns.set(category, {
        patterns: data.patterns,
        subcategories: data.subcategories,
        confidence: data.confidence
      });
      
      this.categoryHierarchy.set(category, Object.keys(data.subcategories));
    }
  }

  async buildAliasNetwork() {
    // Build a network of merchant aliases for better matching
    this.merchantDatabase.forEach((merchant, key) => {
      // Add all aliases to the network
      merchant.aliases.forEach(alias => {
        if (!this.aliasNetwork.has(alias)) {
          this.aliasNetwork.set(alias, []);
        }
        this.aliasNetwork.get(alias).push(merchant);
      });
      
      // Add merchant name variations
      const variations = this.generateNameVariations(merchant.name);
      variations.forEach(variation => {
        if (!this.aliasNetwork.has(variation)) {
          this.aliasNetwork.set(variation, []);
        }
        this.aliasNetwork.get(variation).push(merchant);
      });
    });
  }

  // === MAIN CLASSIFICATION METHODS ===

  async classifyMerchant(description, amount = null, context = {}) {
    const startTime = Date.now();
    
    try {
      const cleanDescription = this.cleanDescription(description);
      
      // Method 1: Exact merchant match
      const exactMatch = await this.findExactMatch(cleanDescription);
      if (exactMatch && exactMatch.confidence > 0.8) {
        await this.logClassificationResult('exact', exactMatch, Date.now() - startTime);
        return exactMatch;
      }

      // Method 2: Fuzzy merchant matching
      const fuzzyMatch = await this.findFuzzyMatch(cleanDescription);
      if (fuzzyMatch && fuzzyMatch.confidence > 0.7) {
        await this.logClassificationResult('fuzzy', fuzzyMatch, Date.now() - startTime);
        return await this.updateMerchantOccurrence(fuzzyMatch);
      }

      // Method 3: Category-based classification
      const categoryMatch = await this.classifyByCategory(cleanDescription, amount, context);
      if (categoryMatch && categoryMatch.confidence > 0.6) {
        await this.logClassificationResult('category', categoryMatch, Date.now() - startTime);
        
        // Create new merchant entry
        const newMerchant = await this.createNewMerchant(
          cleanDescription, 
          categoryMatch.category, 
          categoryMatch.subcategory,
          categoryMatch.confidence
        );
        
        return newMerchant;
      }

      // Method 4: ML-based classification
      const mlMatch = await this.classifyWithML(cleanDescription, amount, context);
      await this.logClassificationResult('ml', mlMatch, Date.now() - startTime);
      
      return mlMatch;

    } catch (error) {
      console.error('Error in merchant classification:', error);
      return this.createUnknownMerchant(description);
    }
  }

  async findExactMatch(cleanDescription) {
    const normalized = this.normalizeText(cleanDescription);
    
    // Check direct merchant database
    if (this.merchantDatabase.has(normalized)) {
      const merchant = this.merchantDatabase.get(normalized);
      return {
        name: merchant.name,
        normalizedName: merchant.normalizedName,
        category: merchant.category,
        subcategory: merchant.subcategory,
        confidence: 0.95,
        occurrences: merchant.occurrences,
        method: 'exact_match',
        merchantId: merchant.id
      };
    }

    // Check aliases network
    if (this.aliasNetwork.has(normalized)) {
      const merchants = this.aliasNetwork.get(normalized);
      const bestMerchant = merchants.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      return {
        name: bestMerchant.name,
        normalizedName: bestMerchant.normalizedName,
        category: bestMerchant.category,
        subcategory: bestMerchant.subcategory,
        confidence: 0.9,
        occurrences: bestMerchant.occurrences,
        method: 'alias_match',
        merchantId: bestMerchant.id
      };
    }

    return null;
  }

  async findFuzzyMatch(cleanDescription) {
    const normalized = this.normalizeText(cleanDescription);
    let bestMatch = null;
    let highestScore = 0;

    // Check against all merchants
    for (const [key, merchant] of this.merchantDatabase) {
      const score = this.calculateSimilarity(normalized, key);
      
      if (score > highestScore && score > 0.7) {
        highestScore = score;
        bestMatch = {
          name: merchant.name,
          normalizedName: merchant.normalizedName,
          category: merchant.category,
          subcategory: merchant.subcategory,
          confidence: score * 0.9, // Reduce confidence for fuzzy matches
          occurrences: merchant.occurrences,
          method: 'fuzzy_match',
          merchantId: merchant.id,
          similarity: score
        };
      }
    }

    // Also check aliases
    for (const [alias, merchants] of this.aliasNetwork) {
      const score = this.calculateSimilarity(normalized, alias);
      
      if (score > highestScore && score > 0.7) {
        const bestMerchant = merchants[0]; // Take the first (most relevant)
        highestScore = score;
        bestMatch = {
          name: bestMerchant.name,
          normalizedName: bestMerchant.normalizedName,
          category: bestMerchant.category,
          subcategory: bestMerchant.subcategory,
          confidence: score * 0.85,
          occurrences: bestMerchant.occurrences,
          method: 'fuzzy_alias_match',
          merchantId: bestMerchant.id,
          matchedAlias: alias,
          similarity: score
        };
      }
    }

    return bestMatch;
  }

  async classifyByCategory(description, amount, context) {
    let bestMatch = null;
    let highestScore = 0;

    for (const [category, data] of this.categoryPatterns) {
      let categoryScore = 0;
      let matchedPatterns = [];

      // Test main patterns
      for (const pattern of data.patterns) {
        if (pattern.test(description)) {
          categoryScore += 0.3;
          matchedPatterns.push(pattern.source);
        }
      }

      // Test subcategory patterns
      let bestSubcategory = null;
      let subcategoryScore = 0;
      
      for (const [subcategory, pattern] of Object.entries(data.subcategories)) {
        if (pattern.test(description)) {
          if (subcategoryScore < 0.4) {
            subcategoryScore = 0.4;
            bestSubcategory = subcategory;
          }
        }
      }

      const totalScore = (categoryScore + subcategoryScore) * data.confidence;

      // Apply context bonuses
      if (context.previousCategory === category) {
        totalScore *= 1.1; // Bonus for consistency
      }

      if (amount && this.isAmountTypicalForCategory(amount, category)) {
        totalScore *= 1.05; // Small bonus for typical amounts
      }

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = {
          category: category,
          subcategory: bestSubcategory,
          confidence: Math.min(totalScore, 0.9),
          method: 'category_patterns',
          matchedPatterns: matchedPatterns
        };
      }
    }

    return bestMatch;
  }

  async classifyWithML(description, amount, context) {
    // Simple ML-like classification using weighted features
    const features = this.extractMerchantFeatures(description, amount, context);
    
    // Simple decision tree logic
    let category = 'Altele';
    let confidence = 0.3;

    if (features.hasPaymentTerms) {
      if (features.wordCount < 3) {
        category = 'ATM';
        confidence = 0.7;
      } else if (features.hasTransportKeywords) {
        category = 'Transport';
        confidence = 0.6;
      }
    }

    if (features.hasCommonMerchantPattern) {
      if (features.hasNumbers && features.wordCount > 3) {
        category = 'Altele';
        confidence = 0.5;
      }
    }

    // Amount-based heuristics
    if (amount) {
      if (amount < 10 && features.hasTransportKeywords) {
        category = 'Transport';
        confidence = Math.max(confidence, 0.6);
      } else if (amount > 500 && features.hasElectronicsKeywords) {
        category = 'Electronice';
        confidence = Math.max(confidence, 0.5);
      }
    }

    return {
      name: this.extractMerchantName(description),
      category: category,
      subcategory: null,
      confidence: confidence,
      method: 'ml_classification',
      features: features
    };
  }

  // === MERCHANT MANAGEMENT ===

  async createNewMerchant(description, category, subcategory, confidence) {
    const name = this.extractMerchantName(description);
    const normalized = this.normalizeText(name);
    
    const merchantData = {
      name: name,
      aliases: [normalized, this.normalizeText(description)],
      category: category,
      subcategory: subcategory,
      confidence: confidence,
      metadata: {
        originalDescription: description,
        createdAt: Date.now(),
        source: 'auto_classification'
      }
    };

    const merchantId = await learningDatabase.saveMerchant(merchantData);
    
    // Update in-memory database
    this.merchantDatabase.set(normalized, {
      ...merchantData,
      id: merchantId,
      normalizedName: normalized,
      occurrences: 1,
      lastSeen: Date.now()
    });

    // Update alias network
    merchantData.aliases.forEach(alias => {
      if (!this.aliasNetwork.has(alias)) {
        this.aliasNetwork.set(alias, []);
      }
      this.aliasNetwork.get(alias).push(this.merchantDatabase.get(normalized));
    });

    console.log(`🆕 Created new merchant: ${name} → ${category}${subcategory ? ` / ${subcategory}` : ''}`);

    return {
      name: name,
      normalizedName: normalized,
      category: category,
      subcategory: subcategory,
      confidence: confidence,
      occurrences: 1,
      method: 'new_merchant',
      merchantId: merchantId
    };
  }

  async updateMerchantOccurrence(merchantResult) {
    if (merchantResult.merchantId) {
      const merchant = this.merchantDatabase.get(merchantResult.normalizedName);
      if (merchant) {
        merchant.occurrences++;
        merchant.lastSeen = Date.now();
        
        // Update database
        await learningDatabase.merchants.update(merchantResult.merchantId, {
          occurrences: merchant.occurrences,
          lastSeen: merchant.lastSeen
        });
      }
    }
    
    return merchantResult;
  }

  // === UTILITY METHODS ===

  cleanDescription(description) {
    return description
      .replace(/\bpos\b/gi, '')
      .replace(/\bcard\b/gi, '')
      .replace(/\bterminal\b/gi, '')
      .replace(/\bcumparare\b/gi, '')
      .replace(/\bplata\b/gi, '')
      .replace(/\d{4,}/g, '') // Remove long numbers (card numbers, etc.)
      .replace(/[*#]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractMerchantName(description) {
    const cleaned = this.cleanDescription(description);
    const words = cleaned.split(/\s+/);
    
    // Take first 3 meaningful words
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !/^\d+$/.test(word) && 
      !['the', 'and', 'or', 'de', 'la', 'din', 'cu'].includes(word.toLowerCase())
    );
    
    return meaningfulWords.slice(0, 3).join(' ').trim() || description.substring(0, 30);
  }

  generateNameVariations(name) {
    const variations = new Set();
    const normalized = this.normalizeText(name);
    
    variations.add(normalized);
    variations.add(name.toLowerCase());
    
    // Remove common prefixes/suffixes
    const withoutSuffixes = normalized
      .replace(/\s+(srl|sa|ltd|inc|corp)$/i, '')
      .replace(/\s+(magazine?|shop|store)$/i, '');
    
    variations.add(withoutSuffixes);
    
    // Abbreviations
    const words = normalized.split(/\s+/);
    if (words.length > 1) {
      const abbreviation = words.map(w => w[0]).join('');
      if (abbreviation.length > 1) {
        variations.add(abbreviation);
      }
    }
    
    return Array.from(variations).filter(v => v.length > 1);
  }

  calculateSimilarity(str1, str2) {
    // Use Jaro-Winkler similarity for better merchant matching
    const jaro = this.jaroSimilarity(str1, str2);
    const prefix = this.commonPrefixLength(str1, str2);
    return jaro + (0.1 * prefix * (1 - jaro));
  }

  jaroSimilarity(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 && len2 === 0) return 1;
    if (len1 === 0 || len2 === 0) return 0;
    
    const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
    const s1Matches = new Array(len1).fill(false);
    const s2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = s2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
    
    return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  }

  commonPrefixLength(s1, s2) {
    let prefix = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length) && i < 4; i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }
    return prefix;
  }

  extractMerchantFeatures(description, amount, context) {
    const normalized = this.normalizeText(description);
    
    return {
      wordCount: normalized.split(/\s+/).length,
      charCount: normalized.length,
      hasNumbers: /\d/.test(normalized),
      hasPaymentTerms: /\b(pos|card|terminal|plata|cumparare)\b/i.test(description),
      hasTransportKeywords: /\b(ratb|metrorex|taxi|uber|bolt)\b/i.test(normalized),
      hasElectronicsKeywords: /\b(emag|altex|electronic|computer)\b/i.test(normalized),
      hasFoodKeywords: /\b(restaurant|pizza|food|mcdonald)\b/i.test(normalized),
      hasCommonMerchantPattern: /\b[a-z]{3,}\s+[a-z]{3,}/i.test(normalized),
      amount: amount,
      timeOfDay: context.timeOfDay || null,
      dayOfWeek: context.dayOfWeek || null
    };
  }

  isAmountTypicalForCategory(amount, category) {
    const typicalRanges = {
      'Transport': { min: 1, max: 50 },
      'Alimente': { min: 10, max: 500 },
      'Combustibil': { min: 50, max: 300 },
      'ATM': { min: 50, max: 1000 },
      'Utilități': { min: 30, max: 400 },
      'Restaurante': { min: 15, max: 200 }
    };
    
    const range = typicalRanges[category];
    return range && amount >= range.min && amount <= range.max;
  }

  createUnknownMerchant(description) {
    return {
      name: this.extractMerchantName(description),
      normalizedName: this.normalizeText(description),
      category: 'Necategorizat',
      subcategory: null,
      confidence: 0.2,
      occurrences: 1,
      method: 'unknown',
      requiresManualReview: true
    };
  }

  // === LEARNING AND IMPROVEMENT ===

  async learnFromFeedback(merchantResult, userCorrection) {
    if (userCorrection.category !== merchantResult.category) {
      // Learn new category association
      const newPattern = this.normalizeText(userCorrection.originalDescription || merchantResult.name);
      
      // Update merchant record
      if (merchantResult.merchantId) {
        await learningDatabase.merchants.update(merchantResult.merchantId, {
          category: userCorrection.category,
          subcategory: userCorrection.subcategory,
          confidence: Math.min(merchantResult.confidence * 1.2, 1.0),
          metadata: {
            ...merchantResult.metadata,
            userCorrected: true,
            correctedAt: Date.now()
          }
        });
        
        console.log(`🎓 Learned correction: ${merchantResult.name} → ${userCorrection.category}`);
      }
      
      // Create new merchant if it doesn't exist
      if (!merchantResult.merchantId) {
        await this.createNewMerchant(
          userCorrection.originalDescription,
          userCorrection.category,
          userCorrection.subcategory,
          0.8
        );
      }
    }
  }

  async logClassificationResult(method, result, duration) {
    await learningDatabase.logPerformance(
      `merchant_classification_${method}`,
      duration,
      null,
      result?.confidence || 0,
      {
        category: result?.category,
        method: result?.method
      }
    );
  }

  // === PUBLIC API ===

  getCategories() {
    return Array.from(this.categoryPatterns.keys());
  }

  getCategoryHierarchy() {
    return Object.fromEntries(this.categoryHierarchy);
  }

  async getMerchantsByCategory(category) {
    return await learningDatabase.getMerchantsByCategory(category);
  }

  async getClassificationStats() {
    return await learningDatabase.getPerformanceMetrics('merchant_classification');
  }

  async exportMerchantData() {
    const merchants = await learningDatabase.merchants.toArray();
    return {
      merchants: merchants,
      categories: this.getCategories(),
      exportedAt: Date.now()
    };
  }

  async importMerchantData(data) {
    try {
      for (const merchant of data.merchants) {
        await learningDatabase.saveMerchant(merchant);
      }
      
      // Rebuild in-memory structures
      await this.loadMerchants();
      await this.buildAliasNetwork();
      
      console.log(`✅ Imported ${data.merchants.length} merchants`);
      return true;
    } catch (error) {
      console.error('Error importing merchant data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const merchantClassifier = new MerchantClassifier();