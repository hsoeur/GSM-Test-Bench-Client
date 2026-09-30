import { useState } from 'react'

export default function MachineSetup({ onConfigured }) {
  const [machineName, setMachineName] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalized = machineName.trim()
    if (normalized) onConfigured(normalized)
  }

  return (
    <form className="card machine-setup" onSubmit={handleSubmit}>
      <h2>Quel est ce poste ?</h2>
      <p>Renseignez le nom unique du poste utilisé pour sélectionner l’imprimante réseau.</p>
      <label htmlFor="machine-name">Nom du poste</label>
      <input
        id="machine-name"
        value={machineName}
        onChange={(event) => setMachineName(event.target.value)}
        placeholder="PC-PRODUCTION-03"
        autoFocus
        required
      />
      <button className="btn" type="submit" disabled={!machineName.trim()}>
        Enregistrer ce poste
      </button>
    </form>
  )
}
