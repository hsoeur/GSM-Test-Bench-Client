function SimSelector({
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
    <div className="sim-selector" style={style}>
      {label && <div className="label">{label}</div>}
      <div className="sim-options" role="group" aria-label={label || 'Choisir une carte SIM'}>
        {options.map((opt, idx) => (
          <button
            key={opt.value || `sim-${idx}`}
            type="button"
            className={`sim-option ${value === opt.value ? 'is-selected' : ''}`}
            onClick={() => handleSimClick(opt.value)}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SimSelector
