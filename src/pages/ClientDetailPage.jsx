import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Home,
  ChevronRight, MessageSquare, Send, Trash2, Calculator, FileText, Plus, ExternalLink,
  Search, Loader2, Zap, Thermometer, ChevronDown, ChevronUp
} from 'lucide-react'
import { useClients, STATUSES } from '../hooks/useClients'
import { useSimulationHistory } from '../hooks/useSimulationHistory'
import { CATALOG } from '../lib/constants/catalog'
import { getLocationInfo } from '../utils/postalCode'
import { searchDPE, getDpeColor } from '../utils/dpeApi'

const CATEGORY_BADGE = {
  Bleu: 'bg-blue-100 text-blue-800 border-blue-300',
  Jaune: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Violet: 'bg-purple-100 text-purple-800 border-purple-300',
  Rose: 'bg-pink-100 text-pink-800 border-pink-300',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, updateClient, updateStatus, addNote, deleteNote, linkSimulation } = useClients()
  const { history } = useSimulationHistory()
  const [noteText, setNoteText] = useState('')
  const [showLinkSim, setShowLinkSim] = useState(false)
  const [showNewSim, setShowNewSim] = useState(false)

  // DPE state
  const [dpeResults, setDpeResults] = useState(null)
  const [dpeLoading, setDpeLoading] = useState(false)
  const [dpeError, setDpeError] = useState(null)
  const [showDpeSection, setShowDpeSection] = useState(false)

  const client = clients.find((c) => c.id === id)

  if (!client) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">Bénéficiaire introuvable</p>
        <Link to="/clients" className="text-indigo-600 hover:underline mt-2 inline-block">
          Retour à la liste
        </Link>
      </div>
    )
  }

  const currentStatus = STATUSES.find((s) => s.value === client.status)
  const linkedSims = (client.simulations || [])
    .map((simId) => history.find((h) => h.id === simId))
    .filter(Boolean)
  const unlinkedSims = history.filter((h) => !(client.simulations || []).includes(h.id))

  // Location info from postal code
  const locationInfo = client.postalCode ? getLocationInfo(client.postalCode) : null

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote(id, noteText.trim())
    setNoteText('')
  }

  function handleLinkSim(simId) {
    linkSimulation(id, simId)
    setShowLinkSim(false)
  }

  async function handleSearchDPE() {
    if (!client.postalCode && !client.address) return
    setDpeLoading(true)
    setDpeError(null)
    setDpeResults(null)
    setShowDpeSection(true)
    try {
      const { results, geocoding, method } = await searchDPE(
        client.address || '',
        client.postalCode || '',
        client.city || ''
      )
      setDpeResults({ items: results, geocoding, method })
    } catch (err) {
      setDpeError(err.message)
    } finally {
      setDpeLoading(false)
    }
  }

  function handleSelectDPE(dpe) {
    updateClient(id, {
      dpe: {
        numeroDpe: dpe.numeroDpe,
        etiquetteDpe: dpe.etiquetteDpe,
        etiquetteGes: dpe.etiquetteGes,
        periodeConstruction: dpe.periodeConstruction,
        anneeConstruction: dpe.anneeConstruction,
        surface: dpe.surface,
        consoM2: dpe.consoM2,
        emissionGes: dpe.emissionGes,
        energieChauffage: dpe.energieChauffage,
        isolationEnveloppe: dpe.isolationEnveloppe,
        isolationMurs: dpe.isolationMurs,
        isolationMenuiseries: dpe.isolationMenuiseries,
        dateEtablissement: dpe.dateEtablissement,
        dateFinValidite: dpe.dateFinValidite,
        adresse: dpe.adresse,
        observatoireUrl: dpe.observatoireUrl,
      },
    })
    setShowDpeSection(false)
  }

  const dpe = client.dpe
  const dpeColor = dpe?.etiquetteDpe ? getDpeColor(dpe.etiquetteDpe) : null
  const gesColor = dpe?.etiquetteGes ? getDpeColor(dpe.etiquetteGes) : null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back + Edit */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Bénéficiaires
        </button>
        <Link
          to={`/clients/${id}/modifier`}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
            {(client.firstName?.[0] || '').toUpperCase()}
            {(client.lastName?.[0] || '').toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {client.firstName} {client.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {client.category && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_BADGE[client.category]}`}>
                  {client.category} — {client.categoryLabel}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentStatus?.color}`}>
                {currentStatus?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
              <Phone className="w-4 h-4 text-gray-400" />
              {client.phone}
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
              <Mail className="w-4 h-4 text-gray-400" />
              {client.email}
            </a>
          )}
          {(client.address || client.city) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {[client.address, client.postalCode, client.city].filter(Boolean).join(', ')}
            </div>
          )}
          {client.typeLogement && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4 text-gray-400" />
              {client.typeLogement === 'maison' ? 'Maison' : 'Appartement'}
              {client.surface ? ` — ${client.surface} m²` : ''}
            </div>
          )}
          {client.rfr && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4 text-gray-400" />
              RFR : {Number(client.rfr).toLocaleString('fr-FR')} € — {client.personnes} pers.
            </div>
          )}
        </div>

        {/* Auto-detected location badges */}
        {locationInfo && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              <MapPin className="w-3 h-3" />
              {locationInfo.region}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Zone {locationInfo.zoneClimatique}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Dept. {locationInfo.departement}
            </span>
            {locationInfo.isIDF && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                Île-de-France
              </span>
            )}
          </div>
        )}
      </div>

      {/* DPE Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Diagnostic énergétique (DPE)
          </h2>
          <button
            onClick={handleSearchDPE}
            disabled={!client.postalCode || dpeLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition disabled:opacity-40"
          >
            {dpeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {dpe ? 'Actualiser le DPE' : 'Consulter les DPE'}
          </button>
        </div>

        {/* Saved DPE */}
        {dpe && (
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 mb-4">
            <div className="flex items-center gap-4">
              {/* DPE badge */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0"
                style={{ backgroundColor: dpeColor?.bg, color: dpeColor?.text }}
              >
                {dpe.etiquetteDpe}
              </div>
              {/* GES badge */}
              {dpe.etiquetteGes && (
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ backgroundColor: gesColor?.bg, color: gesColor?.text }}
                >
                  <span className="text-2xl font-black leading-none">{dpe.etiquetteGes}</span>
                  <span className="text-[8px] font-bold leading-none">GES</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800">
                  DPE {dpe.etiquetteDpe}
                  {dpe.consoM2 ? ` — ${dpe.consoM2} kWh/m²/an` : ''}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {dpe.periodeConstruction ? `Construction : ${dpe.periodeConstruction}` : ''}
                  {dpe.anneeConstruction ? ` (${dpe.anneeConstruction})` : ''}
                  {dpe.surface ? ` — ${dpe.surface} m²` : ''}
                  {dpe.energieChauffage ? ` — ${dpe.energieChauffage}` : ''}
                </p>
                {(dpe.isolationEnveloppe || dpe.isolationMurs) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {dpe.isolationEnveloppe ? `Isolation : ${dpe.isolationEnveloppe}` : ''}
                    {dpe.isolationMurs ? ` — Murs : ${dpe.isolationMurs}` : ''}
                    {dpe.isolationMenuiseries ? ` — Menuiseries : ${dpe.isolationMenuiseries}` : ''}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-400">
                    {dpe.dateEtablissement ? `Établi le ${new Date(dpe.dateEtablissement).toLocaleDateString('fr-FR')}` : ''}
                    {dpe.dateFinValidite ? ` — Valide jusqu'au ${new Date(dpe.dateFinValidite).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  {dpe.observatoireUrl && (
                    <a
                      href={dpe.observatoireUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Fiche ADEME
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!dpe && !showDpeSection && (
          <p className="text-sm text-gray-400 text-center py-2">
            Aucun DPE rattaché. Cliquez sur « Consulter les DPE » pour rechercher.
          </p>
        )}

        {/* DPE search results */}
        {showDpeSection && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">
                {dpeLoading && 'Recherche en cours…'}
                {!dpeLoading && dpeResults && (
                  <>
                    {dpeResults.items.length} résultat{dpeResults.items.length > 1 ? 's' : ''} trouvé{dpeResults.items.length > 1 ? 's' : ''}
                    {dpeResults.geocoding && (
                      <span className="text-gray-400 ml-1">
                        — {dpeResults.geocoding.label}
                      </span>
                    )}
                  </>
                )}
              </p>
              <button onClick={() => setShowDpeSection(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Fermer
              </button>
            </div>

            {dpeError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">{dpeError}</p>
            )}

            {dpeResults && dpeResults.items.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Aucun DPE trouvé à cette adresse.</p>
            )}

            {dpeResults && dpeResults.items.length > 0 && (
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {dpeResults.items.map((dpeItem) => {
                  const color = getDpeColor(dpeItem.etiquetteDpe)
                  return (
                    <button
                      key={dpeItem.numeroDpe}
                      onClick={() => handleSelectDPE(dpeItem)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black shrink-0"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {dpeItem.etiquetteDpe || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {dpeItem.adresse || 'Adresse non renseignée'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dpeItem.consoM2 ? `${dpeItem.consoM2} kWh/m²/an` : ''}
                          {dpeItem.surface ? ` — ${dpeItem.surface} m²` : ''}
                          {dpeItem.periodeConstruction ? ` — ${dpeItem.periodeConstruction}` : ''}
                          {dpeItem.typeBatiment ? ` — ${dpeItem.typeBatiment}` : ''}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {dpeItem.dateEtablissement ? new Date(dpeItem.dateEtablissement).toLocaleDateString('fr-FR') : ''}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline / Statut */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Avancement</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(id, s.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                client.status === s.value
                  ? `${s.color} border-current ring-2 ring-offset-1 ring-current/20`
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${client.status === s.value ? s.dot : 'bg-gray-300'}`} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulations — Scénarios */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Simulations & Scénarios ({linkedSims.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLinkSim(!showLinkSim)}
              className="text-xs text-gray-500 font-medium hover:underline"
            >
              Rattacher
            </button>
          </div>
        </div>

        {/* Nouvelle simulation — choix de fiche */}
        <div className="mb-4">
          <button
            onClick={() => setShowNewSim(!showNewSim)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle simulation
          </button>
        </div>

        {showNewSim && (
          <div className="mb-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <p className="text-xs text-indigo-600 font-semibold mb-3">Choisir un simulateur :</p>
            <div className="space-y-3">
              {CATALOG.map((cat) => (
                <div key={cat.category}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{cat.emoji} {cat.category}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {cat.items.filter((i) => i.active).map((item) => (
                      <Link
                        key={item.code}
                        to={`${item.route}?clientId=${id}`}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-sm transition text-sm"
                      >
                        <span>
                          <span className="font-semibold text-gray-800">{item.title}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{item.code}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-indigo-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rattacher simulation existante */}
        {showLinkSim && unlinkedSims.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto space-y-1">
            {unlinkedSims.map((sim) => (
              <button
                key={sim.id}
                onClick={() => handleLinkSim(sim.id)}
                className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition text-sm"
              >
                <span>
                  <span className="font-semibold text-gray-800">{sim.title}</span>
                  <span className="text-gray-400 ml-2">
                    {new Date(sim.date).toLocaleDateString('fr-FR')}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        )}
        {showLinkSim && unlinkedSims.length === 0 && (
          <p className="text-xs text-gray-400 mb-4">Aucune simulation non rattachée disponible.</p>
        )}

        {/* Simulations list */}
        {linkedSims.length === 0 && !showNewSim && !showLinkSim && (
          <p className="text-sm text-gray-400 text-center py-2">Aucune simulation. Créez un scénario pour ce bénéficiaire.</p>
        )}
        {linkedSims.length > 0 && (
          <div className="space-y-2">
            {linkedSims.map((sim) => {
              const ficheRoute = CATALOG.flatMap((c) => c.items).find((i) => i.code === sim.type)?.route
              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{sim.type}</span>
                      <p className="font-semibold text-sm text-gray-800">{sim.title}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sim.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {sim.results?.totalAid != null && (
                        <span className="ml-2 text-green-600 font-semibold">
                          Aides : {Number(sim.results.totalAid).toLocaleString('fr-FR')} €
                        </span>
                      )}
                      {sim.results?.totalAides != null && !sim.results?.totalAid && (
                        <span className="ml-2 text-green-600 font-semibold">
                          Aides : {Number(sim.results.totalAides).toLocaleString('fr-FR')} €
                        </span>
                      )}
                      {sim.results?.resteACharge != null && (
                        <span className="ml-2 text-orange-600 font-medium">
                          RAC : {Number(sim.results.resteACharge).toLocaleString('fr-FR')} €
                        </span>
                      )}
                    </p>
                  </div>
                  {ficheRoute && (
                    <Link
                      to={`${ficheRoute}?clientId=${id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100"
                      title="Modifier / Nouveau scénario"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Simuler
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Notes ({(client.notes || []).length})
        </h2>

        {/* Add note */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
            placeholder="Ajouter une note..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Notes list */}
        {(client.notes || []).length === 0 && (
          <p className="text-sm text-gray-400">Aucune note pour l'instant.</p>
        )}
        <div className="space-y-2">
          {(client.notes || []).map((note) => (
            <div key={note.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group">
              <div className="flex-1">
                <p className="text-sm text-gray-700">{note.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(note.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => deleteNote(id, note.id)}
                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
