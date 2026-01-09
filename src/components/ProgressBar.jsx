import React from 'react'

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value ?? 0, min), max)
}

export default function ProgressBar({ value = 0, label, height = 12 }) {
  const pct = clamp(value)

  const containerStyle = {
    width: '100%',
    background: '#eee',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #ddd',
    height,
  }

  const barStyle = {
    width: `${pct}%`,
    height: '100%',
    background:
      pct < 33 ? '#ffb74d' : pct < 66 ? '#64b5f6' : '#66bb6a',
    transition: 'width 200ms ease',
  }

  const caption = label ?? `${pct}%`

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={containerStyle} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} role="progressbar">
        <div style={barStyle} />
      </div>
      <div style={{ fontSize: 12, color: '#555' }}>{caption}</div>
    </div>
  )
}
