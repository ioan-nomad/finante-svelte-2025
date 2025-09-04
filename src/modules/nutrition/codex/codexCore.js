/**
 * CODEX Core v2.0 - Evidence-Based Nutrition System
 * All values from peer-reviewed sources only
 */

export const CODEX_PRINCIPLES = {
  version: "2.0",
  lastUpdated: "2024-12-03",
  
  foundations: {
    LONGEVITY: {
      biomarkers: ["mTOR", "AMPK", "IGF-1", "Sirtuins"],
      targets: {
        "mTOR": "Pulsatile activation",
        "AMPK": "Upregulated",
        "IGF-1": "70-120 ng/mL"
      },
      pmid: "28388417"
    },
    
    INFLAMMATION: {
      biomarkers: ["hs-CRP", "IL-6", "TNF-α"],
      targets: {
        "hs-CRP": "<1.0 mg/L",
        "IL-6": "<1.5 pg/mL",
        "TNF-α": "<8.1 pg/mL"
      },
      pmid: "32706533"
    },
    
    METABOLIC: {
      markers: ["HOMA-IR", "HbA1c", "TG/HDL"],
      targets: {
        "HOMA-IR": "<1.0",
        "HbA1c": "<5.4%",
        "TG/HDL": "<2.0"
      },
      pmid: "28768170"
    }
  },
  
  rules: {
    fasting: { window: "16-20h", pmid: "27304504" },
    plants: { minimum: 30, pmid: "29795809" },
    fiber: { grams: "35-45", pmid: "30638909" }
  }
};

export default CODEX_PRINCIPLES;
