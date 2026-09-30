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
    <section className="sim-assignment" aria-labelledby="sim-assignment-title">
      <div className="sim-assignment__header">
        <h2 id="sim-assignment-title">Quelles cartes SIM utiliser ?</h2>
        <p>Sélectionnez une carte différente pour chaque produit. Le choix reste actif pendant la session.</p>
      </div>

      {loading && (
        <div className="loading-state" role="status"><span className="spinner" /> Chargement des cartes SIM…</div>
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
          <div className="sim-assignment__group">
            <div className="sim-assignment__label">Produit A</div>
            <SimSelector
              id="simAssignA"
              label=""
              options={simOptions}
              value={simA}
              onChange={setSimA}
            />
          </div>

          <div className="sim-assignment__group">
            <div className="sim-assignment__label">Produit B</div>
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
            className="btn btn-cta sim-assignment__submit"
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirmer la sélection
          </button>
        </>
      )}
    </section>
  )
}

export default SimAssignment
