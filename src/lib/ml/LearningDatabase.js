// LearningDatabase.js - IndexedDB storage pentru ML engine
import Dexie from 'dexie';
import LZString from 'lz-string';

export class LearningDatabase extends Dexie {
  constructor() {
    super('FinanteMLDatabase');
    
    this.version(1).stores({
      // Patterns pentru detectarea băncilor
      bankPatterns: '++id, bank, pattern, patternType, accuracy, confidence, usageCount, lastUsed, createdAt',
      
      // Tranzacții procesate pentru învățare
      processedTransactions: '++id, documentHash, originalText, parsedData, bankDetected, confidence, feedback, timestamp, verified',
      
      // Merchant recognition și categorization
      merchants: '++id, name, normalizedName, aliases, category, subcategory, confidence, occurrences, lastSeen, metadata',
      
      // Machine learning models și weights
      mlModels: '++id, modelType, modelName, weights, biases, hyperparams, accuracy, trainedOn, lastUpdated, version',
      
      // Training data pentru neural networks
      trainingData: '++id, features, labels, source, quality, timestamp, verified',
      
      // OCR results cache
      ocrCache: '++id, documentHash, ocrText, confidence, method, timestamp, validated',
      
      // User feedback pentru improvement
      userFeedback: '++id, transactionId, originalParsing, userCorrections, feedbackType, timestamp, applied',
      
      // Performance metrics
      performanceMetrics: '++id, operation, duration, accuracy, confidence, timestamp, metadata'
    });

    // Hooks pentru data validation
    this.bankPatterns.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = Date.now();
      obj.lastUsed = Date.now();
      obj.usageCount = obj.usageCount || 0;
    });

    this.merchants.hook('creating', (primKey, obj, trans) => {
      obj.normalizedName = this.normalizeMerchantName(obj.name);
      obj.lastSeen = Date.now();
      obj.occurrences = obj.occurrences || 1;
    });
  }

  // === BANK PATTERNS MANAGEMENT ===
  async saveBankPattern(bank, pattern, patternType, accuracy = 0.7) {
    try {
      const existing = await this.bankPatterns
        .where(['bank', 'pattern'])
        .equals([bank, pattern])
        .first();

      if (existing) {
        // Update existing pattern
        return await this.bankPatterns.update(existing.id, {
          accuracy: Math.max(existing.accuracy, accuracy),
          usageCount: existing.usageCount + 1,
          lastUsed: Date.now()
        });
      } else {
        // Create new pattern
        return await this.bankPatterns.add({
          bank,
          pattern,
          patternType,
          accuracy,
          confidence: accuracy,
          usageCount: 1,
          lastUsed: Date.now(),
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Error saving bank pattern:', error);
      return null;
    }
  }

  async getBankPatterns(bank = null) {
    try {
      let query = this.bankPatterns.orderBy('accuracy').reverse();
      
      if (bank) {
        query = query.where('bank').equals(bank);
      }
      
      return await query.toArray();
    } catch (error) {
      console.error('Error getting bank patterns:', error);
      return [];
    }
  }

  // === MERCHANTS MANAGEMENT ===
  async saveMerchant(merchantData) {
    try {
      const normalized = this.normalizeMerchantName(merchantData.name);
      
      const existing = await this.merchants
        .where('normalizedName')
        .equals(normalized)
        .first();

      if (existing) {
        // Update existing merchant
        return await this.merchants.update(existing.id, {
          occurrences: existing.occurrences + 1,
          lastSeen: Date.now(),
          confidence: Math.max(existing.confidence, merchantData.confidence || 0.7),
          category: merchantData.category || existing.category,
          aliases: [...new Set([...existing.aliases, ...merchantData.aliases || []])]
        });
      } else {
        // Create new merchant
        return await this.merchants.add({
          name: merchantData.name,
          normalizedName: normalized,
          aliases: merchantData.aliases || [normalized],
          category: merchantData.category || 'Unknown',
          subcategory: merchantData.subcategory || null,
          confidence: merchantData.confidence || 0.7,
          occurrences: 1,
          lastSeen: Date.now(),
          metadata: merchantData.metadata || {}
        });
      }
    } catch (error) {
      console.error('Error saving merchant:', error);
      return null;
    }
  }

  async findMerchant(merchantName) {
    try {
      const normalized = this.normalizeMerchantName(merchantName);
      
      // Exact match first
      let merchant = await this.merchants
        .where('normalizedName')
        .equals(normalized)
        .first();

      if (merchant) return merchant;

      // Partial match in aliases
      merchant = await this.merchants
        .filter(m => m.aliases.some(alias => 
          alias.includes(normalized) || normalized.includes(alias)
        ))
        .first();

      return merchant || null;
    } catch (error) {
      console.error('Error finding merchant:', error);
      return null;
    }
  }

  async getMerchantsByCategory(category) {
    try {
      return await this.merchants
        .where('category')
        .equals(category)
        .orderBy('occurrences')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error getting merchants by category:', error);
      return [];
    }
  }

  // === ML MODELS STORAGE ===
  async saveMLModel(modelType, modelName, modelData) {
    try {
      const compressed = LZString.compress(JSON.stringify(modelData));
      
      const existing = await this.mlModels
        .where(['modelType', 'modelName'])
        .equals([modelType, modelName])
        .first();

      const modelRecord = {
        modelType,
        modelName,
        weights: compressed,
        biases: modelData.biases ? LZString.compress(JSON.stringify(modelData.biases)) : null,
        hyperparams: modelData.hyperparams || {},
        accuracy: modelData.accuracy || 0,
        trainedOn: modelData.trainedOn || 0,
        lastUpdated: Date.now(),
        version: (existing?.version || 0) + 1
      };

      if (existing) {
        return await this.mlModels.update(existing.id, modelRecord);
      } else {
        return await this.mlModels.add(modelRecord);
      }
    } catch (error) {
      console.error('Error saving ML model:', error);
      return null;
    }
  }

  async loadMLModel(modelType, modelName) {
    try {
      const model = await this.mlModels
        .where(['modelType', 'modelName'])
        .equals([modelType, modelName])
        .first();

      if (!model) return null;

      const weights = JSON.parse(LZString.decompress(model.weights));
      const biases = model.biases ? JSON.parse(LZString.decompress(model.biases)) : null;

      return {
        ...model,
        weights,
        biases
      };
    } catch (error) {
      console.error('Error loading ML model:', error);
      return null;
    }
  }

  // === TRAINING DATA MANAGEMENT ===
  async saveTrainingData(features, labels, source = 'user', quality = 0.8) {
    try {
      return await this.trainingData.add({
        features: LZString.compress(JSON.stringify(features)),
        labels: LZString.compress(JSON.stringify(labels)),
        source,
        quality,
        timestamp: Date.now(),
        verified: source === 'user'
      });
    } catch (error) {
      console.error('Error saving training data:', error);
      return null;
    }
  }

  async getTrainingData(limit = 1000, minQuality = 0.5) {
    try {
      const records = await this.trainingData
        .where('quality')
        .aboveOrEqual(minQuality)
        .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();

      return records.map(record => ({
        id: record.id,
        features: JSON.parse(LZString.decompress(record.features)),
        labels: JSON.parse(LZString.decompress(record.labels)),
        source: record.source,
        quality: record.quality,
        timestamp: record.timestamp,
        verified: record.verified
      }));
    } catch (error) {
      console.error('Error getting training data:', error);
      return [];
    }
  }

  // === PROCESSED TRANSACTIONS ===
  async saveProcessedTransaction(transactionData) {
    try {
      return await this.processedTransactions.add({
        documentHash: transactionData.documentHash,
        originalText: LZString.compress(transactionData.originalText || ''),
        parsedData: LZString.compress(JSON.stringify(transactionData.parsedData)),
        bankDetected: transactionData.bankDetected,
        confidence: transactionData.confidence || 0.5,
        feedback: null,
        timestamp: Date.now(),
        verified: false
      });
    } catch (error) {
      console.error('Error saving processed transaction:', error);
      return null;
    }
  }

  async getProcessedTransactions(bank = null, limit = 100) {
    try {
      let query = this.processedTransactions
        .orderBy('timestamp')
        .reverse()
        .limit(limit);

      if (bank) {
        query = query.where('bankDetected').equals(bank);
      }

      const records = await query.toArray();
      
      return records.map(record => ({
        ...record,
        originalText: record.originalText ? LZString.decompress(record.originalText) : '',
        parsedData: JSON.parse(LZString.decompress(record.parsedData))
      }));
    } catch (error) {
      console.error('Error getting processed transactions:', error);
      return [];
    }
  }

  // === USER FEEDBACK ===
  async saveFeedback(transactionId, originalParsing, userCorrections, feedbackType = 'correction') {
    try {
      return await this.userFeedback.add({
        transactionId,
        originalParsing: LZString.compress(JSON.stringify(originalParsing)),
        userCorrections: LZString.compress(JSON.stringify(userCorrections)),
        feedbackType,
        timestamp: Date.now(),
        applied: false
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      return null;
    }
  }

  async getPendingFeedback() {
    try {
      const records = await this.userFeedback
        .where('applied')
        .equals(false)
        .toArray();

      return records.map(record => ({
        ...record,
        originalParsing: JSON.parse(LZString.decompress(record.originalParsing)),
        userCorrections: JSON.parse(LZString.decompress(record.userCorrections))
      }));
    } catch (error) {
      console.error('Error getting pending feedback:', error);
      return [];
    }
  }

  // === OCR CACHE ===
  async saveOCRResult(documentHash, ocrText, confidence, method = 'tesseract') {
    try {
      const existing = await this.ocrCache
        .where('documentHash')
        .equals(documentHash)
        .first();

      const ocrData = {
        documentHash,
        ocrText: LZString.compress(ocrText),
        confidence,
        method,
        timestamp: Date.now(),
        validated: false
      };

      if (existing) {
        return await this.ocrCache.update(existing.id, ocrData);
      } else {
        return await this.ocrCache.add(ocrData);
      }
    } catch (error) {
      console.error('Error saving OCR result:', error);
      return null;
    }
  }

  async getOCRResult(documentHash) {
    try {
      const result = await this.ocrCache
        .where('documentHash')
        .equals(documentHash)
        .first();

      if (result) {
        return {
          ...result,
          ocrText: LZString.decompress(result.ocrText)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting OCR result:', error);
      return null;
    }
  }

  // === PERFORMANCE METRICS ===
  async logPerformance(operation, duration, accuracy = null, confidence = null, metadata = {}) {
    try {
      return await this.performanceMetrics.add({
        operation,
        duration,
        accuracy,
        confidence,
        timestamp: Date.now(),
        metadata
      });
    } catch (error) {
      console.warn('Error logging performance:', error);
    }
  }

  async getPerformanceMetrics(operation = null, days = 30) {
    try {
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      let query = this.performanceMetrics
        .where('timestamp')
        .above(cutoff);

      if (operation) {
        query = query.and(metric => metric.operation === operation);
      }

      return await query.toArray();
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  // === UTILITY METHODS ===
  normalizeMerchantName(name) {
    return name
      .toLowerCase()
      .replace(/\bpos\b/g, '')
      .replace(/\bcard\b/g, '')
      .replace(/\bterminal\b/g, '')
      .replace(/\d+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // === DATABASE MAINTENANCE ===
  async cleanup(daysToKeep = 90) {
    try {
      const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      // Cleanup old OCR cache
      await this.ocrCache.where('timestamp').below(cutoff).delete();
      
      // Cleanup old performance metrics
      await this.performanceMetrics.where('timestamp').below(cutoff).delete();
      
      // Cleanup old training data (keep verified ones)
      await this.trainingData
        .where('timestamp')
        .below(cutoff)
        .and(item => !item.verified)
        .delete();

      console.log(`🧹 Database cleanup completed - removed data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }
  }

  async exportData() {
    try {
      const data = {
        bankPatterns: await this.bankPatterns.toArray(),
        merchants: await this.merchants.toArray(),
        mlModels: await this.mlModels.toArray(),
        timestamp: Date.now()
      };

      return LZString.compressToBase64(JSON.stringify(data));
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async importData(compressedData) {
    try {
      const data = JSON.parse(LZString.decompressFromBase64(compressedData));
      
      if (data.bankPatterns) {
        await this.bankPatterns.bulkPut(data.bankPatterns);
      }
      
      if (data.merchants) {
        await this.merchants.bulkPut(data.merchants);
      }
      
      if (data.mlModels) {
        await this.mlModels.bulkPut(data.mlModels);
      }

      console.log('✅ Data import completed successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // === DATABASE STATS ===
  async getStats() {
    try {
      const stats = {
        bankPatterns: await this.bankPatterns.count(),
        merchants: await this.merchants.count(),
        processedTransactions: await this.processedTransactions.count(),
        mlModels: await this.mlModels.count(),
        trainingData: await this.trainingData.count(),
        ocrCache: await this.ocrCache.count(),
        userFeedback: await this.userFeedback.count(),
        performanceMetrics: await this.performanceMetrics.count(),
        dbSize: await this.getDatabaseSize()
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  async getDatabaseSize() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        };
      }
      return null;
    } catch (error) {
      console.warn('Could not estimate storage usage');
      return null;
    }
  }
}

// Export singleton instance
export const learningDatabase = new LearningDatabase();