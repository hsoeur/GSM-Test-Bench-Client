function SimSelector({
  id = 'simSelect',
  label = 'Choisir une carte SIM',
  options = [],
  value = '',
  onChange,
  style,
}) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return (
    <div style={{ marginTop: 12, ...(style || {}) }}>
      <label className="label" htmlFor={id}>{label}</label>
      <div>
        <select
          id={id}
          className="input"
          value={value}
          onChange={handleChange}
          style={{ width: '100%' }}
        >
          <option value="">-- Sélectionner une carte SIM --</option>
          {options.map((opt, idx) => (
            <option key={opt.value || `sim-${idx}`} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default SimSelector
