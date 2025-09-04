/**
 * Authoritative Sources Only
 */

export const CODEX_SOURCES = {
  tier1_academic: [
    "PubMed/MEDLINE",
    "Cochrane Reviews",
    "Nature",
    "Cell",
    "The Lancet",
    "NEJM",
    "BMJ"
  ],
  
  tier2_traditional: [
    "Charaka Samhita (600 BCE)",
    "Sushruta Samhita (600 BCE)",
    "WHO Traditional Medicine",
    "AYUSH Ministry India"
  ],
  
  tier3_culinary: [
    "Larousse Gastronomique 2024",
    "Harold McGee - On Food and Cooking",
    "CIA Professional Chef",
    "Institut Paul Bocuse"
  ]
};

export function validateSource(reference) {
  return reference.pmid || 
         reference.doi || 
         reference.isbn || 
         reference.traditionalText;
}
