/**
 * MLEngine v4.0 - FIXED Singleton Pattern to Prevent Duplicate Loading
 * Advanced Modular ML Architecture with duplicate prevention
 * Multi-framework ML system for finance and nutrition analysis
 */

// Global singleton instance management
let mlEngineInstance = null;
let tfInstance = null;
let brainInstance = null;
let tesseractInstance = null;
let isInitializing = false;
let initializationPromise = null;

// Import utilities
import { DatabaseManager } from './DatabaseManager.js';
import { OCREngine } from './OCREngine.js';
import { NeuralNetworkEngine } from './NeuralNetworkEngine.js';
import { PatternRecognitionEngine } from './PatternRecognitionEngine.js';
import { TextProcessingEngine } from './TextProcessingEngine.js';

export class MLEngine {
  constructor() {
    // CRITICAL: Singleton pattern to prevent duplicate instances
    if (mlEngineInstance) {
      console.log('🔄 MLEngine: Returning existing singleton instance');
      return mlEngineInstance;
    }

    // Prevent concurrent initialization
    if (isInitializing) {
      console.log('⏳ MLEngine: Already initializing, returning promise...');
      return initializationPromise;
    }

    console.log('🚀 MLEngine: Creating new singleton instance');
    mlEngineInstance = this;
    
    // Core engines
    this.db = new DatabaseManager();
    this.ocr = new OCREngine();
    this.neural = new NeuralNetworkEngine();
    this.patterns = new PatternRecognitionEngine();
    this.textProcessor = new TextProcessingEngine();
    
    // Framework instances (singleton managed)
    this.frameworks = {
      tensorflow: null,
      brain: null,
      tesseract: null
    };
    
    // Model storage
    this.models = new Map();
    this.isModelLoaded = false;
    
    // Real-time metrics
    this.metrics = {
      totalProcessed: 0,
      accuracyHistory: [],
      learningRate: 0.001,
      averageProcessingTime: 0,
      modelsLoaded: 0,
      patternsLearned: 0,
      merchantsRecognized: 0,
      duplicatePreventions: 0
    };
    
    // Capabilities tracking
    this.capabilities = {
      textClassification: false,
      financialPrediction: false,
      nutritionAnalysis: false,
      ocrProcessing: false,
      patternRecognition: false
    };
    
    // WebAssembly optimization flag
    this.wasmSupported = this.checkWASMSupport();
    this.initialized = false;
    
    // Start initialization
    this.initPromise = this.initialize();
    return this;
  }

  /**
   * CRITICAL: Check if TensorFlow is already loaded globally
   */
  static isTensorFlowLoaded() {
    return (
      typeof window !== 'undefined' && 
      (window.tf !== undefined || 
       document.querySelector('script[src*="tensorflow"]') !== null)
    );
  }

  /**
   * FIXED: Singleton TensorFlow loading
   */
  static async getTensorFlowInstance() {
    // Return cached instance
    if (tfInstance) {
      console.log('✅ TensorFlow: Using cached singleton instance');
      return tfInstance;
    }

    // Check if already loaded globally
    if (MLEngine.isTensorFlowLoaded() && window.tf) {
      console.log('✅ TensorFlow: Using existing global instance');
      tfInstance = window.tf;
      return tfInstance;
    }

    console.log('📦 TensorFlow: Loading singleton instance...');
    try {
      // Dynamic import with singleton caching
      const tfModule = await import('@tensorflow/tfjs');
      tfInstance = tfModule.default || tfModule;
      
      // Set global reference to prevent re-loading
      if (typeof window !== 'undefined') {
        window.tf = tfInstance;
      }
      
      console.log(`✅ TensorFlow singleton loaded: v${tfInstance.version?.tfjs || 'unknown'}`);
      return tfInstance;
    } catch (error) {
      console.error('❌ TensorFlow loading failed:', error);
      throw new Error(`TensorFlow loading failed: ${error.message}`);
    }
  }

  /**
   * FIXED: Singleton Brain.js loading
   */
  static async getBrainInstance() {
    if (brainInstance) {
      console.log('✅ Brain.js: Using cached singleton instance');
      return brainInstance;
    }

    try {
      console.log('📦 Brain.js: Loading singleton instance...');
      const brainModule = await import('brain.js');
      brainInstance = brainModule.default || brainModule;
      console.log('✅ Brain.js singleton loaded');
      return brainInstance;
    } catch (error) {
      console.warn('⚠️ Brain.js loading failed:', error);
      return null;
    }
  }

  /**
   * FIXED: Singleton Tesseract loading
   */
  static async getTesseractInstance() {
    if (tesseractInstance) {
      console.log('✅ Tesseract: Using cached singleton instance');
      return tesseractInstance;
    }

    try {
      console.log('📦 Tesseract: Loading singleton instance...');
      const tesseractModule = await import('tesseract.js');
      tesseractInstance = tesseractModule.default || tesseractModule;
      console.log('✅ Tesseract singleton loaded');
      return tesseractInstance;
    } catch (error) {
      console.warn('⚠️ Tesseract loading failed:', error);
      return null;
    }
  }

  /**
   * MAIN INITIALIZATION - FIXED with singleton management
   */
  async initialize() {
    if (this.initialized) {
      console.log('✅ MLEngine: Already initialized');
      return this;
    }

    if (isInitializing) {
      console.log('⏳ MLEngine: Waiting for ongoing initialization...');
      return initializationPromise;
    }

    isInitializing = true;
    initializationPromise = this.performInitialization();
    
    try {
      await initializationPromise;
      return this;
    } finally {
      isInitializing = false;
      initializationPromise = null;
    }
  }

  async performInitialization() {
    console.log('🔧 MLEngine: Starting singleton initialization...');

    try {
      // 1. Initialize TensorFlow (singleton)
      console.log('📦 Loading TensorFlow.js singleton...');
      this.frameworks.tensorflow = await MLEngine.getTensorFlowInstance();
      this.capabilities.textClassification = true;
      this.capabilities.financialPrediction = true;
      this.capabilities.nutritionAnalysis = true;
      this.metrics.modelsLoaded++;
      console.log('✅ TensorFlow.js ready');

      // 2. Initialize Brain.js (singleton)
      this.frameworks.brain = await MLEngine.getBrainInstance();
      if (this.frameworks.brain) {
        this.capabilities.patternRecognition = true;
        this.metrics.modelsLoaded++;
        console.log('✅ Brain.js ready');
      }

      // 3. Initialize Tesseract.js (singleton)
      this.frameworks.tesseract = await MLEngine.getTesseractInstance();
      if (this.frameworks.tesseract) {
        this.capabilities.ocrProcessing = true;
        this.metrics.modelsLoaded++;
        console.log('✅ Tesseract.js ready');
      }

      // 4. Initialize base models
      await this.initializeModels();

      // 5. Initialize sub-engines
      await this.initializeSubEngines();

      this.initialized = true;
      console.log('🎉 MLEngine singleton initialization complete!');
      console.log('🔍 Capabilities:', this.capabilities);
      console.log('📊 Models loaded:', this.metrics.modelsLoaded);

      return this;
    } catch (error) {
      console.error('❌ MLEngine initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize base ML models
   */
  async initializeModels() {
    console.log('🏗️ Initializing base models...');

    try {
      // Financial Analysis Model
      if (this.frameworks.tensorflow) {
        const financialModel = await this.createFinancialModel();
        this.models.set('financial', financialModel);
        console.log('✅ Financial analysis model ready');
      }

      // Text Classification Model  
      if (this.frameworks.tensorflow) {
        const textModel = await this.createTextClassificationModel();
        this.models.set('textClassification', textModel);
        console.log('✅ Text classification model ready');
      }

      // Pattern Recognition Model (Brain.js)
      if (this.frameworks.brain) {
        const patternModel = this.createPatternRecognitionModel();
        this.models.set('patterns', patternModel);
        console.log('✅ Pattern recognition model ready');
      }

      this.isModelLoaded = true;
    } catch (error) {
      console.warn('⚠️ Some models failed to initialize:', error);
    }
  }

  /**
   * Initialize sub-engines with singleton frameworks
   */
  async initializeSubEngines() {
    console.log('🔧 Initializing sub-engines...');

    try {
      // Initialize neural network engine
      if (this.neural && this.frameworks.tensorflow) {
        await this.neural.initialize(this.frameworks.tensorflow);
      }

      // Initialize OCR engine
      if (this.ocr && this.frameworks.tesseract) {
        await this.ocr.initialize(this.frameworks.tesseract);
      }

      // Initialize pattern recognition engine
      if (this.patterns && this.frameworks.brain) {
        await this.patterns.initialize(this.frameworks.brain);
      }

      // Initialize text processing engine
      if (this.textProcessor) {
        await this.textProcessor.initialize();
      }

      console.log('✅ Sub-engines initialized');
    } catch (error) {
      console.warn('⚠️ Some sub-engines failed to initialize:', error);
    }
  }

  /**
   * Create Financial Analysis Model
   */
  async createFinancialModel() {
    const tf = this.frameworks.tensorflow;
    
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Text Classification Model
   */
  async createTextClassificationModel() {
    const tf = this.frameworks.tensorflow;
    
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({ inputDim: 10000, outputDim: 16 }),
        tf.layers.globalAveragePooling1d(),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Create Pattern Recognition Model (Brain.js)
   */
  createPatternRecognitionModel() {
    if (!this.frameworks.brain) {
      throw new Error('Brain.js not available');
    }

    const net = new this.frameworks.brain.NeuralNetwork({
      hiddenLayers: [10, 5],
      activation: 'sigmoid'
    });

    return net;
  }

  /**
   * WebAssembly support check
   */
  checkWASMSupport() {
    try {
      return typeof WebAssembly === 'object' && 
             typeof WebAssembly.instantiate === 'function';
    } catch (e) {
      return false;
    }
  }

  /**
   * Analyze Financial Transaction
   */
  async analyzeTransaction(transaction) {
    if (!this.initialized) {
      await this.initialize();
    }

    const model = this.models.get('financial');
    if (!model) {
      throw new Error('Financial model not available');
    }

    try {
      const startTime = performance.now();
      
      // Feature extraction
      const features = this.extractFinancialFeatures(transaction);
      const tf = this.frameworks.tensorflow;
      
      // Create tensor and predict
      const prediction = model.predict(tf.tensor2d([features]));
      const result = await prediction.data();
      
      // Clean up tensors
      prediction.dispose();

      // Update metrics
      this.metrics.totalProcessed++;
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + (performance.now() - startTime)) / 2;

      return {
        riskScore: result[0],
        category: this.categorizeTransaction(features, result[0]),
        confidence: Math.abs(result[0] - 0.5) * 2,
        features: features,
        processingTime: performance.now() - startTime
      };
    } catch (error) {
      console.error('❌ Financial analysis failed:', error);
      return {
        riskScore: 0.5,
        category: 'unknown',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Extract features from financial transaction
   */
  extractFinancialFeatures(transaction) {
    const amount = parseFloat(transaction.amount) || 0;
    const description = transaction.description || '';
    
    return [
      Math.min(amount / 1000, 10), // Normalized amount
      description.length / 100, // Description length
      transaction.category === 'income' ? 1 : 0,
      transaction.category === 'expense' ? 1 : 0,
      new Date(transaction.date).getDay() / 7, // Day of week
      new Date(transaction.date).getMonth() / 12, // Month
      amount < 0 ? 1 : 0, // Is negative
      Math.log10(Math.abs(amount) + 1) / 5, // Log amount
      description.split(' ').length / 20, // Word count
      /urgent|important|critical/i.test(description) ? 1 : 0 // Priority keywords
    ];
  }

  /**
   * Categorize transaction
   */
  categorizeTransaction(features, riskScore) {
    const amount = features[0] * 1000;
    const isIncome = features[2] === 1;
    const isExpense = features[3] === 1;

    if (isIncome) return 'income';
    if (isExpense && riskScore > 0.7) return 'high-risk-expense';
    if (isExpense && riskScore < 0.3) return 'routine-expense';
    if (amount > 5000) return 'large-transaction';
    
    return 'standard-transaction';
  }

  /**
   * Get engine status with singleton info
   */
  getStatus() {
    return {
      ready: this.initialized,
      singleton: !!mlEngineInstance,
      initializing: isInitializing,
      frameworks: {
        tensorflow: !!this.frameworks.tensorflow,
        brain: !!this.frameworks.brain,
        tesseract: !!this.frameworks.tesseract
      },
      capabilities: this.capabilities,
      models: Array.from(this.models.keys()),
      metrics: this.metrics,
      wasmSupported: this.wasmSupported,
      duplicatePreventions: this.metrics.duplicatePreventions
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    console.log('🧹 MLEngine: Cleaning up singleton resources...');
    
    try {
      // Dispose TensorFlow models
      this.models.forEach((model, name) => {
        if (model && typeof model.dispose === 'function') {
          model.dispose();
          console.log(`✅ Disposed model: ${name}`);
        }
      });
      
      this.models.clear();
      this.initialized = false;
      
      console.log('✅ MLEngine cleanup complete');
    } catch (error) {
      console.error('❌ MLEngine cleanup failed:', error);
    }
  }

  /**
   * Static method to get singleton instance
   */
  static getInstance() {
    if (!mlEngineInstance) {
      console.log('🆕 Creating new MLEngine singleton instance');
      mlEngineInstance = new MLEngine();
    } else {
      console.log('♻️ Returning existing MLEngine singleton instance');
      if (mlEngineInstance.metrics) {
        mlEngineInstance.metrics.duplicatePreventions++;
      }
    }
    return mlEngineInstance;
  }

  /**
   * Reset singleton (for testing)
   */
  static reset() {
    console.log('🔄 Resetting MLEngine singleton...');
    if (mlEngineInstance) {
      mlEngineInstance.dispose();
    }
    mlEngineInstance = null;
    tfInstance = null;
    brainInstance = null;
    tesseractInstance = null;
    isInitializing = false;
    initializationPromise = null;
  }

  /**
   * Check if instance is ready
   */
  static isReady() {
    return mlEngineInstance && mlEngineInstance.initialized;
  }
}

// Default export
export default MLEngine;

// Convenience functions
export const createMLEngine = () => MLEngine.getInstance();
export const getMLEngineStatus = () => {
  const instance = MLEngine.getInstance();
  return instance.getStatus();
};
export const resetMLEngine = () => MLEngine.reset();