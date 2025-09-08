// =============================================================================
// mTOR CYCLING TRACKER - OPTIMIZED LONGEVITY PROTOCOL
// Balances growth, maintenance, and autophagy phases
// =============================================================================

import { writable, derived, get } from 'svelte/store';
import { secureStorage } from '../../../lib/security/disabled.js';

// =============================================================================
// mTOR CYCLE STATE MANAGEMENT
// =============================================================================

export const mtorCycleState = writable({
  // Current cycle information
  currentPhase: 'maintenance', // growth, maintenance, autophagy
  dayInPhase: 1,
  phaseLength: 7, // days per phase
  cycleStartDate: new Date().toISOString().split('T')[0],
  
  // Cycle history
  completedCycles: [],
  
  // Current metrics
  currentMetrics: {
    protein: 0, // grams per day
    carbs: 0,   // grams per day
    calories: 0,
    fastingHours: 0,
    exerciseType: 'none', // strength, cardio, mixed, light, none
    supplementsUsed: [],
    sleep: { hours: 0, quality: 'unknown' },
    stress: 'low' // low, moderate, high
  },
  
  // Phase-specific goals
  phaseGoals: {
    growth: {
      protein: { min: 1.6, max: 2.2, unit: 'g/kg_bodyweight' },
      carbs: { min: 3, max: 5, unit: 'g/kg_bodyweight' },
      fasting: { max: 12, recommended: 0 },
      exercise: 'strength',
      supplements: ['creatine', 'leucine', 'hmb'],
      sleep: { min: 7.5, optimal: 8.5 }
    },
    maintenance: {
      protein: { min: 1.2, max: 1.6, unit: 'g/kg_bodyweight' },
      carbs: { min: 1.5, max: 3, unit: 'g/kg_bodyweight' },
      fasting: { max: 16, recommended: 14 },
      exercise: 'mixed',
      supplements: ['omega3', 'magnesium', 'vitamin_d'],
      sleep: { min: 7, optimal: 8 }
    },
    autophagy: {
      protein: { min: 0.8, max: 1.2, unit: 'g/kg_bodyweight' },
      carbs: { min: 0.5, max: 1.5, unit: 'g/kg_bodyweight' },
      fasting: { min: 16, recommended: 20, max: 36 },
      exercise: 'light',
      supplements: ['berberine', 'resveratrol', 'green_tea_extract'],
      sleep: { min: 7.5, optimal: 9 }
    }
  },
  
  // User profile
  userProfile: {
    weight: 70, // kg
    age: 30,
    gender: 'male', // male, female
    activityLevel: 'moderate', // sedentary, light, moderate, high, very_high
    goals: ['longevity', 'muscle_maintenance'], // longevity, muscle_gain, fat_loss, performance
    healthConditions: [], // diabetes, cardiovascular, autoimmune, etc.
  }
});

// =============================================================================
// DERIVED STORES
// =============================================================================

// Current phase recommendations
export const currentRecommendations = derived(mtorCycleState, ($state) => {
  const phase = $state.currentPhase;
  const goals = $state.phaseGoals[phase];
  const userWeight = $state.userProfile.weight;
  
  return {
    phase: phase,
    dayInPhase: $state.dayInPhase,
    
    // Calculated targets based on body weight
    proteinTarget: {
      min: Math.round(goals.protein.min * userWeight),
      max: Math.round(goals.protein.max * userWeight),
      unit: 'grams'
    },
    
    carbTarget: {
      min: Math.round(goals.carbs.min * userWeight),
      max: Math.round(goals.carbs.max * userWeight),
      unit: 'grams'
    },
    
    fastingWindow: goals.fasting,
    exerciseType: goals.exercise,
    supplements: goals.supplements,
    sleepTarget: goals.sleep,
    
    // Phase-specific advice
    advice: generatePhaseAdvice(phase, $state.dayInPhase),
    
    // Next phase preview
    nextPhase: getNextPhase(phase),
    daysUntilTransition: goals.length || 7 - $state.dayInPhase
  };
});

// Progress tracking for current cycle
export const cycleProgress = derived(mtorCycleState, ($state) => {
  const totalDays = Object.keys($state.phaseGoals).length * 7; // 3 phases * 7 days
  const currentDay = calculateCurrentCycleDay($state);
  
  return {
    currentDay: currentDay,
    totalDays: totalDays,
    progressPercentage: (currentDay / totalDays) * 100,
    
    // Phase progress
    phaseProgress: ($state.dayInPhase / 7) * 100,
    
    // Weekly compliance
    weeklyCompliance: calculateWeeklyCompliance($state),
    
    // Overall cycle health
    cycleHealth: calculateCycleHealth($state)
  };
});

// =============================================================================
// PHASE MANAGEMENT FUNCTIONS
// =============================================================================

export function advanceToNextDay() {
  mtorCycleState.update(state => {
    state.dayInPhase++;
    
    // Check if phase should transition
    const maxDaysInPhase = state.phaseLength;
    if (state.dayInPhase > maxDaysInPhase) {
      state.dayInPhase = 1;
      state.currentPhase = getNextPhase(state.currentPhase);
      
      // Log completed phase
      logCompletedPhase(state);
    }
    
    // Reset daily metrics
    state.currentMetrics = {
      protein: 0,
      carbs: 0,
      calories: 0,
      fastingHours: 0,
      exerciseType: 'none',
      supplementsUsed: [],
      sleep: { hours: 0, quality: 'unknown' },
      stress: 'low'
    };
    
    return state;
  });
  
  saveMtorData();
}

export function startNewCycle() {
  mtorCycleState.update(state => {
    // Save current cycle to history
    if (state.completedCycles.length === 0 || 
        state.cycleStartDate !== new Date().toISOString().split('T')[0]) {
      state.completedCycles.push({
        startDate: state.cycleStartDate,
        endDate: new Date().toISOString().split('T')[0],
        phases: ['growth', 'maintenance', 'autophagy'],
        compliance: calculateCycleCompliance(state),
        outcomes: calculateCycleOutcomes(state)
      });
    }
    
    // Reset cycle
    state.currentPhase = 'growth';
    state.dayInPhase = 1;
    state.cycleStartDate = new Date().toISOString().split('T')[0];
    
    return state;
  });
  
  saveMtorData();
}

export function updateDailyMetrics(metrics) {
  mtorCycleState.update(state => {
    state.currentMetrics = { ...state.currentMetrics, ...metrics };
    return state;
  });
  
  saveMtorData();
}

export function updateUserProfile(profile) {
  mtorCycleState.update(state => {
    state.userProfile = { ...state.userProfile, ...profile };
    return state;
  });
  
  saveMtorData();
}

// =============================================================================
// PHASE-SPECIFIC PROTOCOLS
// =============================================================================

export const PHASE_PROTOCOLS = {
  growth: {
    name: 'Growth Phase',
    duration: '7 days',
    focus: 'Muscle protein synthesis, strength, recovery',
    
    nutrition: {
      calories: 'Maintenance + 200-400',
      protein: 'High (1.6-2.2 g/kg)',
      carbs: 'Moderate-High (3-5 g/kg)',
      fats: 'Moderate (0.8-1.2 g/kg)',
      timing: 'Post-workout protein within 2 hours'
    },
    
    fasting: {
      recommended: 'None or very short (8-12 hours)',
      rationale: 'Maximize nutrient availability for growth'
    },
    
    exercise: {
      type: 'Strength training',
      frequency: '4-5 times per week',
      intensity: 'Moderate to high',
      focus: 'Progressive overload, compound movements'
    },
    
    supplements: [
      { name: 'Creatine', dose: '5g daily', timing: 'anytime' },
      { name: 'Whey Protein', dose: '25-30g', timing: 'post-workout' },
      { name: 'Leucine', dose: '2.5g', timing: 'with meals' },
      { name: 'HMB', dose: '3g daily', timing: 'with meals' },
      { name: 'Beta-Alanine', dose: '3-5g daily', timing: 'split doses' }
    ],
    
    biomarkers: {
      target: 'Elevated mTOR, increased IGF-1, higher insulin sensitivity',
      avoid: 'Excessive cortisol, inflammatory markers'
    },
    
    tips: [
      'Prioritize post-workout nutrition',
      'Ensure adequate sleep (8+ hours)',
      'Manage stress levels',
      'Stay well hydrated',
      'Focus on compound movements'
    ]
  },

  maintenance: {
    name: 'Maintenance Phase',
    duration: '7 days',
    focus: 'Metabolic flexibility, steady state, preparation',
    
    nutrition: {
      calories: 'Maintenance level',
      protein: 'Moderate (1.2-1.6 g/kg)',
      carbs: 'Moderate (1.5-3 g/kg)',
      fats: 'Moderate-High (1.0-1.5 g/kg)',
      timing: 'Flexible, listen to hunger cues'
    },
    
    fasting: {
      recommended: '14-16 hours intermittent fasting',
      rationale: 'Begin metabolic shift, maintain flexibility'
    },
    
    exercise: {
      type: 'Mixed training',
      frequency: '4-6 times per week',
      intensity: 'Moderate',
      focus: 'Cardio + strength, zone 2 cardio'
    },
    
    supplements: [
      { name: 'Omega-3', dose: '2-3g EPA+DHA', timing: 'with meals' },
      { name: 'Magnesium', dose: '400-600mg', timing: 'evening' },
      { name: 'Vitamin D3', dose: '2000-4000 IU', timing: 'morning' },
      { name: 'Probiotics', dose: '50B CFU', timing: 'empty stomach' },
      { name: 'Curcumin', dose: '500-1000mg', timing: 'with meals' }
    ],
    
    biomarkers: {
      target: 'Balanced hormones, stable glucose, good insulin sensitivity',
      monitor: 'Inflammatory markers, stress hormones'
    },
    
    tips: [
      'Practice metabolic flexibility',
      'Incorporate zone 2 cardio',
      'Focus on sleep quality',
      'Include variety in diet',
      'Manage stress effectively'
    ]
  },

  autophagy: {
    name: 'Autophagy Phase',
    duration: '7 days',
    focus: 'Cellular cleanup, longevity, metabolic reset',
    
    nutrition: {
      calories: 'Maintenance - 200-400',
      protein: 'Lower (0.8-1.2 g/kg)',
      carbs: 'Low (0.5-1.5 g/kg)',
      fats: 'High (1.5-2.0 g/kg)',
      timing: 'Time-restricted eating, longer fasts'
    },
    
    fasting: {
      recommended: '16-24 hours daily, one 36-48 hour fast',
      rationale: 'Maximize autophagy, cellular renewal'
    },
    
    exercise: {
      type: 'Light activity',
      frequency: '3-4 times per week',
      intensity: 'Low to moderate',
      focus: 'Walking, yoga, light resistance, sauna'
    },
    
    supplements: [
      { name: 'Berberine', dose: '500mg 2x', timing: 'before meals' },
      { name: 'Resveratrol', dose: '250-500mg', timing: 'evening' },
      { name: 'Green Tea Extract', dose: '400-600mg', timing: 'fasting' },
      { name: 'Spermidine', dose: '1-3mg', timing: 'morning' },
      { name: 'NAD+ Precursor', dose: 'as directed', timing: 'morning' }
    ],
    
    biomarkers: {
      target: 'Elevated autophagy markers, improved insulin sensitivity',
      benefits: 'Cellular renewal, reduced inflammation'
    },
    
    tips: [
      'Embrace the discomfort of hunger',
      'Stay busy during fasting',
      'Prioritize sleep and recovery',
      'Use sauna or cold therapy',
      'Practice stress reduction',
      'Stay hydrated with electrolytes'
    ]
  }
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

function getNextPhase(currentPhase) {
  const phases = ['growth', 'maintenance', 'autophagy'];
  const currentIndex = phases.indexOf(currentPhase);
  return phases[(currentIndex + 1) % phases.length];
}

function generatePhaseAdvice(phase, dayInPhase) {
  const protocol = PHASE_PROTOCOLS[phase];
  const advice = [];
  
  if (dayInPhase === 1) {
    advice.push(`Starting ${protocol.name}! Focus: ${protocol.focus}`);
  }
  
  if (dayInPhase <= 3) {
    advice.push('Early phase: Establish new habits and routines');
  } else if (dayInPhase >= 5) {
    advice.push('Late phase: Prepare for transition to next phase');
  }
  
  // Phase-specific advice
  switch (phase) {
    case 'growth':
      advice.push('Maximize protein intake and strength training');
      break;
    case 'maintenance':
      advice.push('Focus on metabolic flexibility and balance');
      break;
    case 'autophagy':
      advice.push('Embrace fasting and cellular renewal');
      break;
  }
  
  return advice;
}

function calculateCurrentCycleDay(state) {
  const phaseOrder = ['growth', 'maintenance', 'autophagy'];
  const currentPhaseIndex = phaseOrder.indexOf(state.currentPhase);
  return (currentPhaseIndex * 7) + state.dayInPhase;
}

function calculateWeeklyCompliance(state) {
  // This would calculate based on logged daily metrics
  // Placeholder implementation
  return {
    nutrition: 85,
    exercise: 90,
    fasting: 75,
    sleep: 80,
    supplements: 70,
    overall: 80
  };
}

function calculateCycleHealth(state) {
  // Comprehensive health scoring based on biomarkers and compliance
  // Placeholder implementation
  return {
    score: 85,
    grade: 'B+',
    trending: 'improving',
    areas_for_improvement: ['fasting consistency', 'supplement timing']
  };
}

function logCompletedPhase(state) {
  // Log phase completion for analysis
  console.log(`Completed ${state.currentPhase} phase`);
}

function calculateCycleCompliance(state) {
  // Calculate overall cycle compliance
  return 82; // Placeholder
}

function calculateCycleOutcomes(state) {
  // Calculate measurable outcomes from cycle
  return {
    weight_change: 0,
    body_composition: 'stable',
    energy_levels: 'improved',
    biomarkers: 'pending'
  };
}

// =============================================================================
// PERSISTENCE
// =============================================================================

export function saveMtorData() {
  try {
    secureStorage.secureSave('mtor_cycle_data', get(mtorCycleState));
  } catch (error) {
    console.error('Error saving mTOR data:', error);
  }
}

export function loadMtorData() {
  try {
    const saved = secureStorage.secureLoad('mtor_cycle_data');
    if (saved) {
      mtorCycleState.set(saved);
    }
  } catch (error) {
    console.error('Error loading mTOR data:', error);
  }
}

// Auto-save on changes
mtorCycleState.subscribe(() => saveMtorData());

// Initialize on load
if (typeof window !== 'undefined') {
  loadMtorData();
}

export default {
  mtorCycleState,
  currentRecommendations,
  cycleProgress,
  advanceToNextDay,
  startNewCycle,
  updateDailyMetrics,
  updateUserProfile,
  PHASE_PROTOCOLS
};