/**
 * CODEX AUTHORITY SYSTEM v1.0
 * SINGURELE surse acceptate pentru orice dată nutrițională
 * ZERO TOLERANCE pentru surse externe
 */

export const CODEX_AUTHORITY = {
  version: "1.0",
  created: "2025-01-09",
  principle: "EVIDENCE-ONLY NUTRITION - NO EXCEPTIONS",
  
  // SURSE AUTORIZATE - LISTA EXHAUSTIVĂ ȘI FINALĂ
  AUTHORIZED_SOURCES: {
    
    // TIER 1: BAZE DE DATE ACADEMICE (Absolute Authority)
    academic_databases: {
      pubmed: {
        name: "PubMed/MEDLINE",
        url: "pubmed.ncbi.nlm.nih.gov",
        trust_level: 100,
        validation: "PMID required",
        access: "public"
      },
      cochrane: {
        name: "Cochrane Library",
        url: "cochranelibrary.com",
        trust_level: 100,
        validation: "Cochrane ID required",
        access: "public"
      },
      web_of_science: {
        name: "Web of Science",
        url: "webofknowledge.com",
        trust_level: 95,
        validation: "DOI required",
        access: "institutional"
      },
      scopus: {
        name: "Scopus",
        url: "scopus.com",
        trust_level: 95,
        validation: "Scopus ID required",
        access: "institutional"
      }
    },
    
    // TIER 2: INSTITUȚII OFICIALE
    official_institutions: {
      WHO: {
        name: "World Health Organization",
        url: "who.int/nutrition",
        trust_level: 100,
        domains: ["nutrition", "food_safety", "guidelines"]
      },
      FAO: {
        name: "Food and Agriculture Organization",
        url: "fao.org",
        trust_level: 95,
        domains: ["food_composition", "agriculture", "sustainability"]
      },
      EFSA: {
        name: "European Food Safety Authority",
        url: "efsa.europa.eu",
        trust_level: 95,
        domains: ["food_safety", "health_claims", "risk_assessment"]
      },
      FDA: {
        name: "U.S. Food and Drug Administration",
        url: "fda.gov",
        trust_level: 95,
        domains: ["food_safety", "regulations", "GRAS"]
      },
      NIH: {
        name: "National Institutes of Health",
        url: "nih.gov",
        trust_level: 100,
        includes: ["NCCIH", "NIA", "NIDDK", "ODS"]
      }
    },
    
    // TIER 3: UNIVERSITĂȚI ELITE
    academic_institutions: {
      harvard: {
        name: "Harvard T.H. Chan School of Public Health",
        url: "hsph.harvard.edu",
        trust_level: 95,
        departments: ["nutrition", "epidemiology"]
      },
      tufts: {
        name: "Tufts Human Nutrition Research Center",
        url: "hnrca.tufts.edu",
        trust_level: 95
      },
      johns_hopkins: {
        name: "Johns Hopkins Bloomberg School",
        url: "jhsph.edu",
        trust_level: 95
      },
      oxford: {
        name: "Oxford University Nutrition",
        url: "ox.ac.uk",
        trust_level: 95
      },
      karolinska: {
        name: "Karolinska Institute",
        url: "ki.se",
        trust_level: 95,
        note: "Nobel Prize Committee"
      }
    },
    
    // TIER 4: JURNALE ȘTIINȚIFICE (Impact Factor >8)
    scientific_journals: {
      high_impact: [
        { name: "Nature Metabolism", IF: 19.9, publisher: "Nature" },
        { name: "Cell Metabolism", IF: 31.3, publisher: "Cell Press" },
        { name: "The Lancet Diabetes & Endocrinology", IF: 44.5 },
        { name: "Annual Review of Nutrition", IF: 10.8 },
        { name: "American Journal of Clinical Nutrition", IF: 8.4 },
        { name: "Nature Medicine", IF: 82.9 },
        { name: "New England Journal of Medicine", IF: 176.0 },
        { name: "The Lancet", IF: 202.7 },
        { name: "JAMA", IF: 157.3 },
        { name: "BMJ", IF: 105.7 }
      ]
    },
    
    // TIER 5: BAZE DATE NUTRIȚIONALE OFICIALE
    nutritional_databases: {
      USDA: {
        name: "USDA FoodData Central",
        url: "fdc.nal.usda.gov",
        trust_level: 100,
        data_type: "food_composition",
        update_frequency: "continuous"
      },
      EFSA_DB: {
        name: "EFSA Food Composition Database",
        url: "efsa.europa.eu/food-consumption",
        trust_level: 95,
        data_type: "european_foods"
      },
      canada: {
        name: "Canadian Nutrient File",
        url: "canada.ca/cnf",
        trust_level: 95
      },
      australia: {
        name: "Australian Food Composition Database",
        url: "foodstandards.gov.au",
        trust_level: 95
      }
    },
    
    // TIER 6: AYURVEDA ACADEMIC
    ayurveda_validated: {
      AYUSH: {
        name: "Ministry of AYUSH India",
        url: "ayush.gov.in",
        trust_level: 85,
        validation: "Government official"
      },
      CCRAS: {
        name: "Central Council for Research in Ayurvedic Sciences",
        url: "ccras.nic.in",
        trust_level: 85
      },
      peer_reviewed_ayurveda: [
        "Journal of Ayurveda and Integrative Medicine (Elsevier)",
        "International Journal of Ayurveda Research",
        "Ancient Science of Life (PubMed indexed)",
        "AYU Journal"
      ],
      NCCIH: {
        name: "National Center for Complementary and Integrative Health",
        url: "nccih.nih.gov",
        trust_level: 90,
        note: "NIH validation of Ayurveda"
      }
    }
  },
  
  // SURSE INTERZISE EXPLICIT
  BANNED_SOURCES: [
    "Blog-uri personale",
    "Social media",
    "YouTube (exceptând canale universitare oficiale)",
    "Site-uri comerciale de suplimente",
    "Guru nutriție fără credentials",
    "Wikipedia (ca sursă primară)",
    "Forums",
    "Anecdotal evidence",
    "N=1 experiments",
    "Industrie-funded fără disclosure"
  ],
  
  // SISTEM DE VALIDARE
  VALIDATION_PROTOCOL: {
    required_for_any_claim: {
      evidence_level: "Minimum 3 RCTs sau 1 Cochrane Review",
      source_citation: "Obligatoriu PMID/DOI",
      recency: "Prefer <5 ani, max 10 ani pentru date stabile",
      conflict_disclosure: "Mandatory check"
    },
    
    data_hierarchy: {
      1: "Cochrane Systematic Reviews",
      2: "Meta-analyses din jurnale IF>10",
      3: "RCTs mari (n>500)",
      4: "RCTs mici (n>100)",
      5: "Cohort studies (n>1000)",
      6: "REJECTED: Observational <1000, Case studies, Opinion"
    }
  },
  
  // ENFORCEMENT FUNCTION
  validateSource: function(source, data_type) {
    // Verifică dacă sursa este autorizată
    const authorized = this.checkAuthorization(source);
    if (!authorized) {
      throw new Error(`BLOCKED: "${source}" is NOT an authorized source. Only official sources allowed.`);
    }
    
    // Verifică citation
    if (!this.hasCitation(source)) {
      throw new Error(`BLOCKED: No PMID/DOI citation for claim. Citation required.`);
    }
    
    // Logging pentru audit trail
    console.log(`✓ VALIDATED: ${source.name} | Type: ${data_type} | Citation: ${source.citation}`);
    return true;
  },
  
  checkAuthorization: function(source) {
    // Verifică în toate categoriile autorizate
    const allAuthorized = [
      ...Object.keys(this.AUTHORIZED_SOURCES.academic_databases),
      ...Object.keys(this.AUTHORIZED_SOURCES.official_institutions),
      ...Object.keys(this.AUTHORIZED_SOURCES.academic_institutions),
      ...Object.keys(this.AUTHORIZED_SOURCES.nutritional_databases),
      ...Object.keys(this.AUTHORIZED_SOURCES.ayurveda_validated)
    ];
    
    return allAuthorized.some(auth => 
      source.toLowerCase().includes(auth.toLowerCase())
    );
  },
  
  hasCitation: function(source) {
    // Verifică PMID (8 digits) sau DOI pattern
    const pmidPattern = /PMID:?\s*\d{7,9}/i;
    const doiPattern = /DOI:?\s*10\.\d+\/[\w\-\.]+/i;
    const cochranePattern = /CD\d{6}/;
    
    return pmidPattern.test(source.citation) || 
           doiPattern.test(source.citation) || 
           cochranePattern.test(source.citation);
  }
};

// ENFORCEMENT GLOBAL
export function enforceAuthority(dataPoint) {
  if (!dataPoint.source || !dataPoint.citation) {
    throw new Error("BLOCKED: Every data point MUST have source and citation");
  }
  
  return CODEX_AUTHORITY.validateSource(dataPoint.source, dataPoint.type);
}

export default CODEX_AUTHORITY;