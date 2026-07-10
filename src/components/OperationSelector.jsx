import { useEffect, useMemo, useState } from 'react'
import ImpactMessage from './ImpactMessage.jsx'
import { getOperationsByProductUid } from '../services/operationService.js'

function OperationSelector({ productUid, onSelected, title = 'Sélectionner une opération' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ops, setOps] = useState([])
  const [query, setQuery] = useState('')
  const [selectedUid, setSelectedUid] = useState('')

  useEffect(() => {
    if (!productUid) return
    let cancelled = false

    const loadOperations = async () => {
      setLoading(true)
      setError('')
      setOps([])
      try {
        const { ok, status, data } = await getOperationsByProductUid(productUid)
        if (cancelled) return
        if (!ok || !Array.isArray(data)) {
          setError(`Impossible de charger les opérations (HTTP ${status || '—'})`)
          setOps([])
          return
        }
        const normalized = data.map((o) => ({
          ...o,
          _num: Number(String(o.operationNumber || '').replace(/[^0-9]/g, '')),
        }))
        normalized.sort((a, b) => (a._num || 0) - (b._num || 0))
        setOps(normalized)
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOperations()
    return () => {
      cancelled = true
    }
  }, [productUid])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ops
    return ops.filter((o) =>
      String(o.label || '').toLowerCase().includes(q) ||
      String(o.operationNumber || '').toLowerCase().includes(q) ||
      String(o.machine || '').toLowerCase().includes(q),
    )
  }, [ops, query])

  const selectedOp = useMemo(() => ops.find((o) => String(o.operationUid) === String(selectedUid)) || null, [ops, selectedUid])

  const confirm = () => {
    if (selectedOp && typeof onSelected === 'function') onSelected(selectedOp)
  }

  return (
    <section className="panel" aria-labelledby="opsel-title">
      <div className="panel-header">
        <div aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }} title="Opérations">📋</div>
        <h2 id="opsel-title">{title}</h2>
        <span className="panel-subtitle">Produit: <strong>{productUid || '—'}</strong></span>
      </div>
      <div className="panel-body">
        {loading && (
          <ImpactMessage variant="info" title="Chargement des opérations">
            Merci de patienter.
          </ImpactMessage>
        )}
        {error && (
          <ImpactMessage variant="error" title="Échec du chargement">
            {error}
          </ImpactMessage>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                type="text"
                placeholder="Filtrer (numéro, libellé, machine)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <select
                className="input"
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {filtered.map((o) => (
                  <option key={o.operationUid} value={o.operationUid}>
                    {String(o.operationNumber || '').padStart(2, '0')} — {o.label || ''} ({o.machine || '—'})
                  </option>
                ))}
              </select>
              <button className="btn" onClick={confirm} disabled={!selectedOp}>Valider</button>
            </div>

            {selectedOp && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                Sélection: <strong>{selectedOp.operationNumber}</strong> — {selectedOp.label} ({selectedOp.machine})
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default OperationSelector
