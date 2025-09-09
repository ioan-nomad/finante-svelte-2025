# TODO PRIORITY - N-OMAD SUITE
## Pași exacti pentru finalizare completă

---

## 🔴 URGENT - 0-2 ORE

### 1. FIX IMPORT DEPENDENCIES
**Timp: 30 minute**
```javascript
// Verifică în browser console dacă apar erori:
// Failed to resolve module './codex/SmartRecipeGenerator.js'
// Failed to resolve module './components/SmartRecipeDisplay.svelte'

TASK:
□ Deschide Chrome DevTools (F12)
□ Navighează la Nutrition → Recipes tab
□ Verifică Console pentru erori de import
□ Dacă erori, fixează în ordine:
   - SmartRecipeGenerator.js imports
   - SmartRecipeDisplay.svelte imports  
   - NutritionModule.svelte imports
```

### 2. TEST RECIPE GENERATOR LIVE
**Timp: 45 minute**
```javascript
// Test în browser:
TASK:
□ Mergi la localhost:5174
□ Click pe Nutrition tab
□ Click pe Recipes sub-tab
□ Verifică dacă SmartRecipeDisplay se încarcă
□ Dacă da, testează butonul "Generează Rețetă"
□ Verifică output-ul în UI
□ Dacă crash, check Console pentru detalii
```

### 3. VERIFICĂ PANTRY CONNECTION
**Timp: 15 minute**
```javascript
// Quick test:
TASK:
□ Mergi la Pantry tab
□ Adaugă 2-3 produse în inventory
□ Mergi la Nutrition → Recipes  
□ Verifică dacă produsele apar în "Din pantry" tags
□ Dacă nu, problema e în groceryInventory store connection
```

---

## 🟠 HIGH PRIORITY - 2-4 ORE

### 4. SHOPPING LIST EXPORT FUNCTIONAL
**Timp: 1 oră**
```javascript
// În MealPlanner.svelte:
LOCATION: src/modules/nutrition/components/MealPlanner.svelte:380-390

CURRENT ISSUE:
function exportShoppingList() {
  // Probabil returnează undefined sau empty array
}

FIX NEEDED:
□ Implementează logic real de export
□ Colectează ingredients din planned meals
□ Formatează pentru grocery shopping
□ Adaugă quantities și categories
□ Test download/copy functionality
```

### 5. BIOMARKER TRACKING ACCURACY
**Timp: 1.5 ore**
```javascript
// În NutritionAnalyzer.js și BiomarkerTracking.svelte:
LOCATION: src/modules/nutrition/analysis/NutritionAnalyzer.js:45-60

VERIFY:
□ IGF-1 range: 80-120 ng/mL (CORECT)
□ hs-CRP range: <1.0 mg/L (CORECT)  
□ HbA1c range: 4.5-5.5% (CORECT)
□ Vitamin D: 40-60 ng/mL (CORECT)

TEST:
□ Adaugă valori test în BiomarkerTracking
□ Verifică calculul scorurilor
□ Validează recommendations generate
```

### 6. MTOR AUTOMATION COMPLETE
**Timp: 1.5 ore**
```javascript
// În mtorTracker.js:
LOCATION: src/modules/nutrition/mtor/mtorTracker.js:85-120

CURRENT: Manual reset la 14 zile
NEEDED: Automatic cycling

FIX:
□ Adaugă setInterval pentru daily check
□ Auto-reset cycle la day 15
□ Update currentPhase automatic
□ Notification system pentru phase change
□ Store cycle history pentru trends
```

---

## 🟡 MEDIUM PRIORITY - 4-6 ORE

### 7. RECIPE OUTPUT ENHANCEMENT
**Timp: 2 ore**
```javascript
// Îmbunătățește SmartRecipeDisplay.svelte output:

ADD FEATURES:
□ Serving size calculator (1-4 persons)
□ Macros breakdown pie chart
□ Cooking difficulty rating (1-5)
□ Prep time vs cooking time separation
□ Alternative ingredients suggestions
□ Nutritional score visualization
```

### 8. PANTRY EXPIRY TRACKING
**Timp: 1.5 ore**
```javascript
// În pantryStore.js:
LOCATION: src/modules/pantry/stores/pantryStore.js

ADD:
□ Expiry date tracking pentru fiecare item
□ Auto-remove expired items
□ Priority usage pentru items aproape expired
□ Notifications pentru expiry warnings
□ Integration cu Recipe Generator (use expiring first)
```

### 9. PLANT DIVERSITY GAMIFICATION
**Timp: 2.5 ore**
```javascript
// În plantDiversityTracker.js:
LOCATION: src/modules/nutrition/plants/plantDiversityTracker.js

ENHANCE:
□ Visual progress bar (0-30 species)
□ Achievement system (badges)
□ Weekly challenges
□ Plant variety recommendations
□ Photo upload pentru plant tracking
□ Social sharing features
```

---

## 🟢 LOW PRIORITY - 6+ ORE

### 10. ADVANCED ANALYTICS
**Timp: 3 ore**
```javascript
// Advanced nutrition analytics:

CREATE:
□ 30-day nutrition trends
□ Deficiency prediction algorithm
□ Seasonal eating recommendations
□ Cost optimization pentru nutrition
□ Integration cu fitness trackers
□ AI-powered meal suggestions
```

### 11. MEDICAL EXPORT SYSTEM
**Timp: 4 ore**
```javascript
// Pentru medical professionals:

IMPLEMENT:
□ PDF report generation
□ Lab results import/export
□ Medical history integration
□ Doctor sharing functionality
□ GDPR compliance pentru health data
□ Encrypted data transmission
```

### 12. ADVANCED COOKING FEATURES
**Timp: 3 ore**
```javascript
// Beyond Instant Pot:

ADD:
□ Air fryer cooking methods
□ Slow cooker adaptations
□ Oven temperature conversions
□ Batch cooking optimization
□ Meal prep scheduling
□ Kitchen equipment recommendations
```

---

## 📊 ESTIMATION TOTALS

### TIME TO 100% FUNCTIONAL:
- **Urgent fixes**: 2 ore → 95% functional
- **High priority**: +4 ore → 98% functional  
- **Medium priority**: +6 ore → 100% functional + enhancements

### DEVELOPMENT PHASES:
```
Phase 1 (2 ore):   Fix critical bugs → Ready for beta testing
Phase 2 (+4 ore):  Core features complete → Ready for medical review
Phase 3 (+6 ore):  Full feature set → Ready for production
```

### TESTING CHECKPOINTS:
```
After cada URGENT task:
□ Test în browser cu real usage
□ Check console pentru erori
□ Verify key user flows

After cada HIGH PRIORITY task:
□ Test complete nutrition workflow
□ Verify medical accuracy
□ Check mobile responsiveness

After cada MEDIUM PRIORITY task:  
□ Performance testing
□ User experience testing
□ Cross-browser compatibility
```

---

## 🎯 SUCCESS METRICS

### FUNCTIONAL REQUIREMENTS:
```
✅ User can generate personalized OMAD recipes
✅ Recipes target specific nutritional deficiencies
✅ Pantry integration reduces food waste
✅ Instant Pot instructions are scientifically accurate
✅ Shopping lists export properly
✅ mTOR cycling is automated and medically sound
✅ Plant diversity tracking motivates healthy choices
✅ Biomarker correlation provides actionable insights
```

### MEDICAL VALIDATION:
```
✅ DRI calculations match medical standards
✅ BMR/TDEE formulas are age/gender adjusted
✅ Allergy tracking prevents dangerous recommendations
✅ Nutrient targets are OMAD-optimized
✅ Anti-inflammatory scoring is evidence-based
✅ Longevity recommendations match research
```

### TECHNICAL EXCELLENCE:
```
✅ No runtime errors în production
✅ Mobile-responsive design
✅ Fast loading times (<2s)
✅ Accessible design (WCAG compliance)
✅ Secure data handling
✅ Offline functionality pentru core features
```

---

**CONCLUZIE: Cu 2 ore de debugging urgent, sistemul devine 95% funcțional și ready pentru beta testing. Cu 6 ore total, devine un produs commercial-grade pentru nutrition optimization.**