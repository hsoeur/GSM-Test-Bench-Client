function SimSelector({
  id = 'simSelect',
  label = 'Choisir une carte SIM',
  confirmText = 'Continuer',
  options = [],
  value = '',
  onChange,
  onConfirm,
  disabled = false,
  style,
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  const canConfirm = !!value && !disabled

  return (
    <div style={{ marginTop: 12, ...(style || {}) }}>
      <label className="label" htmlFor={id}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          id={id}
          className="input"
          value={value}
          disabled={disabled}
          onChange={handleChange}
          style={{ flex: 1, minWidth: 0 }}
        >
          <option value="">-- Sélectionner une carte SIM --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button className="btn" onClick={onConfirm} disabled={!canConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  )
}

export default SimSelector
