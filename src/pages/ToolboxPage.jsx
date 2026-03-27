import { useState } from 'react'
import { BookOpen, Euro, BarChart3, Home, Users, ChevronDown, ChevronUp } from 'lucide-react'

// ─── DONNÉES BARÈMES ───

const PLAFONDS_RESSOURCES = {
  title: 'Barème des plafonds de ressources 2026',
  source: 'Guide ANAH février 2026 — page 8',
  ileDeFrance: {
    label: 'Île-de-France',
    rows: [
      { personnes: 1, tresModeste: 23541, modeste: 28657, intermediaire: 40018, superieur: '> 40 018' },
      { personnes: 2, tresModeste: 34551, modeste: 42058, intermediaire: 58827, superieur: '> 58 827' },
      { personnes: 3, tresModeste: 41493, modeste: 50513, intermediaire: 70382, superieur: '> 70 382' },
      { personnes: 4, tresModeste: 48447, modeste: 58981, intermediaire: 82839, superieur: '> 82 839' },
      { personnes: 5, tresModeste: 55427, modeste: 67473, intermediaire: 94844, superieur: '> 94 844' },
      { personnes: '+1', tresModeste: 6970, modeste: 8486, intermediaire: 12006, superieur: '' },
    ],
  },
  autresRegions: {
    label: 'Autres régions',
    rows: [
      { personnes: 1, tresModeste: 17009, modeste: 21805, intermediaire: 30549, superieur: '> 30 549' },
      { personnes: 2, tresModeste: 24875, modeste: 31889, intermediaire: 44907, superieur: '> 44 907' },
      { personnes: 3, tresModeste: 29917, modeste: 38349, intermediaire: 54071, superieur: '> 54 071' },
      { personnes: 4, tresModeste: 34948, modeste: 44802, intermediaire: 63235, superieur: '> 63 235' },
      { personnes: 5, tresModeste: 40002, modeste: 51281, intermediaire: 72400, superieur: '> 72 400' },
      { personnes: '+1', tresModeste: 5045, modeste: 6462, intermediaire: 9165, superieur: '' },
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
      { label: 'Système solaire combiné', Bleu: 10000, Jaune: 8000, Violet: 6000, Rose: '-' },
      { label: 'Chauffe-eau solaire individuel', Bleu: 4000, Jaune: 3000, Violet: 2000, Rose: '-' },
      { label: 'Chauffe-eau thermodynamique', Bleu: 1200, Jaune: 800, Violet: 400, Rose: '-' },
      { label: 'Poêle à bûches / cuisinière', Bleu: 2500, Jaune: 2000, Violet: 1000, Rose: '-' },
      { label: 'Poêle à granulés / cuisinière', Bleu: 2500, Jaune: 2000, Violet: 1500, Rose: '-' },
      { label: 'Insert / foyer fermé bûches', Bleu: 2500, Jaune: 1500, Violet: 800, Rose: '-' },
      { label: 'Insert / foyer fermé granulés', Bleu: 2500, Jaune: 2000, Violet: 1500, Rose: '-' },
      { label: 'Réseau de chaleur / froid', Bleu: 1200, Jaune: 800, Violet: 400, Rose: '-' },
    ],
  },
  {
    categorie: 'Isolation',
    aides: [
      { label: 'Isolation thermique des murs (ITE)', Bleu: 75, Jaune: 60, Violet: 40, Rose: '-', unite: '€/m²' },
      { label: 'Isolation thermique des murs (ITI)', Bleu: 25, Jaune: 20, Violet: 15, Rose: '-', unite: '€/m²' },
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
  { label: 'PAC géothermique/solarothermique', plafond: '18 000 €' },
  { label: 'PAC air/eau', plafond: '12 000 €' },
  { label: 'Chaudière biomasse', plafond: '16 000 € (manuelle) / 18 000 € (auto)' },
  { label: 'Système solaire combiné', plafond: '16 000 €' },
  { label: 'Chauffe-eau solaire individuel', plafond: '7 000 €' },
  { label: 'Chauffe-eau thermodynamique', plafond: '3 500 €' },
  { label: 'Poêle / insert bois', plafond: '4 000 €' },
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

      <div className="text-center text-xs text-gray-400 pt-4">
        <p>Données extraites du guide officiel ANAH des aides financières (février 2026) et du communiqué du Ministère du Logement (22/07/2025).</p>
        <p className="mt-1">Ces barèmes sont donnés à titre informatif et peuvent être mis à jour.</p>
      </div>
    </div>
  )
}
