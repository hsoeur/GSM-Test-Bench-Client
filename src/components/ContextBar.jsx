export default function ContextBar({
  manufacturingOrder,
  operation,
  simAssignments,
  onChangeManufacturingOrder,
  onChangeOperation,
  onChangeSimAssignments,
}) {
  if (!manufacturingOrder && !operation && !simAssignments) return null

  return (
    <section className="context-bar" aria-label="Contexte de production">
      <div className="context-bar__items">
        {manufacturingOrder && (
          <div className="context-item">
            <span className="context-item__label">Ordre de fabrication</span>
            <strong className="context-item__value">
              {manufacturingOrder.data?.manufacturingOrderNumber || manufacturingOrder.uid}
            </strong>
          </div>
        )}
        {manufacturingOrder?.data?.productUid && (
          <div className="context-item">
            <span className="context-item__label">Produit</span>
            <strong className="context-item__value">{manufacturingOrder.data.productUid}</strong>
          </div>
        )}
        {operation && (
          <div className="context-item context-item--wide">
            <span className="context-item__label">Opération</span>
            <strong className="context-item__value">
              {operation.operationNumber} — {operation.label}
            </strong>
          </div>
        )}
      </div>

      <div className="context-bar__actions" aria-label="Modifier le contexte">
        {manufacturingOrder && (
          <button className="btn-ghost btn-compact" type="button" onClick={onChangeManufacturingOrder}>
            Changer l’OF
          </button>
        )}
        {operation && (
          <button className="btn-ghost btn-compact" type="button" onClick={onChangeOperation}>
            Changer l’opération
          </button>
        )}
        {simAssignments && (
          <button className="btn-ghost btn-compact" type="button" onClick={onChangeSimAssignments}>
            Changer les SIM
          </button>
        )}
      </div>
    </section>
  )
}
