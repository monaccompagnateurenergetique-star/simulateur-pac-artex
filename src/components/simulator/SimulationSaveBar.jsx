import { useState } from 'react'
import { Save, Check, FileDown } from 'lucide-react'
import Button from '../ui/Button'
import { useSimulationHistory } from '../../hooks/useSimulationHistory'
import { useSettings } from '../../hooks/useSettings'
import { generateSimulationPDF } from '../../lib/pdfGenerator'

export default function SimulationSaveBar({ type, title, inputs, results, pdfData }) {
  const { saveSimulation } = useSimulationHistory()
  const { settings } = useSettings()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveSimulation(type, title, inputs, results)
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
    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t border-gray-100">
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
  )
}
