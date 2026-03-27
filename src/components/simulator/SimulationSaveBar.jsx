import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Check, FileDown, ArrowLeft } from 'lucide-react'
import Button from '../ui/Button'
import { useSimulationHistory } from '../../hooks/useSimulationHistory'
import { useSettings } from '../../hooks/useSettings'
import { useClientContext } from '../../hooks/useClientContext'
import { generateSimulationPDF } from '../../lib/pdfGenerator'

export default function SimulationSaveBar({ type, title, inputs, results, pdfData }) {
  const { saveSimulation } = useSimulationHistory()
  const { settings } = useSettings()
  const { clientId, client, linkToClient } = useClientContext()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const entry = saveSimulation(type, title, inputs, results)
    if (clientId && entry) {
      linkToClient(entry.id)
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

  return (
    <div className="space-y-3 pt-4 border-t border-gray-100">
      {/* Client context banner */}
      {client && (
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
          variant={saved ? 'success' : 'primary'}
          size="lg"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Simulation sauvegardée !
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Sauvegarder
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
    </div>
  )
}
