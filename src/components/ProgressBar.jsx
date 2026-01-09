import React from 'react'

function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value ?? 0, min), max)
}

function paletteFor(pct) {
  if (pct < 33) {
    return {
      a: '#F59E0B', // amber-500
      b: '#F97316', // orange-500
      glow: 'rgba(245, 158, 11, 0.35)'
    }
  }
  if (pct < 66) {
    return {
      a: '#3B82F6', // blue-500
      b: '#6366F1', // indigo-500
      glow: 'rgba(59, 130, 246, 0.35)'
    }
  }
  return {
    a: '#10B981', // emerald-500
    b: '#22C55E', // green-500
    glow: 'rgba(16, 185, 129, 0.35)'
  }
}

export default function ProgressBar({ value = 0, label, height = 12 }) {
  const pct = clamp(value)
  const { a, b, glow } = paletteFor(pct)

  const containerStyle = {
    width: '100%',
    background: 'linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%)',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #e5eaf0',
    height,
    boxShadow: 'inset 0 1px 2px rgba(16, 24, 40, 0.08)'
  }

  const barStyle = {
    width: `${pct}%`,
    height: '100%',
    backgroundImage: `linear-gradient(90deg, ${a} 0%, ${b} 100%), linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)`,
    backgroundBlendMode: 'overlay, normal',
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.25), 0 4px 12px ${glow}`,
    borderRadius: 8,
    transition: 'width 240ms ease, box-shadow 240ms ease, background 240ms ease',
    filter: 'saturate(1.1)'
  }

  const caption = label ?? `${pct}%`

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={containerStyle} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} role="progressbar">
        <div style={barStyle} />
      </div>
      <div style={{ fontSize: 12, color: '#334155' }}>{caption}</div>
    </div>
  )
}
