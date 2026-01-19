import { useEffect, useMemo, useState } from 'react'
import { getCurrentOperators, operatorLabel } from '../services/operatorService'

export default function OperatorAuth({
  onAuthenticated,
  title = 'Authentification',
  description = "Sélectionnez votre nom pour vous connecter.",
  storageKey = null,
  timeoutMs = 6000,
  autoSelectIfSingle = true,
  icon = '👤',
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [operators, setOperators] = useState([])
  const [selectedUid, setSelectedUid] = useState(null)

  const selectedOperator = useMemo(() => operators.find((o) => String(o.userUid) === String(selectedUid)) || null, [operators, selectedUid])

  const load = async () => {
    setLoading(true)
    setError(null)
    const res = await getCurrentOperators(timeoutMs)
    if (!res.ok) {
      setError('Impossible de charger la liste des opérateurs.')
      setOperators([])
      setLoading(false)
      return
    }
    setOperators(res.data)
    setLoading(false)
    try {
      if (storageKey) {
        const stored = window.localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.userUid) setSelectedUid(String(parsed.userUid))
        }
      }
      if (autoSelectIfSingle && res.data.length === 1) {
        setSelectedUid(String(res.data[0].userUid))
      }
    } catch (_) {}
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConfirm = () => {
    if (!selectedOperator) return
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(selectedOperator))
      } catch (_) {}
    }
    if (typeof onAuthenticated === 'function') onAuthenticated(selectedOperator)
  }

  return (
    <section className="panel" aria-labelledby="auth-title">
      <div className="panel-header">
        <div aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }} title="Utilisateur">
          {icon}
        </div>
        <h2 id="auth-title">{title}</h2>
        <span className="panel-subtitle">{description}</span>
      </div>
      <div className="panel-body" role="form">
        {loading ? (
          <div className="notice info" role="status" aria-live="polite">
            <div className="notice-left" />
            <div className="notice-icon">⏳</div>
            <div>
              <div className="notice-title">Chargement des opérateurs…</div>
              <div className="notice-desc">Merci de patienter.</div>
            </div>
          </div>
        ) : error ? (
          <div className="notice error" role="alert">
            <div className="notice-left" />
            <div className="notice-icon">⚠️</div>
            <div>
              <div className="notice-title">{error}</div>
              <div className="notice-actions">
                <button className="btn" type="button" onClick={load}>Réessayer</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <label className="form-label" htmlFor="operator-select">Opérateur</label>
            <select
              id="operator-select"
              className="input"
              value={selectedUid || ''}
              onChange={(e) => setSelectedUid(e.target.value || null)}
            >
              <option value="">— Sélectionner —</option>
              {operators.map((op) => (
                <option key={op.userUid} value={op.userUid}>
                  {operatorLabel(op)}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="button" onClick={handleConfirm} disabled={!selectedOperator}>
                Se connecter
              </button>
              <button className="btn-ghost" type="button" onClick={load}>
                Actualiser
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
