function TestSequence({ serial, product = 'Produit' }) {
  return (
    <div className="test-sequence">
      <div className="panel-header">
        <h2>Séquence de test — {product}</h2>
        <span className="panel-subtitle">Numéro de série: {serial}</span>
      </div>
      <div className="panel-body">
        <div className="result ok">Préparation de la séquence de test...</div>
        <p>Cette section peut être remplacée par vos étapes de test réelles.</p>
      </div>
    </div>
  )
}

export default TestSequence
