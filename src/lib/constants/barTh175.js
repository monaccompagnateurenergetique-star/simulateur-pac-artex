import { CEF_VALUES } from './barTh174'

export const BAR_TH_175 = {
  code: 'BAR-TH-175',
  title: 'Rénovation globale d\'un appartement',
  description: 'Calcul CEE pour une rénovation d\'ampleur d\'un appartement en copropriété',

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
    { value: 'combles', label: 'Isolation des combles' },
  ],

  MIN_CLASS_JUMP: 2,
  CONVENTIONAL_LIFESPAN: 30,

}
