import { useState } from 'react'
import KeyboardScanner from './KeyboardScanner.jsx'
import ImpactMessage from './ImpactMessage.jsx'
import { getManufacturingOrderByUid } from '../services/manufacturingOrderService.js'
import { getManufacturingOrderSynchronization } from '../services/manufacturingOrderSynchronizationService.js'

function SynchronizationValue({ label, value }) {
  if (!value) return null

  return (
    <div>
      <strong>{label} :</strong> production « {value.oldValue ?? '—'} », GPAO « {value.newValue ?? '—'} »
    </div>
  )
}

function ManufacturingOrderScanner({ onSelected, title = "Quel ordre de fabrication tester ?" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [synchronization, setSynchronization] = useState(null)
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
    setSynchronization(null)
    setLastUid(uid)
    setLoading(true)
    try {
      const res = await getManufacturingOrderByUid(uid)
      if (!res.ok || !res.data) {
        setError("Ordre introuvable ou erreur lors de la recherche.")
        return
      }

      const synchronizationResult = await getManufacturingOrderSynchronization(uid)
      if (!synchronizationResult.ok) {
        setError(synchronizationResult.errorMessage)
        return
      }

      if (!synchronizationResult.data.isSynchronized) {
        setSynchronization(synchronizationResult.data)
        return
      }

      if (typeof onSelected === 'function') {
        onSelected({ uid, data: res.data })
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
            <ImpactMessage variant="info" title="Vérification de l'ordre…">
              Recherche de l’OF et contrôle de sa synchronisation avec la GPAO.
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
        {synchronization && (
          <div className="message-block">
            <ImpactMessage variant="error" title="Ordre de fabrication désynchronisé">
              <div>{synchronization.message || "Cet ordre de fabrication n’est pas synchronisé avec la GPAO."}</div>
              <SynchronizationValue label="Quantité" value={synchronization.quantity} />
              <SynchronizationValue label="Premier numéro de série" value={synchronization.serialNumber} />
              <div>La poursuite des tests est bloquée. Corrigez la synchronisation, puis scannez de nouveau l’OF.</div>
            </ImpactMessage>
          </div>
        )}
        {lastUid && !loading && !error && !synchronization && (
          <div className="helper-text">
            Dernier UID saisi: <strong>{lastUid}</strong>
          </div>
        )}
      </div>
    </section>
  )
}

export default ManufacturingOrderScanner
