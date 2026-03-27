import { useState } from 'react'
import { BookOpen, Euro, BarChart3, Home, Users, ChevronDown, ChevronUp, ClipboardCheck, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

// ─── DONNÉES BARÈMES ───

const PLAFONDS_RESSOURCES = {
  title: 'Barème des plafonds de ressources 2026',
  source: 'Guide ANAH février 2026 — page 8',
  ileDeFrance: {
    label: 'Île-de-France',
    rows: [
      { personnes: 1, tresModeste: 24031, modeste: 29253, intermediaire: 40018, superieur: '> 40 018' },
      { personnes: 2, tresModeste: 35270, modeste: 42923, intermediaire: 58827, superieur: '> 58 827' },
      { personnes: 3, tresModeste: 42357, modeste: 51539, intermediaire: 70382, superieur: '> 70 382' },
      { personnes: 4, tresModeste: 49455, modeste: 60168, intermediaire: 82839, superieur: '> 82 839' },
      { personnes: 5, tresModeste: 56580, modeste: 68821, intermediaire: 94844, superieur: '> 94 844' },
      { personnes: '+1', tresModeste: 7116, modeste: 8656, intermediaire: 12006, superieur: '' },
    ],
  },
  autresRegions: {
    label: 'Autres régions',
    rows: [
      { personnes: 1, tresModeste: 17363, modeste: 22256, intermediaire: 30549, superieur: '> 30 549' },
      { personnes: 2, tresModeste: 25393, modeste: 32565, intermediaire: 44907, superieur: '> 44 907' },
      { personnes: 3, tresModeste: 30540, modeste: 39147, intermediaire: 54071, superieur: '> 54 071' },
      { personnes: 4, tresModeste: 35676, modeste: 45727, intermediaire: 63235, superieur: '> 63 235' },
      { personnes: 5, tresModeste: 40835, modeste: 52338, intermediaire: 72400, superieur: '> 72 400' },
      { personnes: '+1', tresModeste: 5148, modeste: 6594, intermediaire: 9165, superieur: '' },
    ],
  },
}

const MONTANTS_PRIME_PAR_GESTE = [
  {
    categorie: 'Chauffage & Eau chaude',
    aides: [
      { label: 'PAC géothermique ou solarothermique', Bleu: 11000, Jaune: 9000, Violet: 6000, Rose: '-' },
      { label: 'PAC air/eau (dont hybride)', Bleu: 5000, Jaune: 4000, Violet: 3000, Rose: '-' },
      { label: 'Chaudière biomasse', Bleu: 7000, Jaune: 5500, Violet: 3000, Rose: '-' },
      { label: 'Système solaire combiné', Bleu: 10000, Jaune: 8000, Violet: 4000, Rose: '-' },
      { label: 'Chauffe-eau solaire individuel', Bleu: 4000, Jaune: 3000, Violet: 2000, Rose: '-' },
      { label: 'Chauffe-eau thermodynamique', Bleu: 1200, Jaune: 800, Violet: 400, Rose: '-' },
      { label: 'Poêle à bûches / cuisinière', Bleu: 1250, Jaune: 1000, Violet: 500, Rose: '-' },
      { label: 'Poêle à granulés / cuisinière', Bleu: 1250, Jaune: 1000, Violet: 500, Rose: '-' },
      { label: 'Insert / foyer fermé', Bleu: 1250, Jaune: 750, Violet: 750, Rose: '-' },
      { label: 'Réseau de chaleur / froid', Bleu: 1200, Jaune: 800, Violet: 400, Rose: '-' },
      { label: 'Partie thermique d\'un équipement PVT eau', Bleu: 2500, Jaune: 2000, Violet: 1000, Rose: '-' },
    ],
  },
  {
    categorie: 'Isolation',
    aides: [
      { label: 'Isolation rampants de toiture / plafonds combles', Bleu: 25, Jaune: 20, Violet: 15, Rose: '-', unite: '€/m²' },
      { label: 'Isolation toitures-terrasses', Bleu: 75, Jaune: 60, Violet: 40, Rose: '-', unite: '€/m²' },
      { label: 'Fenêtres / portes-fenêtres (simple → double)', Bleu: 100, Jaune: 80, Violet: 40, Rose: '-', unite: '€/équipement' },
    ],
  },
  {
    categorie: 'Autres',
    aides: [
      { label: 'Audit énergétique', Bleu: 500, Jaune: 400, Violet: 300, Rose: '-' },
      { label: 'Dépose cuve fioul', Bleu: 1200, Jaune: 800, Violet: 400, Rose: '-' },
      { label: 'VMC double flux', Bleu: 2500, Jaune: 2000, Violet: 1500, Rose: '-' },
    ],
  },
]

const PLAFONDS_DEPENSES = [
  { label: 'PAC géothermique ou solarothermique', plafond: '18 000 €' },
  { label: 'PAC air/eau (dont hybride)', plafond: '12 000 €' },
  { label: 'Chaudière biomasse manuelle', plafond: '16 000 €' },
  { label: 'Chaudière biomasse automatique', plafond: '18 000 €' },
  { label: 'Système solaire combiné', plafond: '16 000 €' },
  { label: 'Chauffe-eau solaire individuel', plafond: '7 000 €' },
  { label: 'Chauffe-eau thermodynamique', plafond: '3 500 €' },
  { label: 'Poêle à granulés', plafond: '5 000 €' },
  { label: 'Poêle à bûches / cuisinière', plafond: '4 000 €' },
  { label: 'Insert / foyer fermé', plafond: '4 000 €' },
  { label: 'Partie thermique PVT eau', plafond: '7 000 €' },
  { label: 'Réseau de chaleur ou de froid', plafond: '1 800 €' },
  { label: 'Rampants de toiture / combles', plafond: '75 €/m²' },
  { label: 'Toitures-terrasses', plafond: '180 €/m²' },
  { label: 'Fenêtres / portes-fenêtres', plafond: '1 000 €/équipement' },
  { label: 'VMC double flux', plafond: '6 000 €' },
  { label: 'Audit énergétique', plafond: '800 €' },
  { label: 'Dépose cuve fioul', plafond: '4 000 €' },
]

const ECRETEMENT_PAR_GESTE = [
  { label: 'Cumul MPR + CEE', Bleu: '90%', Jaune: '75%', Violet: '60%', Rose: '-' },
  { label: 'Cumul MPR + CEE + aides locales', Bleu: '100%', Jaune: '100%', Violet: '100%', Rose: '-' },
]

const RENOVATION_AMPLEUR = {
  travaux: {
    title: 'Travaux — MaPrimeRénov\' Parcours Accompagné',
    rows: [
      {
        sauts: '2 classes',
        plafond: '30 000 € HT',
        Bleu: { taux: '80%', max: '24 000 €' },
        Jaune: { taux: '60%', max: '18 000 €' },
        Violet: { taux: '45%', max: '13 500 €' },
        Rose: { taux: '10%', max: '3 000 €' },
      },
      {
        sauts: '3 classes ou +',
        plafond: '40 000 € HT',
        Bleu: { taux: '80%', max: '32 000 €' },
        Jaune: { taux: '60%', max: '24 000 €' },
        Violet: { taux: '50%', max: '20 000 €' },
        Rose: { taux: '15%', max: '6 000 €' },
      },
    ],
  },
  amo: {
    title: 'AMO — Mon Accompagnateur Rénov\'',
    plafond: '2 000 € TTC',
    rows: [
      { label: 'Très modestes (Bleu)', taux: '100%', max: '2 000 €' },
      { label: 'Modestes (Jaune)', taux: '80%', max: '1 600 €' },
      { label: 'Intermédiaires (Violet)', taux: '40%', max: '800 €' },
      { label: 'Supérieurs (Rose)', taux: '20%', max: '400 €' },
    ],
  },
  ecretement: {
    title: 'Écrêtement (plafond cumul aides)',
    rows: [
      { label: 'Très modestes (Bleu)', taux: '100%' },
      { label: 'Modestes (Jaune)', taux: '90%' },
      { label: 'Intermédiaires (Violet)', taux: '80%' },
      { label: 'Supérieurs (Rose)', taux: '50%' },
    ],
  },
}

// ─── COMPOSANTS ───

function Section({ title, icon: Icon, iconColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </h2>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

function formatN(n) {
  if (typeof n === 'string') return n
  return n.toLocaleString('fr-FR') + ' €'
}

function RessourcesTable({ data, label }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{label}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-indigo-900 text-white">
              <th className="p-2 text-left rounded-tl-lg">Personnes</th>
              <th className="p-2 text-right bg-blue-800">Très modestes</th>
              <th className="p-2 text-right bg-yellow-600">Modestes</th>
              <th className="p-2 text-right bg-purple-700">Intermédiaires</th>
              <th className="p-2 text-right bg-pink-600 rounded-tr-lg">Supérieurs</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 font-semibold border-b">{row.personnes === '+1' ? 'Par pers. suppl.' : row.personnes}</td>
                <td className="p-2 text-right border-b text-blue-700 font-medium">{formatN(row.tresModeste)}</td>
                <td className="p-2 text-right border-b text-yellow-700 font-medium">{formatN(row.modeste)}</td>
                <td className="p-2 text-right border-b text-purple-700 font-medium">{formatN(row.intermediaire)}</td>
                <td className="p-2 text-right border-b text-pink-700 font-medium">{typeof row.superieur === 'string' ? row.superieur : formatN(row.superieur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PAGE ───

export default function ToolboxPage() {
  const [region, setRegion] = useState('autresRegions')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-2xl mb-4">
          <BookOpen className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Boîte à outils</h1>
        <p className="text-gray-500 mt-2">
          Tous les barèmes et plafonds pour les aides à la rénovation énergétique — au même endroit.
        </p>
        <p className="text-xs text-gray-400 mt-1">Source : Guide ANAH des aides financières — février 2026</p>
      </div>

      {/* 1. Plafonds de ressources */}
      <Section title="Plafonds de ressources 2026" icon={Users} iconColor="text-blue-600">
        <p className="text-xs text-gray-500 mb-3">{PLAFONDS_RESSOURCES.source}</p>

        {/* Region toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRegion('ileDeFrance')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              region === 'ileDeFrance'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Île-de-France
          </button>
          <button
            onClick={() => setRegion('autresRegions')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition ${
              region === 'autresRegions'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Autres régions
          </button>
        </div>

        <RessourcesTable
          data={PLAFONDS_RESSOURCES[region]}
          label={PLAFONDS_RESSOURCES[region].label}
        />

        <p className="text-xs text-gray-400 mt-3">
          Revenu fiscal de référence (RFR) de l'année N-1. Si le RFR est inférieur ou égal au plafond, le ménage relève de la catégorie correspondante.
        </p>
      </Section>

      {/* 2. Rénovation d'ampleur — Parcours Accompagné */}
      <Section title="Rénovation d'ampleur — Parcours Accompagné" icon={Home} iconColor="text-green-600">
        <p className="text-xs text-gray-500 mb-3">
          Logements classés E, F ou G uniquement. Source : Communiqué Ministère du Logement 22/07/2025.
        </p>

        {/* Tableau travaux */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-green-800 text-white">
                <th className="p-2 text-left" rowSpan={2}>Sauts de classes</th>
                <th className="p-2 text-center" rowSpan={2}>Plafond HT</th>
                <th className="p-2 text-center bg-blue-700" colSpan={1}>Bleu</th>
                <th className="p-2 text-center bg-yellow-600" colSpan={1}>Jaune</th>
                <th className="p-2 text-center bg-purple-700" colSpan={1}>Violet</th>
                <th className="p-2 text-center bg-pink-600" colSpan={1}>Rose</th>
              </tr>
            </thead>
            <tbody>
              {RENOVATION_AMPLEUR.travaux.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 font-semibold border-b">{row.sauts}</td>
                  <td className="p-2 text-center border-b font-medium">{row.plafond}</td>
                  <td className="p-2 text-center border-b">
                    <span className="font-bold text-blue-700">{row.Bleu.taux}</span>
                    <br /><span className="text-xs text-gray-500">{row.Bleu.max}</span>
                  </td>
                  <td className="p-2 text-center border-b">
                    <span className="font-bold text-yellow-700">{row.Jaune.taux}</span>
                    <br /><span className="text-xs text-gray-500">{row.Jaune.max}</span>
                  </td>
                  <td className="p-2 text-center border-b">
                    <span className="font-bold text-purple-700">{row.Violet.taux}</span>
                    <br /><span className="text-xs text-gray-500">{row.Violet.max}</span>
                  </td>
                  <td className="p-2 text-center border-b">
                    <span className="font-bold text-pink-700">{row.Rose.taux}</span>
                    <br /><span className="text-xs text-gray-500">{row.Rose.max}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AMO */}
        <h3 className="text-sm font-bold text-gray-700 mt-4 mb-2">{RENOVATION_AMPLEUR.amo.title}</h3>
        <p className="text-xs text-gray-500 mb-2">Plafond TTC de dépense : {RENOVATION_AMPLEUR.amo.plafond}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RENOVATION_AMPLEUR.amo.rows.map((row, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center border">
              <p className="text-xs text-gray-500">{row.label}</p>
              <p className="font-bold text-lg text-gray-800">{row.taux}</p>
              <p className="text-sm text-green-700 font-semibold">{row.max}</p>
            </div>
          ))}
        </div>

        {/* Écrêtement */}
        <h3 className="text-sm font-bold text-gray-700 mt-4 mb-2">{RENOVATION_AMPLEUR.ecretement.title}</h3>
        <p className="text-xs text-gray-500 mb-2">Plafond du cumul de toutes les aides (MPR + CEE + locales) en % du coût TTC éligible.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RENOVATION_AMPLEUR.ecretement.rows.map((row, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-center border">
              <p className="text-xs text-gray-500">{row.label}</p>
              <p className="font-bold text-xl text-indigo-700">{row.taux}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Montants MaPrimeRénov' par geste */}
      <Section title="MaPrimeRénov' par geste — Montants forfaitaires" icon={Euro} iconColor="text-yellow-600" defaultOpen={false}>
        <p className="text-xs text-gray-500 mb-3">Source : Guide ANAH février 2026, pages 16-17</p>

        {MONTANTS_PRIME_PAR_GESTE.map((cat, ci) => (
          <div key={ci} className="mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">{cat.categorie}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-900 text-white text-xs">
                    <th className="p-2 text-left">Équipement / travaux</th>
                    <th className="p-2 text-right bg-blue-700">Bleu</th>
                    <th className="p-2 text-right bg-yellow-600">Jaune</th>
                    <th className="p-2 text-right bg-purple-700">Violet</th>
                    <th className="p-2 text-right bg-pink-600">Rose</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.aides.map((aide, ai) => (
                    <tr key={ai} className={ai % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 border-b text-gray-700">
                        {aide.label}
                        {aide.unite && <span className="text-xs text-gray-400 ml-1">({aide.unite})</span>}
                      </td>
                      <td className="p-2 text-right border-b font-semibold text-blue-700">{typeof aide.Bleu === 'number' ? formatN(aide.Bleu) : aide.Bleu}</td>
                      <td className="p-2 text-right border-b font-semibold text-yellow-700">{typeof aide.Jaune === 'number' ? formatN(aide.Jaune) : aide.Jaune}</td>
                      <td className="p-2 text-right border-b font-semibold text-purple-700">{typeof aide.Violet === 'number' ? formatN(aide.Violet) : aide.Violet}</td>
                      <td className="p-2 text-right border-b font-semibold text-pink-700">{aide.Rose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      {/* 4. Plafonds de dépenses éligibles */}
      <Section title="Plafonds de dépenses éligibles" icon={BarChart3} iconColor="text-red-600" defaultOpen={false}>
        <p className="text-xs text-gray-500 mb-3">Source : Guide ANAH février 2026, page 18</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-red-800 text-white">
                <th className="p-2 text-left">Équipement / travaux</th>
                <th className="p-2 text-right">Plafond de dépenses éligibles</th>
              </tr>
            </thead>
            <tbody>
              {PLAFONDS_DEPENSES.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border-b text-gray-700">{item.label}</td>
                  <td className="p-2 text-right border-b font-semibold text-gray-900">{item.plafond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Écrêtement par geste */}
        <h3 className="text-sm font-bold text-gray-700 mt-4 mb-2">Écrêtement MPR + CEE (par geste)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-indigo-800 text-white text-xs">
                <th className="p-2 text-left">Cumul</th>
                <th className="p-2 text-right">Bleu</th>
                <th className="p-2 text-right">Jaune</th>
                <th className="p-2 text-right">Violet</th>
                <th className="p-2 text-right">Rose</th>
              </tr>
            </thead>
            <tbody>
              {ECRETEMENT_PAR_GESTE.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border-b font-medium text-gray-700">{row.label}</td>
                  <td className="p-2 text-right border-b font-semibold text-blue-700">{row.Bleu}</td>
                  <td className="p-2 text-right border-b font-semibold text-yellow-700">{row.Jaune}</td>
                  <td className="p-2 text-right border-b font-semibold text-purple-700">{row.Violet}</td>
                  <td className="p-2 text-right border-b font-semibold text-pink-700">{row.Rose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 5. Check-list dossier CEE Chauffage */}
      <Section title="Check-list dossier CEE — Chauffage" icon={ClipboardCheck} iconColor="text-orange-600" defaultOpen={false}>
        <p className="text-xs text-gray-500 mb-4">Source : Sonergia — Check-list EP Chauffage V1.4 (11/03/2026)</p>

        {/* Mentions obligatoires devis/facture */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Mentions obligatoires sur devis & facture
          </h3>
          <div className="space-y-2">
            {[
              'Raison sociale + SIRET + adresse de l\'installateur RGE',
              'Si sous-traitance : raison sociale + SIRET du sous-traitant RGE',
              'Nom + Prénom + adresse complète du bénéficiaire (identiques au compte MPR)',
              'Adresse des travaux si différente (+ justificatif de domicile)',
              'Le mot « Devis » ou « Proposition commerciale » (ou « Facture » + n°)',
              'Date de création et/ou d\'édition',
              'Détails des travaux avec une ligne par travaux éligibles + mentions techniques',
              'Date et signature manuscrites par le bénéficiaire (APRÈS réception de la proposition de prime)',
              'Pagination cohérente — toutes les pages fournies',
              'Montant total HT et TTC',
              'Acompte mentionné sans date (date ne doit pas précéder la proposition de prime)',
              'Distinguer clairement remises commerciales et primes',
              'Déduction CEE après le montant TTC (ou TVA à 0% dans le corps)',
              'N° de qualification RGE + certificat annexé au devis',
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coup de pouce chauffage */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Coup de Pouce Chauffage
          </h4>
          <p className="text-sm text-amber-700">
            Mention obligatoire : « Dépose/enlèvement/démontage d'une chaudière fioul/charbon/gaz ».
            Sans cette mention, le dossier sera validé hors Coup de Pouce avec une prime réduite.
            La dépose et la pose doivent être faites par le même installateur certifié RGE.
          </p>
        </div>

        {/* MPR spécificités */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-bold text-indigo-800 mb-2">MaPrimeRénov' — Points spécifiques</h4>
          <ul className="text-sm text-indigo-700 space-y-1 list-disc pl-4">
            <li>Sous-total TTC lisible pour chaque travaux éligible MPR sur le même devis</li>
            <li>Séparer les travaux sans lien avec les primes (décoration, etc.)</li>
            <li>Déduction obligatoire avec mention « estimation de l'aide MPR »</li>
            <li>Validité du devis : minimum 1 mois recommandé (3 mois par défaut)</li>
            <li>Clause suspensive ANAH recommandée sur le devis</li>
          </ul>
        </div>

        {/* Documents obligatoires */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-orange-600" />
            Documents obligatoires — 100% des dossiers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Devis signé & daté à la main par le bénéficiaire',
              'Facture des travaux',
              'Attestation sur l\'honneur (sans rature)',
              'RIB du bénéficiaire (sauf si prime déduite)',
              'Certificat RGE',
            ].map((doc, i) => (
              <div key={i} className="flex gap-2 items-center bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <p className="text-sm text-gray-700 font-medium">{doc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents conditionnels */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Documents supplémentaires selon le cas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-orange-800 text-white">
                  <th className="p-2 text-left">Situation</th>
                  <th className="p-2 text-left">Document requis</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Prime bonifiée (revenus)', 'Avis d\'imposition N ou N-1'],
                  ['Adresse travaux ≠ avis d\'imposition', 'Justificatif de domicile à l\'adresse des travaux'],
                  ['Adresse imprécise (lieu-dit)', 'Coordonnées cadastrales (préfixe/section/n° parcelle)'],
                  ['Résidence secondaire ou location', 'Preuve de propriété (acte, taxe foncière, bail)'],
                  ['Travaux payés par le locataire', 'Attestation d\'autorisation du propriétaire'],
                  ['Plusieurs propriétaires', 'Attestations signées par tous les propriétaires'],
                  ['Prime déduite de la facture', 'Cadre de contribution indirect signé par l\'installateur'],
                  ['PAC ou chaudière biomasse', 'Note de dimensionnement (nom bénéficiaire + adresse)'],
                ].map(([situation, doc], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-2 border-b text-gray-600">{situation}</td>
                    <td className="p-2 border-b font-medium text-gray-800">{doc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Points de contrôle — rejet */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Points critiques — Causes de rejet
          </h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc pl-4">
            <li>Logement de + de 2 ans à la date d'acceptation du devis</li>
            <li>Matériel dans la liste des matériels éligibles</li>
            <li>Qualification RGE valide à la date de signature du devis</li>
            <li>Proposition de prime reçue AVANT signature du devis, versement d'acompte et commande matériaux</li>
            <li>Pas de double valorisation CEE avec un autre organisme</li>
            <li>Facture de moins de 4 mois à la réception du dossier</li>
            <li>Sous-traitance : maximum 2 rangs</li>
            <li>Email de proposition de prime envoyé au bénéficiaire (jamais au professionnel)</li>
          </ul>
        </div>

        {/* Attestation sur l'honneur */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-800 mb-2">Attestation sur l'honneur — Points de vigilance</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
            <li>Conserver l'original si fournie scannée (contrôle possible)</li>
            <li>Pagination cohérente sur chaque page</li>
            <li>Toutes les informations obligatoires (*) renseignées</li>
            <li>Informations cohérentes avec les autres documents</li>
            <li>Dates de signature postérieures à la date de facture / fin de travaux</li>
          </ul>
        </div>
      </Section>

      <div className="text-center text-xs text-gray-400 pt-4">
        <p>Données extraites du guide officiel ANAH des aides financières (février 2026) et du communiqué du Ministère du Logement (22/07/2025).</p>
        <p className="mt-1">Ces barèmes sont donnés à titre informatif et peuvent être mis à jour.</p>
      </div>
    </div>
  )
}
