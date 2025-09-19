import brain from 'brain.js';

class MLPredictor {
  constructor() {
    // Neural networks for different predictions
    this.expensePredictor = new brain.NeuralNetwork({
      hiddenLayers: [10, 8, 6],
      activation: 'sigmoid'
    });

    this.anomalyDetector = new brain.NeuralNetwork({
      hiddenLayers: [8, 6],
      activation: 'sigmoid'
    });

    this.budgetOverrunPredictor = new brain.NeuralNetwork({
      hiddenLayers: [12, 8, 4],
      activation: 'sigmoid'
    });

    this.isInitialized = false;
    this.categories = [
      'Alimente', 'Transport', 'Utilități', 'Divertisment',
      'Sănătate', 'Shopping', 'Restaurant', 'ATM', 'Transfer', 'Altele'
    ];

    this.monthlyPatterns = {};
    this.anomalyThreshold = 0.7;
  }

  /**
   * Initialize and train all neural networks
   */
  async initialize(transactions, budgets = []) {
    console.log('🧠 Initializing ML Predictor with', transactions.length, 'transactions');

    if (transactions.length < 10) {
      console.warn('⚠️ Not enough transaction data for meaningful predictions');
      return false;
    }

    try {
      // Prepare training data
      const processedData = this.preprocessTransactions(transactions);
      const budgetData = this.preprocessBudgets(budgets, transactions);

      // Train expense predictor
      await this.trainExpensePredictor(processedData);

      // Train anomaly detector
      await this.trainAnomalyDetector(processedData);

      // Train budget overrun predictor
      await this.trainBudgetPredictor(budgetData);

      this.isInitialized = true;
      console.log('✅ ML Predictor initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ ML Predictor initialization failed:', error);
      return false;
    }
  }

  /**
   * Preprocess transactions for neural network training
   */
  preprocessTransactions(transactions) {
    const monthlyData = {};
    const now = new Date();

    // Group transactions by month and category
    transactions.forEach(tx => {
      if (tx.type === 'expense' && tx.amount < 0) {
        const date = new Date(tx.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const category = tx.category || 'Altele';
        const amount = Math.abs(tx.amount);

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            total: 0,
            categories: {},
            dayOfWeek: {},
            timeOfMonth: { early: 0, mid: 0, late: 0 },
            transactionCount: 0
          };
        }

        monthlyData[monthKey].total += amount;
        monthlyData[monthKey].categories[category] = (monthlyData[monthKey].categories[category] || 0) + amount;
        monthlyData[monthKey].transactionCount++;

        // Day of week pattern
        const dayOfWeek = date.getDay();
        monthlyData[monthKey].dayOfWeek[dayOfWeek] = (monthlyData[monthKey].dayOfWeek[dayOfWeek] || 0) + amount;

        // Time of month pattern
        const dayOfMonth = date.getDate();
        if (dayOfMonth <= 10) monthlyData[monthKey].timeOfMonth.early += amount;
        else if (dayOfMonth <= 20) monthlyData[monthKey].timeOfMonth.mid += amount;
        else monthlyData[monthKey].timeOfMonth.late += amount;
      }
    });

    this.monthlyPatterns = monthlyData;
    return monthlyData;
  }

  /**
   * Train expense prediction neural network
   */
  async trainExpensePredictor(monthlyData) {
    console.log('🎯 Training expense predictor...');

    const trainingData = [];
    const monthKeys = Object.keys(monthlyData).sort();

    // Create training sequences (3 months -> next month)
    for (let i = 0; i < monthKeys.length - 1; i++) {
      const inputMonths = monthKeys.slice(Math.max(0, i - 2), i + 1);
      const targetMonth = monthKeys[i + 1];

      if (inputMonths.length === 3) {
        const input = this.createMonthlyFeatureVector(inputMonths, monthlyData);
        const output = this.createCategoryOutputVector(monthlyData[targetMonth]);

        trainingData.push({ input, output });
      }
    }

    if (trainingData.length > 0) {
      await this.expensePredictor.trainAsync(trainingData, {
        iterations: 2000,
        errorThresh: 0.01,
        learningRate: 0.3
      });
      console.log('✅ Expense predictor trained with', trainingData.length, 'samples');
    }
  }

  /**
   * Train anomaly detection neural network
   */
  async trainAnomalyDetector(monthlyData) {
    console.log('🔍 Training anomaly detector...');

    const trainingData = [];

    // Create normal transaction patterns
    Object.values(monthlyData).forEach(monthData => {
      Object.entries(monthData.categories).forEach(([category, amount]) => {
        const normalizedAmount = this.normalizeAmount(amount, monthData.total);
        const features = this.createTransactionFeatures(category, normalizedAmount, monthData);

        // Normal transactions (label: 0)
        trainingData.push({
          input: features,
          output: [0] // Not anomaly
        });
      });
    });

    // Create artificial anomaly patterns
    const avgTotals = Object.values(monthlyData).map(m => m.total);
    const avgTotal = avgTotals.reduce((a, b) => a + b, 0) / avgTotals.length;

    this.categories.forEach(category => {
      // Very high spending anomaly
      const highAnomalyAmount = avgTotal * 2;
      const highFeatures = this.createTransactionFeatures(category, 0.8, { total: avgTotal });
      trainingData.push({
        input: highFeatures,
        output: [1] // Anomaly
      });

      // Unusual category spending
      const unusualFeatures = this.createTransactionFeatures(category, 0.5, { total: avgTotal * 0.1 });
      trainingData.push({
        input: unusualFeatures,
        output: [1] // Anomaly
      });
    });

    if (trainingData.length > 0) {
      await this.anomalyDetector.trainAsync(trainingData, {
        iterations: 1500,
        errorThresh: 0.05,
        learningRate: 0.3
      });
      console.log('✅ Anomaly detector trained with', trainingData.length, 'samples');
    }
  }

  /**
   * Train budget overrun prediction neural network
   */
  async trainBudgetPredictor(budgetData) {
    console.log('💰 Training budget overrun predictor...');

    const trainingData = [];

    budgetData.forEach(data => {
      const input = [
        data.budgetRatio,           // Current budget usage ratio
        data.dayOfMonth / 31,       // Progress through month
        data.avgDailySpending,      // Average daily spending rate
        data.categoryTrend,         // Spending trend for category
        data.seasonality,           // Seasonal factor
        data.lastMonthOverrun ? 1 : 0, // Previous month overrun
        data.transactionFrequency   // Transaction frequency
      ];

      const output = [data.willOverrun ? 1 : 0]; // Will exceed budget

      trainingData.push({ input, output });
    });

    if (trainingData.length > 0) {
      await this.budgetOverrunPredictor.trainAsync(trainingData, {
        iterations: 1000,
        errorThresh: 0.05,
        learningRate: 0.3
      });
      console.log('✅ Budget predictor trained with', trainingData.length, 'samples');
    }
  }

  /**
   * Predict next month's expenses by category
   */
  predictNextMonthExpenses() {
    if (!this.isInitialized) {
      console.warn('⚠️ ML Predictor not initialized');
      return null;
    }

    try {
      const monthKeys = Object.keys(this.monthlyPatterns).sort();
      const recentMonths = monthKeys.slice(-3);

      if (recentMonths.length < 3) {
        console.warn('⚠️ Not enough historical data for prediction');
        return null;
      }

      const input = this.createMonthlyFeatureVector(recentMonths, this.monthlyPatterns);
      const prediction = this.expensePredictor.run(input);

      // Convert prediction back to category amounts
      const categoryPredictions = {};
      const recentMonth = this.monthlyPatterns[recentMonths[recentMonths.length - 1]];
      const baseAmount = recentMonth.total;

      this.categories.forEach((category, index) => {
        if (prediction[index] !== undefined) {
          categoryPredictions[category] = Math.round(prediction[index] * baseAmount);
        }
      });

      console.log('🔮 Next month expense predictions:', categoryPredictions);
      return categoryPredictions;

    } catch (error) {
      console.error('❌ Expense prediction failed:', error);
      return null;
    }
  }

  /**
   * Detect if a transaction is anomalous
   */
  detectAnomaly(transaction) {
    if (!this.isInitialized) return { isAnomaly: false, confidence: 0 };

    try {
      const recentMonths = Object.values(this.monthlyPatterns);
      const avgMonthly = recentMonths.reduce((sum, month) => sum + month.total, 0) / recentMonths.length;

      const normalizedAmount = Math.abs(transaction.amount) / avgMonthly;
      const features = this.createTransactionFeatures(
        transaction.category || 'Altele',
        normalizedAmount,
        { total: avgMonthly }
      );

      const result = this.anomalyDetector.run(features);
      const anomalyScore = result[0] || 0;

      return {
        isAnomaly: anomalyScore > this.anomalyThreshold,
        confidence: anomalyScore,
        severity: this.getAnomalySeverity(anomalyScore)
      };

    } catch (error) {
      console.error('❌ Anomaly detection failed:', error);
      return { isAnomaly: false, confidence: 0 };
    }
  }

  /**
   * Predict budget overrun probability
   */
  predictBudgetOverrun(currentSpending, budget, dayOfMonth) {
    if (!this.isInitialized) return { probability: 0, risk: 'unknown' };

    try {
      const budgetRatio = currentSpending / budget;
      const monthProgress = dayOfMonth / 31;
      const avgDailySpending = currentSpending / dayOfMonth;

      // Calculate trend and seasonality (simplified)
      const recentMonths = Object.values(this.monthlyPatterns);
      const avgMonthly = recentMonths.reduce((sum, month) => sum + month.total, 0) / recentMonths.length;
      const categoryTrend = currentSpending / avgMonthly;

      const input = [
        budgetRatio,
        monthProgress,
        avgDailySpending / 100, // Normalize
        categoryTrend,
        0.5, // Neutral seasonality
        0,   // No previous overrun data
        dayOfMonth / 31 // Transaction frequency proxy
      ];

      const result = this.budgetOverrunPredictor.run(input);
      const probability = result[0] || 0;

      return {
        probability: Math.round(probability * 100),
        risk: this.getBudgetRisk(probability),
        projectedOverrun: this.calculateProjectedOverrun(currentSpending, dayOfMonth, budget)
      };

    } catch (error) {
      console.error('❌ Budget overrun prediction failed:', error);
      return { probability: 0, risk: 'unknown' };
    }
  }

  /**
   * Get insights and recommendations
   */
  getInsights(transactions, budgets) {
    const insights = [];

    // Expense predictions
    const nextMonthPredictions = this.predictNextMonthExpenses();
    if (nextMonthPredictions) {
      const totalPredicted = Object.values(nextMonthPredictions).reduce((a, b) => a + b, 0);
      insights.push({
        type: 'prediction',
        title: 'Predicție Cheltuieli Luna Viitoare',
        message: `Cheltuieli estimate: ${totalPredicted.toLocaleString()} RON`,
        details: nextMonthPredictions,
        severity: 'info'
      });
    }

    // Budget overrun warnings
    budgets.forEach(budget => {
      const currentDate = new Date();
      const dayOfMonth = currentDate.getDate();
      const spending = this.getCurrentSpending(transactions, budget.category, currentDate);

      const overrunPrediction = this.predictBudgetOverrun(spending, budget.budget, dayOfMonth);
      if (overrunPrediction.probability > 70) {
        insights.push({
          type: 'warning',
          title: `Risc Depășire Buget: ${budget.category}`,
          message: `${overrunPrediction.probability}% probabilitate de depășire`,
          details: overrunPrediction,
          severity: 'high'
        });
      }
    });

    // Recent anomalies
    const recentTransactions = transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      })
      .slice(-10);

    recentTransactions.forEach(tx => {
      const anomaly = this.detectAnomaly(tx);
      if (anomaly.isAnomaly) {
        insights.push({
          type: 'anomaly',
          title: 'Tranzacție Neobișnuită Detectată',
          message: `${tx.description}: ${Math.abs(tx.amount)} RON`,
          details: anomaly,
          severity: anomaly.severity
        });
      }
    });

    return insights;
  }

  // Helper methods
  createMonthlyFeatureVector(monthKeys, monthlyData) {
    const features = [];

    monthKeys.forEach(monthKey => {
      const month = monthlyData[monthKey];
      if (month) {
        // Add normalized spending by category
        this.categories.forEach(category => {
          const amount = month.categories[category] || 0;
          features.push(amount / month.total || 0);
        });

        // Add temporal features
        features.push(month.transactionCount / 50); // Normalized transaction count
        features.push(month.timeOfMonth.early / month.total || 0);
        features.push(month.timeOfMonth.mid / month.total || 0);
        features.push(month.timeOfMonth.late / month.total || 0);
      }
    });

    return features;
  }

  createCategoryOutputVector(monthData) {
    return this.categories.map(category => {
      const amount = monthData.categories[category] || 0;
      return amount / monthData.total || 0;
    });
  }

  createTransactionFeatures(category, normalizedAmount, monthData) {
    const categoryIndex = this.categories.indexOf(category);
    const features = new Array(this.categories.length).fill(0);
    if (categoryIndex >= 0) features[categoryIndex] = 1;

    features.push(
      normalizedAmount,
      monthData.transactionCount / 50 || 0,
      Math.min(normalizedAmount * 10, 1) // Amount impact factor
    );

    return features;
  }

  normalizeAmount(amount, total) {
    return Math.min(amount / total, 1);
  }

  preprocessBudgets(budgets, transactions) {
    const budgetData = [];
    const currentDate = new Date();

    budgets.forEach(budget => {
      const monthlySpending = this.getCurrentSpending(transactions, budget.category, currentDate);
      const dayOfMonth = currentDate.getDate();

      budgetData.push({
        budgetRatio: monthlySpending / budget.budget,
        dayOfMonth: dayOfMonth,
        avgDailySpending: monthlySpending / dayOfMonth / 100,
        categoryTrend: 0.5, // Simplified
        seasonality: 0.5,   // Simplified
        lastMonthOverrun: false, // Simplified
        transactionFrequency: dayOfMonth / 31,
        willOverrun: monthlySpending > budget.budget
      });
    });

    return budgetData;
  }

  getCurrentSpending(transactions, category, date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    return transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startOfMonth &&
               txDate <= date &&
               tx.category === category &&
               tx.type === 'expense';
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }

  getAnomalySeverity(score) {
    if (score > 0.9) return 'critical';
    if (score > 0.8) return 'high';
    if (score > 0.7) return 'medium';
    return 'low';
  }

  getBudgetRisk(probability) {
    if (probability > 0.8) return 'critical';
    if (probability > 0.6) return 'high';
    if (probability > 0.4) return 'medium';
    return 'low';
  }

  calculateProjectedOverrun(currentSpending, dayOfMonth, budget) {
    const dailyRate = currentSpending / dayOfMonth;
    const daysRemaining = 31 - dayOfMonth;
    const projectedTotal = currentSpending + (dailyRate * daysRemaining);
    return Math.max(0, projectedTotal - budget);
  }

  /**
   * Save trained models to localStorage
   */
  saveModels() {
    try {
      const models = {
        expensePredictor: this.expensePredictor.toJSON(),
        anomalyDetector: this.anomalyDetector.toJSON(),
        budgetOverrunPredictor: this.budgetOverrunPredictor.toJSON(),
        monthlyPatterns: this.monthlyPatterns,
        isInitialized: this.isInitialized
      };

      localStorage.setItem('mlPredictorModels', JSON.stringify(models));
      console.log('💾 ML models saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save ML models:', error);
      return false;
    }
  }

  /**
   * Load trained models from localStorage
   */
  loadModels() {
    try {
      const savedModels = localStorage.getItem('mlPredictorModels');
      if (!savedModels) return false;

      const models = JSON.parse(savedModels);

      this.expensePredictor.fromJSON(models.expensePredictor);
      this.anomalyDetector.fromJSON(models.anomalyDetector);
      this.budgetOverrunPredictor.fromJSON(models.budgetOverrunPredictor);
      this.monthlyPatterns = models.monthlyPatterns || {};
      this.isInitialized = models.isInitialized || false;

      console.log('📁 ML models loaded from localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to load ML models:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mlPredictor = new MLPredictor();