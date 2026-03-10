import { useState } from 'react'

function TestTypeSelector({ onSelected, title = 'Sélection du type de test' }) {
  const [selectedType, setSelectedType] = useState('')

  const testTypes = [
    {
      id: 'simple',
      label: 'Produit simple',
      description: 'Test d\'un produit unique',
      icon: '📱'
    },
    {
      id: 'couple',
      label: 'Couple carte mère / carte fille',
      description: 'Test d\'un ensemble carte mère avec carte fille',
      icon: '🔗'
    }
  ]

  const handleConfirm = () => {
    if (selectedType && typeof onSelected === 'function') {
      onSelected(selectedType)
    }
  }

  return (
    <section className="panel" aria-labelledby="testtype-title">
      <div className="panel-header">
        <div aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }} title="Type de test">
          ⚙️
        </div>
        <h2 id="testtype-title">{title}</h2>
        <span className="panel-subtitle">Choisissez le mode de test à effectuer.</span>
      </div>
      <div className="panel-body">
        <label className="form-label" htmlFor="testtype-select">Type de test</label>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {testTypes.map((type) => (
            <label
              key={type.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 16,
                border: selectedType === type.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: selectedType === type.id ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="radio"
                name="testType"
                value={type.id}
                checked={selectedType === type.id}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ marginTop: 2, cursor: 'pointer' }}
              />
              <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>
                {type.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {type.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {type.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" type="button" onClick={handleConfirm} disabled={!selectedType}>
            Valider
          </button>
        </div>
      </div>
    </section>
  )
}

export default TestTypeSelector
