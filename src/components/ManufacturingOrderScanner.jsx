import { useState } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'

function ManufacturingOrderScanner({ onSelected, title = "Quel ordre de fabrication tester ?" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUid, setLastUid] = useState('')

  const normalizeMoInput = (value) => {
    const raw = String(value || '').trim()
    // Remove leading "OF" (case-insensitive) and any spaces after it
    const withoutPrefix = raw.replace(/^OF\s*/i, '')
    return withoutPrefix.trim()
  }

  const validateUid = (value) => {
    const v = normalizeMoInput(value)
    return v.length >= 1
  }

  const handleScan = async (value) => {
    const uid = normalizeMoInput(value)
    if (!uid) return
    setError('')
    setLastUid(uid)
    setLoading(true)
    try {
      const res = await getManufacturingOrderByUid(uid)
      if (!res.ok || !res.data) {
        setError("Ordre introuvable ou erreur lors de la recherche.")
      } else {
        if (typeof onSelected === 'function') {
          onSelected({ uid, data: res.data })
        }
      }
    } catch (e) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel" aria-labelledby="mo-title">
      <div className="panel-header">
        <div aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }} title="Ordre de fabrication">🏷️</div>
        <h2 id="mo-title">{title}</h2>
        <span className="panel-subtitle">Scannez ou saisissez l'UID de l'ordre de fabrication.</span>
      </div>
      <div className="panel-body">
        <KeyboardScanner
          title="Lecteur (USB/Clavier)"
          validate={validateUid}
          onScan={handleScan}
          onValid={() => {}}
          onInvalid={() => {}}
          invalidMessage="UID invalide."
          minLength={1}
          showLastResult={false}
        />

        {loading && (
          <div className="message-block">
            <ImpactMessage variant="info" title="Recherche de l'ordre…">
              Merci de patienter pendant la vérification.
            </ImpactMessage>
          </div>
        )}
        {error && (
          <div className="message-block">
            <ImpactMessage variant="error" title="Échec de la sélection de l'ordre">
              {error}
            </ImpactMessage>
          </div>
        )}
        {lastUid && !loading && !error && (
          <div className="helper-text">
            Dernier UID saisi: <strong>{lastUid}</strong>
          </div>
        )}
      </div>
    </section>
  )
}

export default ManufacturingOrderScanner
