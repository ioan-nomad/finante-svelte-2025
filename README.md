# Aplicație de Management Financiar Personal cu Smart Pantry Tracker

O aplicație modernă dezvoltată în Svelte pentru gestionarea completă a finanțelor personale, cu funcții avansate de planificare bugetară și sistem inteligent de gestionare a stocului de alimente.

## 🚀 Funcționalități Principale

### 💰 Management Financiar
- **Gestionare Conturi**: Adăugare și monitorizare multiple conturi bancare
- **Tranzacții**: Înregistrare automată și manuală a veniturilor și cheltuielilor
- **Categorii Personalizabile**: Organizare tranzacții pe categorii cu icoane
- **Statistici și Rapoarte**: Analiză detaliată cu grafice interactive
- **Buget Planning**: Planificare bugetară cu alerte și notificări
- **Obiective Financiare**: Stabilire și tracking obiective de economisire
- **Rapoarte Avansate**: Filtre complexe și export date

### 🛒 Smart Pantry Tracker (NOU!)
- **Scanare Bonuri Fiscale**: Import automat bonuri PDF cu tehnologie OCR
- **Inventar Inteligent**: Tracking automat stoc produse alimentare
- **Sistem de Învățare**: AI adaptiv pentru magazine necunoscute
- **Analiză Preturi**: Istoric prețuri și identificare reduceri
- **Notificări Stoc**: Alerte pentru produse în curs de epuizare
- **Categorii Automate**: Clasificare automată produse în 9 categorii
- **Suport Multi-Magazine**: Compatibil cu 7+ lanțuri de magazine din România

## 🏪 Magazine Suportate (Smart Pantry)

- **Kaufland** - Recunoaștere completă pattern bonuri
- **Lidl** - Parser optimizat pentru format specific
- **Carrefour** - Suport complet inclusiv hipermarket
- **Mega Image** - Integrare avansată cu categorii
- **Auchan** - Parser dedicat format specific
- **Penny** - Recunoaștere automată produse
- **Profi** - Suport complet cu learning system

## 🧠 Sistem de Învățare Avansată

### Pattern Recognition
- **Algoritm ML**: Recunoaștere automată formaturi noi bonuri
- **Training Mode**: Interfață wizard pentru antrenare pattern-uri necunoscute
- **Success Rate Tracking**: Monitorizare acuratețe parsare per magazin
- **Auto-Improvement**: Optimizare continuă algoritmi recunoaștere

### Smart Categorization
- **15+ Produse Pre-definite**: Dicționar normalizare produse comune
- **9 Categorii Automate**: Lactate, Carne, Legume, Fructe, Pâine, Conserve, Băuturi, Igienă, Altele
- **Adaptive Learning**: Învățare continuă produse noi
- **Price Analytics**: Analiză trend-uri prețuri și identificare oferte

## 📊 Dashboard și Statistici

### Vizualizări Interactive
- **Grafice Chart.js**: Pie charts, line charts, bar charts
- **Filtre Avansate**: Căutare, sortare, filtrare pe multiple criterii
- **Export Functionalitate**: CSV, PDF pentru toate rapoartele
- **Real-time Updates**: Sincronizare automată date

### Mobile-First Design
- **Responsive Layout**: Optimizat pentru toate dispozitivele
- **Dark Mode**: Suport complet mod întunecat
- **Touch Gestures**: Navigare intuitivă pe mobile
- **PWA Ready**: Instalare ca aplicație nativă

## 🛠 Tehnologii și Arhitectură

### Frontend Stack
- **Svelte/SvelteKit**: Framework modern reactive
- **Chart.js**: Vizualizări grafice interactive
- **PDF.js**: Processing bonuri fiscale PDF
- **CSS Variables**: Theming dinamic și responsive design
- **LocalStorage**: Persistența datelor client-side

### Smart Features
- **Machine Learning**: Pattern recognition pentru bonuri necunoscute
- **OCR Integration**: Extracție automată text din PDF-uri
- **Regex Patterns**: Parsing complex structuri bonuri
- **Event-Driven Architecture**: Comunicare componente prin evenimente
- **State Management**: Svelte stores pentru management state global

## 🚀 Instalare și Configurare

### Cerințe de Sistem
```bash
Node.js 18+ 
npm 8+
```

### Instalare
```bash
# Clonează repository
git clone https://github.com/ioan-nomad/finante-svelte-2025.git
cd finante-svelte-2025

# Instalează dependențe
npm install

# Pornește aplicația în development
npm run dev
```

### Build Production
```bash
# Build pentru production
npm run build

# Preview build local
npm run preview
```

## 📁 Structura Proiectului

```
src/
├── components/
│   ├── ChartManager.svelte      # Manager grafice interactive
│   ├── ReceiptParser.svelte     # Smart receipt parser cu AI
│   ├── GroceryDashboard.svelte  # Dashboard inventar alimente
│   ├── EditModal.svelte         # Modal editare tranzacții
│   ├── FilterPanel.svelte       # Panel filtre avansate
│   ├── Budgeturi.svelte         # Management bugete
│   ├── Obiective.svelte         # Obiective financiare
│   ├── Reconciliere.svelte      # Reconciliere conturi
│   └── GlobalNotifications.svelte # Sistem notificări
├── stores/
│   ├── groceryStore.js          # Store Smart Pantry
│   └── store.js                 # Store principal aplicație
├── lib/                         # Utilities și helpers
└── App.svelte                   # Componenta principală
```

## 🔧 Configurări Avansate

### Smart Pantry Settings
```javascript
// Configurare praguri stoc minim
const LOW_STOCK_THRESHOLD = 2;

// Configurare categorii produse
const CATEGORIES = [
  'Lactate', 'Carne', 'Legume', 'Fructe', 
  'Pâine', 'Conserve', 'Băuturi', 'Igienă', 'Altele'
];
```

### Pattern Training
```javascript
// Adaugă pattern nou magazin
groceryStore.trainNewPattern({
  storeName: "Magazin Nou",
  totalPattern: /TOTAL:?\s*(\d+[,.]?\d*)/i,
  itemPattern: /(.+?)\s+(\d+[,.]?\d*)\s*x\s*(\d+[,.]?\d*)/g
});
```

## 🎯 Roadmap și Funcționalități Viitoare

### V2.0 - În Dezvoltare
- [ ] **Sync Cloud**: Sincronizare automată între dispozitive
- [ ] **Barcode Scanner**: Scanare coduri de bare produse
- [ ] **Shopping Lists**: Liste cumpărături inteligente
- [ ] **Meal Planning**: Planificare mese bazată pe inventar
- [ ] **Nutritional Data**: Informații nutriționale produse
- [ ] **Bulk Import**: Import masiv bonuri și tranzacții
- [ ] **API Integration**: Conectare bănci pentru import automat

### V3.0 - Long Term
- [ ] **AI Recommendations**: Sugestii economisire bazate pe ML
- [ ] **Social Features**: Partajare bugete și obiective
- [ ] **Multi-Currency**: Suport multiple valute
- [ ] **Investment Tracking**: Tracking portofoliu investiții
- [ ] **Tax Integration**: Calculare automată taxe și deduceri

## 🤝 Contribuții și Suport

### Development Guidelines
- Fork repository și creează branch pentru feature nou
- Respectă code style existent (Prettier + ESLint)
- Adaugă teste pentru funcționalități noi
- Update documentație pentru schimbări majore

### Bug Reports
Raportează bug-uri prin [GitHub Issues](https://github.com/ioan-nomad/finante-svelte-2025/issues) cu:
- Descriere detaliată problema
- Pași reproducere
- Screenshots dacă relevant
- Browser și versiune OS

## 📄 Licență

MIT License - Vezi [LICENSE](LICENSE) pentru detalii complete.

## 🏆 Recunoașteri

Dezvoltat cu ❤️ folosind:
- [Svelte](https://svelte.dev/) - Framework reactive modern
- [Chart.js](https://www.chartjs.org/) - Grafice interactive
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF processing
- [Claude Code](https://claude.ai/code) - AI development assistant

---

**💡 Pro Tip**: Folosește Smart Pantry Tracker zilnic pentru economii maxime! Aplicația învață preferințele tale și îți oferă recomendări personalizate pentru reducerea costurilor cu alimentele.

**🔗 Demo Live**: [https://finante-svelte-2025.netlify.app](https://github.com/ioan-nomad/finante-svelte-2025)

Pentru întrebări și suport: [Creează un Issue](https://github.com/ioan-nomad/finante-svelte-2025/issues/new)