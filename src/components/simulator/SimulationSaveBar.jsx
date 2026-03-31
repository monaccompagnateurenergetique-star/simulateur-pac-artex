import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Check, FileDown, ArrowLeft, LinkIcon, RefreshCw } from 'lucide-react'
import Button from '../ui/Button'
import { useSimulationHistory } from '../../hooks/useSimulationHistory'
import { useSettings } from '../../hooks/useSettings'
import { useClientContext } from '../../hooks/useClientContext'
import { useProjects } from '../../hooks/useProjects'
import { generateSimulationPDF } from '../../lib/pdfGenerator'

export default function SimulationSaveBar({ type, title, inputs, results, pdfData }) {
  const { saveSimulation } = useSimulationHistory()
  const { settings } = useSettings()
  const { clientId, client, linkToClient } = useClientContext()
  const { projects, addSimToScenario, updateSimInScenario } = useProjects()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [saved, setSaved] = useState(false)
  const [savedToScenario, setSavedToScenario] = useState(false)

  const projectId = searchParams.get('projectId')
  const scenarioId = searchParams.get('scenarioId')
  const editSimId = searchParams.get('editSimId')

  // Trouver le projet et scénario correspondants
  const project = projectId ? projects.find((p) => p.id === projectId) : null
  const scenario = project && scenarioId
    ? (project.scenarios || []).find((s) => s.id === scenarioId)
    : null

  const isEditMode = !!(editSimId && scenario)

  function handleSave() {
    const entry = saveSimulation(type, title, inputs, results)
    if (clientId && entry) {
      linkToClient(entry.id)
    }

    // Mode édition : mettre à jour la simulation existante dans le scénario
    if (isEditMode) {
      updateSimInScenario(projectId, scenarioId, editSimId, {
        type,
        title,
        inputs,
        results,
        date: new Date().toISOString(),
      })
      setSavedToScenario(true)
    }
    // Mode ajout : sauvegarder dans le scénario si contexte projet
    else if (projectId && scenarioId && entry) {
      addSimToScenario(projectId, scenarioId, {
        id: entry.id,
        type,
        title,
        inputs,
        results,
        date: new Date().toISOString(),
      })
      setSavedToScenario(true)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handlePDF() {
    if (!pdfData) return
    generateSimulationPDF({
      company: settings.company,
      ...pdfData,
    })
  }

  function handleReturnToScenario() {
    navigate(`/projets/${projectId}/scenario/${scenarioId}`)
  }

  // Libellé du bouton
  const saveLabel = isEditMode
    ? 'Mettre à jour la simulation'
    : scenario
      ? 'Sauvegarder et rattacher au scénario'
      : 'Sauvegarder'

  const savedLabel = savedToScenario
    ? isEditMode
      ? 'Simulation mise à jour !'
      : 'Sauvegardée et rattachée au scénario !'
    : 'Simulation sauvegardée !'

  return (
    <div className="space-y-3 pt-4 border-t border-gray-100">
      {/* Contexte scénario projet */}
      {project && scenario && (
        <div className={`flex items-center justify-between p-3 rounded-xl border ${
          isEditMode
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="text-sm">
            <span className={`font-semibold ${isEditMode ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isEditMode ? (
                <><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Modification :</>
              ) : (
                <><LinkIcon className="w-3.5 h-3.5 inline mr-1" />Scénario :</>
              )}
            </span>{' '}
            <span className={`font-bold ${isEditMode ? 'text-amber-800' : 'text-emerald-800'}`}>{scenario.name}</span>
            <span className={`mx-2 ${isEditMode ? 'text-amber-400' : 'text-emerald-400'}`}>•</span>
            <span className={isEditMode ? 'text-amber-700' : 'text-emerald-700'}>
              {project.firstName} {project.lastName}
            </span>
          </div>
          <button
            onClick={handleReturnToScenario}
            className={`flex items-center gap-1 text-xs hover:underline ${
              isEditMode ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            Retour scénario
          </button>
        </div>
      )}

      {/* Client context banner (legacy) */}
      {client && !project && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="text-sm">
            <span className="text-indigo-600 font-semibold">Simulation pour : </span>
            <span className="font-bold text-indigo-800">{client.firstName} {client.lastName}</span>
            {client.category && (
              <span className="ml-2 text-xs font-medium text-indigo-500">({client.category})</span>
            )}
          </div>
          <button
            onClick={() => navigate(`/clients/${clientId}`)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Retour fiche
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button
          onClick={handleSave}
          variant={saved ? 'success' : isEditMode ? 'warning' : 'primary'}
          size="lg"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              {savedLabel}
            </>
          ) : (
            <>
              {isEditMode ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saveLabel}
            </>
          )}
        </Button>

        {pdfData && (
          <Button
            onClick={handlePDF}
            variant="secondary"
            size="lg"
          >
            <FileDown className="w-5 h-5" />
            Exporter en PDF
          </Button>
        )}
      </div>

      {/* Bouton retour scénario après sauvegarde */}
      {savedToScenario && (
        <div className="flex justify-center">
          <Button
            onClick={handleReturnToScenario}
            variant="secondary"
            size="md"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au scénario
          </Button>
        </div>
      )}
    </div>
  )
}
