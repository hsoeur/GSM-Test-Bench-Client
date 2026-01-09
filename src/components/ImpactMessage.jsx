import React from 'react'

const icons = {
  success: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <path d="M9.5 12.5l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <path d="M12 8.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 11.5h2v5h-2z" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l9 16H3l9-16Z" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

function ImpactMessage({
  variant = 'info',
  title,
  children,
  actions,
  dismissible = false,
  onClose,
  role,
}) {
  const cls = `notice ${variant}`
  const ariaRole = role || (variant === 'error' || variant === 'warning' ? 'alert' : 'status')

  return (
    <div className={cls} role={ariaRole} aria-live={ariaRole === 'alert' ? 'assertive' : 'polite'}>
      <div className="notice-left" aria-hidden="true" />
      <div className="notice-icon" aria-hidden="true">{icons[variant] || icons.info}</div>
      <div className="notice-content">
        {title && <div className="notice-title">{title}</div>}
        {children && <div className="notice-desc">{children}</div>}
        {actions && <div className="notice-actions">{actions}</div>}
      </div>
      {dismissible && (
        <button
          type="button"
          className="notice-close"
          aria-label="Fermer"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  )
}

export default ImpactMessage
