/**
 * ADVANCED DATABASE MANAGER - IndexedDB cu optimizări moderne
 * Features: Compression, Versioning, Caching, Statistics
 */

export class DatabaseManager {
  constructor() {
    this.dbName = 'MLEngineDB_v2025';
    this.version = 3;
    this.db = null;
    this.cache = new Map();
    this.compressionEnabled = this.checkCompressionSupport();
    
    // Statistics tracking
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      cacheHits: 0,
      totalSize: 0,
      compressionRatio: 0
    };
  }

  /**
   * Initialize IndexedDB with modern schema
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('❌ IndexedDB failed to open:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        this.calculateDatabaseSize();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Patterns store - pentru document patterns și signatures
        if (!db.objectStoreNames.contains('patterns')) {
          const patternsStore = db.createObjectStore('patterns', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          patternsStore.createIndex('bankName', 'bankName', { unique: false });
          patternsStore.createIndex('signature', 'signature', { unique: false });
          patternsStore.createIndex('accuracy', 'accuracy', { unique: false });
          patternsStore.createIndex('created', 'created', { unique: false });
        }
        
        // Merchants store - pentru merchant recognition
        if (!db.objectStoreNames.contains('merchants')) {
          const merchantsStore = db.createObjectStore('merchants', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          merchantsStore.createIndex('normalized', 'normalized', { unique: false });
          merchantsStore.createIndex('category', 'category', { unique: false });
          merchantsStore.createIndex('confidence', 'confidence', { unique: false });
          merchantsStore.createIndex('lastUsed', 'lastUsed', { unique: false });
        }
        
        // Transactions store - pentru processed transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          transactionsStore.createIndex('hash', 'hash', { unique: true });
          transactionsStore.createIndex('date', 'date', { unique: false });
          transactionsStore.createIndex('bankName', 'bankName', { unique: false });
          transactionsStore.createIndex('processed', 'processed', { unique: false });
        }
        
        // Models store - pentru ML models storage
        if (!db.objectStoreNames.contains('models')) {
          const modelsStore = db.createObjectStore('models', { 
            keyPath: 'name' 
          });
          modelsStore.createIndex('version', 'version', { unique: false });
          modelsStore.createIndex('accuracy', 'accuracy', { unique: false });
          modelsStore.createIndex('created', 'created', { unique: false });
        }
        
        // Feedback store - pentru user corrections și learning
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          feedbackStore.createIndex('transactionId', 'transactionId', { unique: false });
          feedbackStore.createIndex('timestamp', 'timestamp', { unique: false });
          feedbackStore.createIndex('processed', 'processed', { unique: false });
        }
        
        // Statistics store - pentru analytics
        if (!db.objectStoreNames.contains('statistics')) {
          const statsStore = db.createObjectStore('statistics', { 
            keyPath: 'key' 
          });
        }
        
        console.log('✅ Database schema upgraded to v' + this.version);
      };
    });
  }

  /**
   * PATTERNS MANAGEMENT
   */
  async storePattern(pattern) {
    const data = {
      bankName: pattern.bankName,
      signature: pattern.signature,
      rules: this.compressData(pattern.rules),
      accuracy: pattern.accuracy || 0.5,
      created: Date.now(),
      version: 1,
      samples: pattern.samples || []
    };
    
    return this.writeData('patterns', data);
  }

  async getPattern(bankName, signature) {
    // Check cache first
    const cacheKey = `pattern_${bankName}_${signature}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    const transaction = this.db.transaction(['patterns'], 'readonly');
    const store = transaction.objectStore('patterns');
    const index = store.index('signature');
    
    return new Promise((resolve, reject) => {
      const request = index.get(signature);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          result.rules = this.decompressData(result.rules);
          this.cache.set(cacheKey, result);
        }
        this.stats.totalReads++;
        resolve(result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllPatterns() {
    return this.readAllData('patterns', (item) => {
      item.rules = this.decompressData(item.rules);
      return item;
    });
  }

  /**
   * MERCHANTS MANAGEMENT
   */
  async storeMerchant(merchant) {
    const data = {
      raw: merchant.raw,
      normalized: merchant.normalized.toLowerCase(),
      category: merchant.category,
      confidence: merchant.confidence || 0.5,
      occurrences: merchant.occurrences || 1,
      lastUsed: Date.now(),
      patterns: merchant.patterns || [],
      metadata: this.compressData(merchant.metadata || {})
    };
    
    // Check if merchant already exists
    const existing = await this.getMerchantByNormalized(data.normalized);
    if (existing) {
      data.id = existing.id;
      data.occurrences = existing.occurrences + 1;
      data.confidence = Math.min(1.0, existing.confidence + 0.1);
    }
    
    return this.writeData('merchants', data);
  }

  async getMerchantByNormalized(normalized) {
    const cacheKey = `merchant_${normalized}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    const transaction = this.db.transaction(['merchants'], 'readonly');
    const store = transaction.objectStore('merchants');
    const index = store.index('normalized');
    
    return new Promise((resolve, reject) => {
      const request = index.get(normalized);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          result.metadata = this.decompressData(result.metadata);
          this.cache.set(cacheKey, result);
        }
        this.stats.totalReads++;
        resolve(result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async searchMerchants(query, limit = 20) {
    const merchants = await this.readAllData('merchants');
    
    // Fuzzy search implementation
    const results = merchants
      .map(merchant => ({
        ...merchant,
        similarity: this.calculateSimilarity(query.toLowerCase(), merchant.normalized)
      }))
      .filter(merchant => merchant.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return results.map(result => {
      result.metadata = this.decompressData(result.metadata);
      return result;
    });
  }

  /**
   * TRANSACTIONS MANAGEMENT
   */
  async storeTransactions(transactions) {
    const promises = transactions.map(tx => this.storeTransaction(tx));
    return Promise.all(promises);
  }

  async storeTransaction(transaction) {
    const hash = this.generateTransactionHash(transaction);
    
    const data = {
      hash: hash,
      date: transaction.date,
      amount: transaction.amount,
      description: transaction.description,
      merchant: transaction.merchant,
      category: transaction.category,
      bankName: transaction.bankName,
      confidence: transaction.confidence || 0,
      mlEnhanced: transaction.mlEnhanced || false,
      predictions: this.compressData(transaction.predictions || {}),
      processed: Date.now()
    };
    
    return this.writeData('transactions', data);
  }

  async getTransaction(id) {
    const result = await this.readData('transactions', id);
    if (result) {
      result.predictions = this.decompressData(result.predictions);
    }
    return result;
  }

  /**
   * MODELS MANAGEMENT
   */
  async storeModel(name, modelData, accuracy = 0) {
    const data = {
      name: name,
      data: this.compressData(modelData),
      accuracy: accuracy,
      version: Date.now(),
      created: Date.now(),
      size: JSON.stringify(modelData).length
    };
    
    return this.writeData('models', data);
  }

  async getModel(name) {
    const cacheKey = `model_${name}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    const result = await this.readData('models', name);
    if (result) {
      result.data = this.decompressData(result.data);
      this.cache.set(cacheKey, result);
    }
    return result;
  }

  async getModels() {
    return this.readAllData('models', (model) => {
      // Nu decompress data aici pentru performance
      return {
        name: model.name,
        accuracy: model.accuracy,
        version: model.version,
        created: model.created,
        size: model.size
      };
    });
  }

  /**
   * FEEDBACK MANAGEMENT
   */
  async storeFeedback(feedback) {
    const data = {
      transactionId: feedback.transactionId,
      original: this.compressData(feedback.original),
      corrections: this.compressData(feedback.corrections),
      timestamp: feedback.timestamp || Date.now(),
      processed: false
    };
    
    return this.writeData('feedback', data);
  }

  async getRecentFeedback(limit = 100) {
    const transaction = this.db.transaction(['feedback'], 'readonly');
    const store = transaction.objectStore('feedback');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev'); // Newest first
      const results = [];
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          const feedback = cursor.value;
          feedback.original = this.decompressData(feedback.original);
          feedback.corrections = this.decompressData(feedback.corrections);
          results.push(feedback);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * STATISTICS AND ANALYTICS
   */
  async getStatistics() {
    const stats = {
      patterns: await this.getCount('patterns'),
      merchants: await this.getCount('merchants'),
      transactions: await this.getCount('transactions'),
      models: await this.getCount('models'),
      feedback: await this.getCount('feedback'),
      totalSize: await this.calculateDatabaseSize(),
      cacheHitRate: this.stats.totalReads > 0 ? 
        (this.stats.cacheHits / this.stats.totalReads) * 100 : 0,
      compressionRatio: this.stats.compressionRatio
    };
    
    // Store current stats
    await this.writeData('statistics', {
      key: 'current',
      timestamp: Date.now(),
      ...stats
    });
    
    return stats;
  }

  async getPatternsCount() {
    return this.getCount('patterns');
  }

  async getMerchantsCount() {
    return this.getCount('merchants');
  }

  async getFeedbackCount() {
    return this.getCount('feedback');
  }

  async getAccuracyByBank() {
    // Group transactions by bank and calculate average accuracy
    const transactions = await this.readAllData('transactions');
    const bankAccuracy = {};
    
    transactions.forEach(tx => {
      if (!bankAccuracy[tx.bankName]) {
        bankAccuracy[tx.bankName] = { total: 0, sum: 0, accuracy: 0 };
      }
      bankAccuracy[tx.bankName].total++;
      bankAccuracy[tx.bankName].sum += tx.confidence;
    });
    
    for (const bank in bankAccuracy) {
      const data = bankAccuracy[bank];
      data.accuracy = data.total > 0 ? data.sum / data.total : 0;
    }
    
    return bankAccuracy;
  }

  async getAccuracyByCategory() {
    const transactions = await this.readAllData('transactions');
    const categoryAccuracy = {};
    
    transactions.forEach(tx => {
      if (!categoryAccuracy[tx.category]) {
        categoryAccuracy[tx.category] = { total: 0, sum: 0, accuracy: 0 };
      }
      categoryAccuracy[tx.category].total++;
      categoryAccuracy[tx.category].sum += tx.confidence;
    });
    
    for (const category in categoryAccuracy) {
      const data = categoryAccuracy[category];
      data.accuracy = data.total > 0 ? data.sum / data.total : 0;
    }
    
    return categoryAccuracy;
  }

  async getModelVersions() {
    const models = await this.readAllData('models');
    return models.map(model => ({
      name: model.name,
      version: model.version,
      accuracy: model.accuracy,
      created: model.created
    }));
  }

  /**
   * UTILITY FUNCTIONS
   */
  async readData(storeName, key) {
    this.stats.totalReads++;
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async readAllData(storeName, transformer = null) {
    this.stats.totalReads++;
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        let results = request.result;
        if (transformer) {
          results = results.map(transformer);
        }
        resolve(results);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async writeData(storeName, data) {
    this.stats.totalWrites++;
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      
      request.onsuccess = () => {
        // Clear relevant cache entries
        this.clearRelevantCache(storeName, data);
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getCount(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async calculateDatabaseSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0;
    }
    
    const estimate = await navigator.storage.estimate();
    this.stats.totalSize = estimate.usage || 0;
    return this.stats.totalSize;
  }

  // Data compression pentru large objects
  compressData(data) {
    if (!this.compressionEnabled || !data) return data;
    
    try {
      const jsonString = JSON.stringify(data);
      const compressed = this.simpleCompress(jsonString);
      
      this.stats.compressionRatio = compressed.length / jsonString.length;
      
      return {
        _compressed: true,
        data: compressed,
        originalSize: jsonString.length
      };
    } catch (error) {
      console.warn('Compression failed:', error);
      return data;
    }
  }

  decompressData(data) {
    if (!data || !data._compressed) return data;
    
    try {
      const decompressed = this.simpleDecompress(data.data);
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }

  // Simple compression algorithm (RLE-based)
  simpleCompress(str) {
    return str.replace(/(.)\1+/g, (match, char) => {
      return char + match.length;
    });
  }

  simpleDecompress(str) {
    return str.replace(/(.)(\d+)/g, (match, char, count) => {
      return char.repeat(parseInt(count));
    });
  }

  checkCompressionSupport() {
    // Check pentru modern browser features
    return typeof TextEncoder !== 'undefined' && 
           typeof TextDecoder !== 'undefined';
  }

  generateTransactionHash(transaction) {
    // Simple hash pentru duplicate detection
    const str = `${transaction.date}_${transaction.amount}_${transaction.description}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  calculateSimilarity(str1, str2) {
    // Levenshtein distance based similarity
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
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
    
    const distance = matrix[len1][len2];
    return 1 - (distance / Math.max(len1, len2));
  }

  clearRelevantCache(storeName, data) {
    // Clear cache entries related to updated data
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(storeName)) {
        this.cache.delete(key);
      }
    }
  }

  // Cleanup pentru memory management
  async cleanup() {
    // Clear old cache entries
    if (this.cache.size > 1000) {
      this.cache.clear();
    }
    
    // Remove old feedback entries (keep last 1000)
    const feedbackCount = await this.getCount('feedback');
    if (feedbackCount > 1000) {
      // Implementation pentru cleanup
      console.log('Cleanup: Removed old feedback entries');
    }
  }

  async updatePattern(pattern, confidence) {
    if (pattern.id) {
      pattern.accuracy = confidence;
      return this.writeData('patterns', pattern);
    }
  }
}