function Pictogram({ name, size = 120 }) {
  const renderIcon = () => {
    switch (name) {
      case 'barcode-scan':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 9v6M10 9v6M13 9v6M16 9v6" />
            <path d="M3 3L6 6M21 3L18 6M3 21L6 18M21 21L18 18" strokeLinecap="round" />
          </svg>
        )

      case 'sim-card':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2L16 2L20 6L20 22L4 22L4 2Z" />
            <path d="M16 2L20 6L16 6Z" fill="currentColor" />
            <rect x="7" y="10" width="10" height="8" rx="1" />
            <path d="M9 12h6M9 14h6M9 16h6" strokeWidth="1" />
          </svg>
        )

      case 'sim-insert':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* SIM card slot/device */}
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <rect x="6" y="8" width="5" height="7" rx="0.5" strokeWidth="1.2" />
            {/* SIM card chip pattern */}
            <path d="M7 10h3M7 11.5h3M7 13h3" strokeWidth="0.8" />
            {/* Power button/switch */}
            <circle cx="17" cy="12" r="2.5" />
            <path d="M17 10v2" strokeWidth="1.2" strokeLinecap="round" />
            {/* Arrow indicating insertion */}
            <path d="M8.5 2L8.5 5" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6.5 4L8.5 6L10.5 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )

      case 'power-check':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5" strokeLinecap="round" />
            <circle cx="12" cy="15" r="0.5" fill="currentColor" />
            <path d="M8 4L6 6M16 4L18 6M8 20L6 18M16 20L18 18" strokeLinecap="round" />
          </svg>
        )

      case 'phone-call':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            <path d="M15 5h6M18 2v6" strokeLinecap="round" />
          </svg>
        )

      case 'battery-switch':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="7" width="18" height="10" rx="2" />
            <path d="M20 10h2v4h-2" />
            <path d="M6 12h8" strokeLinecap="round" />
            <circle cx="10" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        )

      case 'check-circle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )

      case 'check-good':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <circle cx="12" cy="12" r="10" fill="#22c55e" fillOpacity="0.15" />
            <path d="M8 12l3 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )

      case 'check-bad':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" fill="#ef4444" fillOpacity="0.15" />
            <path d="M8 8l8 8M16 8l-8 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )

      default:
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        )
    }
  }

  return (
    <div className="pictogram" style={{ color: 'var(--primary)' }}>
      {renderIcon()}
    </div>
  )
}

export default Pictogram
