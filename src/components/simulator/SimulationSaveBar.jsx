import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import Button from '../ui/Button'
import { useSimulationHistory } from '../../hooks/useSimulationHistory'

export default function SimulationSaveBar({ type, title, inputs, results }) {
  const { saveSimulation } = useSimulationHistory()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveSimulation(type, title, inputs, results)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex justify-center pt-4 border-t border-gray-100">
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
            Sauvegarder cette simulation
          </>
        )}
      </Button>
    </div>
  )
}
