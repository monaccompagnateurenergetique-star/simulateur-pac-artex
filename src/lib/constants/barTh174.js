// Valeurs Cef conventionnelles par classe DPE (kWhEF/m².an)
export const CEF_VALUES = {
  A: 50,
  B: 90,
  C: 150,
  D: 230,
  E: 330,
  F: 420,
  G: 510,
}

export const BAR_TH_174 = {
  code: 'BAR-TH-174',
  title: 'Rénovation globale d\'une maison individuelle',
  description: 'Calcul CEE pour une rénovation d\'ampleur d\'une maison individuelle',

  CEF_VALUES,

  ENERGY_CLASSES: [
    { value: 'G', label: 'G (≥ 420 kWh/m².an)' },
    { value: 'F', label: 'F (331-420 kWh/m².an)' },
    { value: 'E', label: 'E (231-330 kWh/m².an)' },
    { value: 'D', label: 'D (151-230 kWh/m².an)' },
    { value: 'C', label: 'C (91-150 kWh/m².an)' },
    { value: 'B', label: 'B (51-90 kWh/m².an)' },
  ],

  TARGET_CLASSES: [
    { value: 'A', label: 'A (≤ 50 kWh/m².an)' },
    { value: 'B', label: 'B (51-90 kWh/m².an)' },
    { value: 'C', label: 'C (91-150 kWh/m².an)' },
    { value: 'D', label: 'D (151-230 kWh/m².an)' },
  ],

  WORK_CATEGORIES: [
    { value: 'murs_iti', label: 'Isolation des murs (ITI)' },
    { value: 'murs_ite', label: 'Isolation des murs (ITE)' },
    { value: 'plancher', label: 'Isolation du plancher bas' },
    { value: 'combles', label: 'Isolation des combles/toiture' },
    { value: 'toiture_terrasse', label: 'Isolation toiture-terrasse' },
  ],

  MIN_CLASS_JUMP: 2,
  CONVENTIONAL_LIFESPAN: 30, // years

}
