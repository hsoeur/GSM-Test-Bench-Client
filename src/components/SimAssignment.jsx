import { useState, useEffect } from 'react'
import { getSimCards, toSimOption } from '../services/simCardService.js'
import SimSelector from './SimSelector.jsx'
import ImpactMessage from './ImpactMessage.jsx'

/**
 * Screen displayed once per session to assign a SIM card to Product A and Product B.
 * Calls onConfirm({ simA: simCardNumber, simB: simCardNumber }) when the user validates.
 */
function SimAssignment({ onConfirm }) {
  const [simList, setSimList] = useState([])
  const [simOptions, setSimOptions] = useState([])
  const [simA, setSimA] = useState('') // simCardUid selected for Product A
  const [simB, setSimB] = useState('') // simCardUid selected for Product B
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { ok, status, data } = await getSimCards(5000)
      if (cancelled) return
      setLoading(false)
      if (!ok) {
        setError(`Échec de récupération des cartes SIM (HTTP ${status || '—'})`)
        return
      }
      setSimList(data)
      setSimOptions(data.map(toSimOption))
    })()
    return () => { cancelled = true }
  }, [])

  const handleConfirm = () => {
    const simANumber = String(simList.find(s => String(s.simCardUid) === simA)?.simCardNumber || '')
    const simBNumber = String(simList.find(s => String(s.simCardUid) === simB)?.simCardNumber || '')
    onConfirm({ simA: simANumber, simB: simBNumber })
  }

  const canConfirm = !loading && !error && simA && simB && simA !== simB

  return (
    <div style={{ maxWidth: 640, width: '100%', padding: '0 16px' }}>
      <h2 style={{ marginBottom: '0.25rem' }}>Attribution des cartes SIM</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem', marginTop: 0 }}>
        Sélectionnez une carte SIM pour chaque produit. Ce choix sera conservé pendant toute la session.
      </p>

      {loading && (
        <p style={{ color: 'var(--muted)' }}>Chargement des cartes SIM…</p>
      )}

      {error && (
        <ImpactMessage
          variant="error"
          title="Erreur"
          actions={
            <button className="btn" type="button" onClick={() => {
              setError('')
              setLoading(true)
              getSimCards(5000).then(({ ok, status, data }) => {
                setLoading(false)
                if (!ok) { setError(`Échec de récupération des cartes SIM (HTTP ${status || '—'})`); return }
                setSimList(data)
                setSimOptions(data.map(toSimOption))
              })
            }}>
              Réessayer
            </button>
          }
        >
          {error}
        </ImpactMessage>
      )}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Product A
            </div>
            <SimSelector
              id="simAssignA"
              label=""
              options={simOptions}
              value={simA}
              onChange={setSimA}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Product B
            </div>
            <SimSelector
              id="simAssignB"
              label=""
              options={simOptions}
              value={simB}
              onChange={setSimB}
            />
          </div>

          {simA && simB && simA === simB && (
            <ImpactMessage variant="warning" title="Conflit de SIM">
              Les deux produits ne peuvent pas utiliser la même carte SIM.
            </ImpactMessage>
          )}

          <button
            className="btn btn-cta"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            style={{ marginTop: '1rem', width: '100%', padding: '16px' }}
          >
            Confirmer la sélection
          </button>
        </>
      )}
    </div>
  )
}

export default SimAssignment
