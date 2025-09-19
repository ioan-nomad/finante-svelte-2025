export function populateDemoData() {
  // Check if demo data already exists
  if (localStorage.getItem('demoDataLoaded')) {
    return;
  }

  // Finance Module Demo Data
  const accounts = [
    {
      id: 1,
      name: "Cont Principal RON",
      type: "Curent",
      currency: "RON",
      balance: 12500.50,
      bank: "BRD",
      number: "RO89BRDE440SV12345678901",
      isActive: true
    },
    {
      id: 2,
      name: "Economii EUR",
      type: "Economii",
      currency: "EUR",
      balance: 3200.00,
      bank: "BCR",
      number: "RO49RNCB0082123456789012",
      isActive: true
    },
    {
      id: 3,
      name: "Card de Credit",
      type: "Credit",
      currency: "RON",
      balance: -850.25,
      bank: "ING",
      number: "RO60INGB0000999901234567",
      isActive: true
    },
    {
      id: 4,
      name: "Fond Urgențe",
      type: "Economii",
      currency: "RON",
      balance: 8500.00,
      bank: "Raiffeisen",
      number: "RO12RZBR0000060012345678",
      isActive: true
    }
  ];

  const transactions = [
    // September 2025 transactions
    { id: 1, accountId: 1, date: "2025-09-01", description: "Salariu", category: "Venit", amount: 5500.00, type: "income" },
    { id: 2, accountId: 1, date: "2025-09-02", description: "Kaufland - cumpărături", category: "Alimente", amount: -287.45, type: "expense" },
    { id: 3, accountId: 1, date: "2025-09-03", description: "Rompetrol - combustibil", category: "Transport", amount: -185.60, type: "expense" },
    { id: 4, accountId: 1, date: "2025-09-05", description: "Netflix abonament", category: "Divertisment", amount: -29.99, type: "expense" },
    { id: 5, accountId: 1, date: "2025-09-07", description: "Mega Image", category: "Alimente", amount: -145.20, type: "expense" },
    { id: 6, accountId: 1, date: "2025-09-08", description: "Emag - electronice", category: "Shopping", amount: -1250.00, type: "expense" },
    { id: 7, accountId: 1, date: "2025-09-10", description: "Transfer în economii", category: "Transfer", amount: -1000.00, type: "transfer" },
    { id: 8, accountId: 4, date: "2025-09-10", description: "Transfer din cont principal", category: "Transfer", amount: 1000.00, type: "transfer" },
    { id: 9, accountId: 1, date: "2025-09-12", description: "Lidl - cumpărături", category: "Alimente", amount: -98.75, type: "expense" },
    { id: 10, accountId: 1, date: "2025-09-13", description: "Farmacia Tei", category: "Sănătate", amount: -67.50, type: "expense" },
    { id: 11, accountId: 1, date: "2025-09-15", description: "Chirie", category: "Locuință", amount: -1800.00, type: "expense" },
    { id: 12, accountId: 1, date: "2025-09-15", description: "Factură electricitate", category: "Utilități", amount: -125.80, type: "expense" },
    { id: 13, accountId: 1, date: "2025-09-16", description: "Factură gaz", category: "Utilități", amount: -89.30, type: "expense" },
    { id: 14, accountId: 1, date: "2025-09-17", description: "Internet + TV", category: "Utilități", amount: -85.00, type: "expense" },
    { id: 15, accountId: 1, date: "2025-09-18", description: "Carrefour", category: "Alimente", amount: -234.60, type: "expense" },
    { id: 16, accountId: 1, date: "2025-09-19", description: "Bonus performanță", category: "Venit", amount: 800.00, type: "income" },
    { id: 17, accountId: 3, date: "2025-09-20", description: "Restaurant Crama Domnească", category: "Restaurante", amount: -156.00, type: "expense" },
    { id: 18, accountId: 1, date: "2025-09-21", description: "Benzinărie Petrom", category: "Transport", amount: -178.40, type: "expense" },
    { id: 19, accountId: 1, date: "2025-09-22", description: "Profi - cumpărături", category: "Alimente", amount: -76.30, type: "expense" },
    { id: 20, accountId: 1, date: "2025-09-23", description: "Spotify Premium", category: "Divertisment", amount: -19.99, type: "expense" },
    { id: 21, accountId: 2, date: "2025-09-24", description: "Dobândă cont economii", category: "Venit", amount: 45.20, type: "income" },
    { id: 22, accountId: 1, date: "2025-09-25", description: "Auchan - cumpărături mari", category: "Alimente", amount: -345.80, type: "expense" },
    { id: 23, accountId: 1, date: "2025-09-26", description: "Medicul de familie", category: "Sănătate", amount: -150.00, type: "expense" },
    { id: 24, accountId: 1, date: "2025-09-27", description: "Cinema Băneasa", category: "Divertisment", amount: -65.00, type: "expense" },
    { id: 25, accountId: 1, date: "2025-09-28", description: "Penny Market", category: "Alimente", amount: -89.45, type: "expense" },
    { id: 26, accountId: 1, date: "2025-09-29", description: "Uber - transport", category: "Transport", amount: -35.50, type: "expense" },
    { id: 27, accountId: 3, date: "2025-09-30", description: "Rambursare card credit", category: "Plată", amount: 500.00, type: "income" },
    { id: 28, accountId: 1, date: "2025-09-30", description: "Plată card credit", category: "Plată", amount: -500.00, type: "expense" },
    { id: 29, accountId: 2, date: "2025-09-15", description: "Transfer EUR pentru vacanță", category: "Transfer", amount: 200.00, type: "transfer" },
    { id: 30, accountId: 1, date: "2025-09-15", description: "Schimb valutar EUR", category: "Transfer", amount: -990.00, type: "transfer" }
  ];

  const budgets = [
    { id: 1, category: "Alimente", budget: 1200.00, spent: 1277.55, month: "2025-09" },
    { id: 2, category: "Transport", budget: 500.00, spent: 399.50, month: "2025-09" },
    { id: 3, category: "Utilități", budget: 350.00, spent: 300.10, month: "2025-09" },
    { id: 4, category: "Divertisment", budget: 200.00, spent: 114.98, month: "2025-09" },
    { id: 5, category: "Sănătate", budget: 300.00, spent: 217.50, month: "2025-09" },
    { id: 6, category: "Shopping", budget: 1000.00, spent: 1250.00, month: "2025-09" }
  ];

  const goals = [
    {
      id: 1,
      name: "Vacanță Italia 2026",
      targetAmount: 8000.00,
      currentAmount: 2100.00,
      deadline: "2026-07-01",
      category: "Vacanțe"
    },
    {
      id: 2,
      name: "Fond Urgențe",
      targetAmount: 15000.00,
      currentAmount: 8500.00,
      deadline: "2025-12-31",
      category: "Siguranță"
    },
    {
      id: 3,
      name: "Laptop nou MacBook",
      targetAmount: 12000.00,
      currentAmount: 4500.00,
      deadline: "2026-03-01",
      category: "Tehnologie"
    }
  ];

  const recurringPayments = [
    { id: 1, name: "Chirie", amount: 1800.00, frequency: "Lunar", nextDate: "2025-10-15", category: "Locuință", accountId: 1 },
    { id: 2, name: "Netflix", amount: 29.99, frequency: "Lunar", nextDate: "2025-10-05", category: "Divertisment", accountId: 1 },
    { id: 3, name: "Spotify", amount: 19.99, frequency: "Lunar", nextDate: "2025-10-23", category: "Divertisment", accountId: 1 },
    { id: 4, name: "Asigurare auto", amount: 450.00, frequency: "Trimestrial", nextDate: "2025-12-01", category: "Asigurări", accountId: 1 },
    { id: 5, name: "Abonament sală", amount: 120.00, frequency: "Lunar", nextDate: "2025-10-10", category: "Sport", accountId: 1 }
  ];

  // Pantry Module Demo Data
  const pantryItems = [
    { id: 1, name: "Lapte Zuzu 3.5%", category: "Lactate", quantity: 2, unit: "bucăți", expiryDate: "2025-09-25", location: "Frigider", price: 6.50 },
    { id: 2, name: "Pâine integrală", category: "Panificație", quantity: 1, unit: "bucată", expiryDate: "2025-09-22", location: "Cămară", price: 4.20 },
    { id: 3, name: "Ouă mari", category: "Lactate", quantity: 10, unit: "bucăți", expiryDate: "2025-10-05", location: "Frigider", price: 12.50 },
    { id: 4, name: "Roșii cherry", category: "Legume", quantity: 500, unit: "grame", expiryDate: "2025-09-28", location: "Frigider", price: 8.90 },
    { id: 5, name: "Paste integrale Barilla", category: "Cereale", quantity: 2, unit: "pachete", expiryDate: "2026-08-15", location: "Cămară", price: 9.80 },
    { id: 6, name: "Ulei de măsline", category: "Condimente", quantity: 1, unit: "sticlă", expiryDate: "2026-12-20", location: "Cămară", price: 18.50 },
    { id: 7, name: "Brânză telemea", category: "Lactate", quantity: 300, unit: "grame", expiryDate: "2025-10-01", location: "Frigider", price: 15.60 },
    { id: 8, name: "Mere Golden", category: "Fructe", quantity: 1, unit: "kg", expiryDate: "2025-10-10", location: "Frigider", price: 5.40 },
    { id: 9, name: "Somon afumat", category: "Pește", quantity: 150, unit: "grame", expiryDate: "2025-09-30", location: "Frigider", price: 28.90 },
    { id: 10, name: "Quinoa", category: "Cereale", quantity: 500, unit: "grame", expiryDate: "2026-06-15", location: "Cămară", price: 22.40 }
  ];

  const shoppingList = [
    { id: 1, name: "Avocado", category: "Fructe", quantity: 3, unit: "bucăți", priority: "Medie", estimated_price: 12.00 },
    { id: 2, name: "Iaurt grecesc", category: "Lactate", quantity: 2, unit: "bucăți", priority: "Ridicată", estimated_price: 8.50 },
    { id: 3, name: "Spanac proaspăt", category: "Legume", quantity: 250, unit: "grame", priority: "Ridicată", estimated_price: 4.20 },
    { id: 4, name: "Salmone proaspăt", category: "Pește", quantity: 400, unit: "grame", priority: "Medie", estimated_price: 35.00 },
    { id: 5, name: "Nuci", category: "Semințe", quantity: 200, unit: "grame", priority: "Scăzută", estimated_price: 18.00 }
  ];

  // Nutrition Module Demo Data
  const mealPlan = {
    "2025-09-23": {
      breakfast: { name: "Omletă cu spanac și avocado", calories: 420, protein: 28, carbs: 12, fat: 32 },
      lunch: { name: "Salată de quinoa cu somon", calories: 580, protein: 35, carbs: 45, fat: 28 },
      dinner: { name: "Pui la grătar cu legume", calories: 490, protein: 42, carbs: 18, fat: 26 },
      snacks: { name: "Nuci și mere", calories: 250, protein: 6, carbs: 28, fat: 14 }
    },
    "2025-09-24": {
      breakfast: { name: "Iaurt grecesc cu fructe de pădure", calories: 380, protein: 25, carbs: 35, fat: 18 },
      lunch: { name: "Supă de linte cu legume", calories: 420, protein: 22, carbs: 65, fat: 8 },
      dinner: { name: "Somon cu broccoli și quinoa", calories: 620, protein: 45, carbs: 38, fat: 32 },
      snacks: { name: "Hummus cu ardei", calories: 180, protein: 8, carbs: 20, fat: 9 }
    },
    "2025-09-25": {
      breakfast: { name: "Smoothie proteic verde", calories: 350, protein: 30, carbs: 25, fat: 16 },
      lunch: { name: "Poke bowl cu ton", calories: 540, protein: 38, carbs: 42, fat: 24 },
      dinner: { name: "Friptură de vită cu salată", calories: 580, protein: 48, carbs: 15, fat: 35 },
      snacks: { name: "Migdale și banană", calories: 280, protein: 8, carbs: 32, fat: 16 }
    },
    "2025-09-26": {
      breakfast: { name: "Ovăz cu proteine și fructe", calories: 410, protein: 26, carbs: 48, fat: 12 },
      lunch: { name: "Salată Caesar cu pui", calories: 520, protein: 40, carbs: 18, fat: 32 },
      dinner: { name: "Paste integrale cu creveți", calories: 560, protein: 35, carbs: 55, fat: 22 },
      snacks: { name: "Iaurt cu semințe", calories: 200, protein: 12, carbs: 15, fat: 10 }
    },
    "2025-09-27": {
      breakfast: { name: "Sandviș cu avocado și ou", calories: 390, protein: 18, carbs: 28, fat: 24 },
      lunch: { name: "Ciorbă de pui cu legume", calories: 380, protein: 32, carbs: 25, fat: 16 },
      dinner: { name: "Cod cu quinoa și asparagus", calories: 480, protein: 42, carbs: 35, fat: 18 },
      snacks: { name: "Smoothie cu proteine", calories: 220, protein: 20, carbs: 18, fat: 8 }
    },
    "2025-09-28": {
      breakfast: { name: "Clătite proteice cu fructe", calories: 450, protein: 28, carbs: 38, fat: 20 },
      lunch: { name: "Wrap cu curcan și legume", calories: 480, protein: 35, carbs: 42, fat: 18 },
      dinner: { name: "Salmone cu sparanghel", calories: 520, protein: 40, carbs: 12, fat: 34 },
      snacks: { name: "Mere cu unt de migdale", calories: 240, protein: 6, carbs: 28, fat: 12 }
    },
    "2025-09-29": {
      breakfast: { name: "Bowlă de açaí cu granola", calories: 420, protein: 15, carbs: 58, fat: 16 },
      lunch: { name: "Salată de ton cu fasole", calories: 460, protein: 38, carbs: 32, fat: 20 },
      dinner: { name: "Pui tandoori cu orez brun", calories: 590, protein: 45, carbs: 48, fat: 24 },
      snacks: { name: "Fulgi de ovăz cu lapte", calories: 190, protein: 8, carbs: 28, fat: 6 }
    }
  };

  const recipes = [
    {
      id: 1,
      name: "Salmone cu quinoa și asparagus",
      ingredients: ["200g salmone", "100g quinoa", "150g asparagus", "1 lingură ulei măsline", "sare, piper"],
      instructions: "1. Fierbe quinoa. 2. Prăjește salmonul. 3. Aburi asparagusul. 4. Servește împreună.",
      calories: 520,
      protein: 40,
      carbs: 35,
      fat: 22,
      cookingTime: 25,
      difficulty: "Ușor"
    },
    {
      id: 2,
      name: "Omletă cu spanac și avocado",
      ingredients: ["3 ouă", "50g spanac", "1/2 avocado", "1 lingură unt", "sare, piper"],
      instructions: "1. Bate ouăle. 2. Călește spanacul. 3. Fă omletă. 4. Adaugă avocado.",
      calories: 420,
      protein: 28,
      carbs: 12,
      fat: 32,
      cookingTime: 10,
      difficulty: "Foarte ușor"
    },
    {
      id: 3,
      name: "Smoothie proteic verde",
      ingredients: ["1 banană", "50g spanac", "30g proteină", "200ml lapte migdale", "1 lingură miere"],
      instructions: "1. Mixează toate ingredientele. 2. Servește rece.",
      calories: 350,
      protein: 30,
      carbs: 25,
      fat: 16,
      cookingTime: 5,
      difficulty: "Foarte ușor"
    }
  ];

  const mTORTracking = {
    "2025-09-23": { protein: 105, leucine: 8.2, carbs_post_workout: 45, fasting_window: 16, score: 85 },
    "2025-09-24": { protein: 95, leucine: 7.8, carbs_post_workout: 0, fasting_window: 14, score: 78 },
    "2025-09-25": { protein: 118, leucine: 9.1, carbs_post_workout: 50, fasting_window: 16, score: 92 },
    "2025-09-26": { protein: 102, leucine: 8.0, carbs_post_workout: 35, fasting_window: 15, score: 82 },
    "2025-09-27": { protein: 88, leucine: 6.9, carbs_post_workout: 0, fasting_window: 18, score: 75 },
    "2025-09-28": { protein: 124, leucine: 9.5, carbs_post_workout: 48, fasting_window: 16, score: 95 },
    "2025-09-29": { protein: 96, leucine: 7.5, carbs_post_workout: 42, fasting_window: 14, score: 79 }
  };

  // Save all data to localStorage
  localStorage.setItem('accounts', JSON.stringify(accounts));
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budgets', JSON.stringify(budgets));
  localStorage.setItem('goals', JSON.stringify(goals));
  localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));

  localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
  localStorage.setItem('shoppingList', JSON.stringify(shoppingList));

  localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
  localStorage.setItem('recipes', JSON.stringify(recipes));
  localStorage.setItem('mTORTracking', JSON.stringify(mTORTracking));

  // Mark demo data as loaded
  localStorage.setItem('demoDataLoaded', 'true');

  console.log('✅ Demo data loaded successfully for all modules!');
}