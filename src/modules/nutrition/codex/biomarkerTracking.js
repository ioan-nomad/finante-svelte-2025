/**
 * Biomarker Tracking System
 * Track health metrics correlated with nutrition
 */

export class BiomarkerTracker {
  constructor() {
    this.loadData();
  }
  
  loadData() {
    const stored = localStorage.getItem('codex_biomarkers');
    this.data = stored ? JSON.parse(stored) : {
      entries: [],
      targets: this.getDefaultTargets()
    };
  }
  
  saveData() {
    localStorage.setItem('codex_biomarkers', JSON.stringify(this.data));
  }
  
  getDefaultTargets() {
    return {
      // Based on optimal ranges from literature
      hsCRP: { 
        target: 1.0, 
        unit: "mg/L",
        optimal: "<1.0",
        pmid: "32706533"
      },
      HbA1c: {
        target: 5.4,
        unit: "%",
        optimal: "<5.4",
        pmid: "32333286"
      },
      HOMAIR: {
        target: 1.0,
        unit: "ratio",
        optimal: "<1.0",
        pmid: "28768170"
      },
      vitaminD: {
        target: 45,
        unit: "ng/ml",
        optimal: "40-60",
        pmid: "32252338"
      },
      omega3Index: {
        target: 8,
        unit: "%",
        optimal: ">8",
        pmid: "30103329"
      },
      triglycerides: {
        target: 100,
        unit: "mg/dL",
        optimal: "<100",
        pmid: "31588918"
      },
      HDL: {
        target: 60,
        unit: "mg/dL",
        optimal: ">60",
        pmid: "31647175"
      },
      LDL: {
        target: 100,
        unit: "mg/dL",
        optimal: "<100",
        pmid: "31858880"
      },
      systolicBP: {
        target: 120,
        unit: "mmHg",
        optimal: "<120",
        pmid: "33275353"
      },
      weight: {
        target: null,
        unit: "kg",
        optimal: "BMI 20-25",
        pmid: "32238384"
      }
    };
  }
  
  addEntry(entry) {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...entry
    };
    
    this.data.entries.push(newEntry);
    this.saveData();
    
    return this.analyzeProgress();
  }
  
  analyzeProgress() {
    const recent = this.data.entries.slice(-10);
    const analysis = {};
    
    Object.keys(this.data.targets).forEach(marker => {
      const values = recent
        .filter(e => e[marker] !== undefined)
        .map(e => e[marker]);
      
      if (values.length > 0) {
        const latest = values[values.length - 1];
        const target = this.data.targets[marker].target;
        const trend = this.calculateTrend(values);
        
        analysis[marker] = {
          latest,
          target,
          trend,
          status: this.getStatus(marker, latest, target),
          improvement: this.calculateImprovement(values)
        };
      }
    });
    
    return analysis;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a,b) => a+b, 0) / recent.length;
    const olderAvg = older.reduce((a,b) => a+b, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }
  
  getStatus(marker, value, target) {
    if (!target) return 'tracking';
    
    // Special cases where higher is better
    const higherBetter = ['HDL', 'omega3Index', 'vitaminD'];
    
    if (higherBetter.includes(marker)) {
      if (value >= target) return 'optimal';
      if (value >= target * 0.8) return 'good';
      return 'needs_improvement';
    }
    
    // Most markers: lower is better
    if (value <= target) return 'optimal';
    if (value <= target * 1.2) return 'good';
    return 'needs_improvement';
  }
  
  calculateImprovement(values) {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return ((last - first) / first) * 100;
  }
  
  getRecommendations(analysis) {
    const recommendations = [];
    
    Object.entries(analysis).forEach(([marker, data]) => {
      if (data.status === 'needs_improvement') {
        const rec = this.getMarkerRecommendation(marker, data);
        if (rec) recommendations.push(rec);
      }
    });
    
    return recommendations.slice(0, 3); // Top 3 priorities
  }
  
  getMarkerRecommendation(marker, data) {
    const recs = {
      hsCRP: {
        priority: 'HIGH',
        action: 'Increase anti-inflammatory foods (turmeric, ginger, omega-3)',
        pmid: '32706533'
      },
      HbA1c: {
        priority: 'HIGH',
        action: 'Lower glycemic load, increase fiber, implement TRF',
        pmid: '32333286'
      },
      omega3Index: {
        priority: 'MEDIUM',
        action: 'Add 2-3g EPA/DHA daily or fatty fish 3x/week',
        pmid: '30103329'
      },
      vitaminD: {
        priority: 'MEDIUM',
        action: 'Sun exposure 15min/day or 2000-4000 IU supplement',
        pmid: '32252338'
      },
      triglycerides: {
        priority: 'HIGH',
        action: 'Reduce refined carbs, increase omega-3, add exercise',
        pmid: '31588918'
      }
    };
    
    return recs[marker] || null;
  }
}

export default new BiomarkerTracker();