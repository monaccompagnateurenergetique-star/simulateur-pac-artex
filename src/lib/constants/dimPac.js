/* ════════════════════════════════════════════════════════
   DIM-PAC — Dimensionnement puissance PAC air/eau
   Méthode G pondérée par poste d'isolation
   Conforme Guide CEE BAR-TH-171 (10/2025)
   ════════════════════════════════════════════════════════ */

export const PAC_SIZING = {
  /** Réduction G pour appartement (moins de surfaces exposées) */
  APARTMENT_G_REDUCTION: 0.80,

  /** Hauteur sous plafond par défaut (m) */
  DEFAULT_CEILING_HEIGHT: 2.5,

  /** Température intérieure de confort (°C, norme FR) */
  DEFAULT_INDOOR_TEMP: 19,

  /** Correction altitude : +1°C de perte par tranche de 200 m */
  ALTITUDE_CORRECTION_PER_200M: 1.0,

  /** Puissance ECS moyenne pour PAC air/eau (kW) */
  ECS_POWER_KW: 3.5,

  /** Marge de sécurité (15%) */
  SAFETY_MARGIN: 0.15,

  /** G effectif minimum (plancher physique RE2020) */
  G_MIN: 0.45,

  /** Seuils de couverture BAR-TH-171 */
  MIN_COVERAGE: 0.60,    // < 60% → sous-dimensionnée
  MAX_COVERAGE: 1.30,    // > 130% → surdimensionnée

  /** ETAS mini requis selon application */
  ETAS_BT_REQUIRED: 1.26,  // Basse T° (35°C)
  ETAS_HT_REQUIRED: 1.11,  // Moyenne/Haute T° (55°C)

  /** G de base par période de construction (W/m³·K) — icônes Lucide */
  CONSTRUCTION_PERIODS: [
    { value: 'avant_1975', label: 'Avant 1975',     subLabel: 'Construction ancienne',         gBase: 1.8, intermittence: 1.20, iconName: 'HousePlus' },
    { value: '1975_1982',  label: '1975 – 1982',    subLabel: 'RT 1974 (1ère réglementation)',  gBase: 1.6, intermittence: 1.20, iconName: 'Home' },
    { value: '1983_1988',  label: '1983 – 1988',    subLabel: 'RT 1982',                       gBase: 1.4, intermittence: 1.15, iconName: 'Castle' },
    { value: '1989_2000',  label: '1989 – 2000',    subLabel: 'RT 1988',                       gBase: 1.2, intermittence: 1.15, iconName: 'Warehouse' },
    { value: '2001_2005',  label: '2001 – 2005',    subLabel: 'RT 2000',                       gBase: 1.0, intermittence: 1.15, iconName: 'Factory' },
    { value: '2006_2009',  label: '2006 – 2009',    subLabel: 'RT 2005',                       gBase: 0.9, intermittence: 1.10, iconName: 'Building' },
    { value: '2010_2012',  label: '2010 – 2012',    subLabel: 'RT 2005 renforcée',             gBase: 0.8, intermittence: 1.10, iconName: 'Building2' },
    { value: 'apres_2013', label: 'Après 2013',     subLabel: 'RT 2012',                       gBase: 0.6, intermittence: 1.10, iconName: 'Leaf' },
    { value: 'neuf',       label: 'Moins de 2 ans', subLabel: 'RE 2020',                       gBase: 0.5, intermittence: 1.10, iconName: 'Sprout' },
  ],

  /** Catégories d'isolation avec parts des déperditions et niveaux */
  INSULATION_CATEGORIES: [
    {
      key: 'toiture',
      label: 'Toiture / Combles',
      iconName: 'Triangle',
      color: '#ef4444',
      share: 0.25,
      defaultValue: 'moyenne',
      levels: [
        { value: 'aucune',    label: 'Aucune',           subLabel: 'Pas d’isolant',                ratio: 1.5 },
        { value: 'faible',    label: 'Faible',           subLabel: '≈ 8 cm laine de verre',        ratio: 1.2 },
        { value: 'moyenne',   label: 'Moyenne',          subLabel: '≈ 16 cm laine de verre',       ratio: 1.0 },
        { value: 'forte',     label: 'Forte',            subLabel: '≈ 24 cm laine de verre',       ratio: 0.7 },
        { value: 'tres_perf', label: 'Très performante', subLabel: '> 30 cm, biosourcé / soufflé', ratio: 0.5 },
      ],
    },
    {
      key: 'murs',
      label: 'Murs extérieurs',
      iconName: 'Square',
      color: '#f97316',
      share: 0.20,
      defaultValue: 'moyenne',
      levels: [
        { value: 'non',         label: 'Non isolé',  subLabel: 'Murs d’origine, pierre / béton',  ratio: 1.5 },
        { value: 'faible',      label: 'Faible',     subLabel: 'ITI ≈ 6 cm laine de verre',       ratio: 1.2 },
        { value: 'moyenne',     label: 'Moyenne',    subLabel: 'ITI ≈ 10 cm laine de verre',      ratio: 1.0 },
        { value: 'forte',       label: 'Forte',      subLabel: 'ITI 14 cm ou ITE 10 cm PSE',      ratio: 0.7 },
        { value: 'tres_forte',  label: 'Très forte', subLabel: 'ITE ≥ 16 cm ou double isolation', ratio: 0.5 },
      ],
    },
    {
      key: 'plancher',
      label: 'Plancher bas',
      iconName: 'Layers',
      color: '#a16207',
      share: 0.10,
      defaultValue: 'bonne',
      levels: [
        { value: 'aucune',     label: 'Aucune',     subLabel: 'Dalle brute / vide sanitaire nu',        ratio: 1.5 },
        { value: 'mauvaise',   label: 'Mauvaise',   subLabel: '≈ 4 cm PSE ou moquette seule',           ratio: 1.2 },
        { value: 'bonne',      label: 'Bonne',      subLabel: '≈ 8 cm PSE / polyuréthane',              ratio: 1.0 },
        { value: 'tres_bonne', label: 'Très bonne', subLabel: '≥ 12 cm PU ou plancher chauffant isolé', ratio: 0.7 },
      ],
    },
    {
      key: 'fenetres',
      label: 'Fenêtres',
      iconName: 'RectangleVertical',
      color: '#3b82f6',
      share: 0.18,
      defaultValue: 'double_recent',
      levels: [
        { value: 'simple',         label: 'Simple vitrage',   subLabel: 'Verre 4 mm — Uw ≈ 5.0',    ratio: 1.8 },
        { value: 'double_ancien',  label: 'Double (ancien)',  subLabel: 'Air 12 mm — Uw ≈ 2.8',     ratio: 1.2 },
        { value: 'double_recent',  label: 'Double (récent)',  subLabel: 'Argon + VIR — Uw ≈ 1.4',   ratio: 1.0 },
        { value: 'triple',         label: 'Triple vitrage',   subLabel: 'Argon/krypton — Uw ≈ 0.8', ratio: 0.7 },
      ],
    },
    {
      key: 'portes',
      label: 'Portes',
      iconName: 'DoorClosed',
      color: '#8b5cf6',
      share: 0.03,
      defaultValue: 'isole',
      levels: [
        { value: 'ancien', label: 'Ancien', subLabel: 'Bois plein non isolé — Ud ≈ 3.5',  ratio: 1.3 },
        { value: 'isole',  label: 'Isolé',  subLabel: 'Acier/PVC avec mousse — Ud ≈ 1.4', ratio: 1.0 },
      ],
    },
    {
      key: 'ponts',
      label: 'Ponts thermiques',
      iconName: 'ArrowDownUp',
      color: '#ec4899',
      share: 0.07,
      defaultValue: 'recent',
      levels: [
        { value: 'ancien',     label: 'Ancien',     subLabel: 'Avant RT 1988, nombreux ponts',         ratio: 1.3 },
        { value: 'moyen',      label: 'Moyen',      subLabel: 'RT 1988-2005, quelques rupteurs',       ratio: 1.1 },
        { value: 'recent',     label: 'Récent',     subLabel: 'RT 2005-2012, rupteurs partiels',       ratio: 1.0 },
        { value: 'performant', label: 'Performant', subLabel: 'RT 2012/RE 2020, rupteurs systémati.',  ratio: 0.8 },
      ],
    },
    {
      key: 'ventilation',
      label: 'Ventilation',
      iconName: 'Fan',
      color: '#06b6d4',
      share: 0.17,
      defaultValue: 'simple_flux',
      levels: [
        { value: 'naturelle',   label: 'Naturelle',      subLabel: 'Grilles / courants d’air',         ratio: 1.3 },
        { value: 'simple_flux', label: 'Simple flux',    subLabel: 'VMC extraction continue',          ratio: 1.1 },
        { value: 'hydro',       label: 'Hydro-réglable', subLabel: 'Débit variable selon humidité',    ratio: 1.0 },
        { value: 'double_flux', label: 'Double flux',    subLabel: 'Échangeur récup. chaleur ≥ 80 %',  ratio: 0.7 },
      ],
    },
  ],

  /** Types d'émetteurs */
  EMITTERS: [
    { value: 'radiateur_fonte',     label: 'Radiateur fonte',      iconName: 'Flame',     mode: 'MT_HT' },
    { value: 'radiateur_acier_alu', label: 'Radiateur acier/alu',  iconName: 'Minus',     mode: 'MT_HT' },
    { value: 'plancher_chauffant',  label: 'Plancher chauffant',   iconName: 'Square',    mode: 'BT' },
    { value: 'mur_chauffant',       label: 'Mur chauffant',        iconName: 'Grid3x3',   mode: 'BT' },
    { value: 'plafond_chauffant',   label: 'Plafond chauffant',    iconName: 'SquareDashed', mode: 'BT' },
  ],

  /** Options chauffage principal à déposer */
  HEATING_SYSTEMS: [
    { value: 'gaz',        label: 'Chaudière gaz',          subLabel: 'Ville ou propane',      iconName: 'Flame',     eligibleBarTh171: true  },
    { value: 'fioul',      label: 'Chaudière fioul',        subLabel: 'Tank fioul domestique', iconName: 'Droplet',   eligibleBarTh171: true  },
    { value: 'charbon',    label: 'Chaudière charbon',      subLabel: 'Ancienne chaudière',    iconName: 'Cog',       eligibleBarTh171: true  },
    { value: 'electrique', label: 'Radiateurs électriques', subLabel: 'Convecteurs, panneaux', iconName: 'Zap',       eligibleBarTh171: false },
    { value: 'autre',      label: 'Autre / Aucun',          subLabel: 'À préciser',            iconName: 'HelpCircle', eligibleBarTh171: false },
  ],
}

/** Valeurs par défaut de l'état d'isolation (niveaux "moyens d'époque") */
export const DEFAULT_INSULATION = {
  toiture: 'moyenne',
  murs: 'moyenne',
  plancher: 'bonne',
  fenetres: 'double_recent',
  portes: 'isole',
  ponts: 'recent',
  ventilation: 'simple_flux',
}
