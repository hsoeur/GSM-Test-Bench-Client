function SimSelector({
  id = 'simSelect',
  label = 'Choisir une carte SIM',
  options = [],
  value = '',
  onChange,
  style,
}) {
  const handleSimClick = (simValue) => {
    if (onChange) onChange(simValue)
  }

  return (
    <div style={{ marginTop: 12, ...(style || {}) }}>
      <label className="label" style={{ marginBottom: '16px', display: 'block' }}>{label}</label>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {options.map((opt, idx) => (
          <button
            key={opt.value || `sim-${idx}`}
            className={`btn btn-cta ${value === opt.value ? 'btn-selected' : ''}`}
            onClick={() => handleSimClick(opt.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: '32px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: value === opt.value ? '3px solid #2563eb' : '3px solid #d1d5db',
              transition: 'all 0.2s ease',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SimSelector
