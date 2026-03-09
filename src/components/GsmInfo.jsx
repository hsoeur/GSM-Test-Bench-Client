function GsmInfo({ phoneNumber, status, simUid }) {
  const getStatusLabel = () => {
    switch (status) {
      case 'idle':
        return { label: 'En attente', color: 'var(--muted)' }
      case 'calling':
        return { label: 'Appel en cours...', color: '#f59e0b' }
      case 'connected':
        return { label: 'Connecté', color: '#22c55e' }
      case 'error':
        return { label: 'Erreur', color: '#ef4444' }
      default:
        return { label: 'Inconnu', color: 'var(--muted)' }
    }
  }

  const statusInfo = getStatusLabel()

  return (
    <div className="gsm-info-panel">
      <div className="gsm-info-header">
        📡 Communication GSM
      </div>
      <div className="gsm-info-grid">
        <div className="gsm-info-item">
          <span className="gsm-info-label">Carte SIM</span>
          <span className="gsm-info-value">{simUid || '—'}</span>
        </div>
        <div className="gsm-info-item">
          <span className="gsm-info-label">Numéro appelé</span>
          <span className="gsm-info-value">{phoneNumber || '—'}</span>
        </div>
        <div className="gsm-info-item">
          <span className="gsm-info-label">Statut</span>
          <span className="gsm-info-value" style={{ color: statusInfo.color, fontWeight: 700 }}>
            {statusInfo.label}
          </span>
        </div>
      </div>
      {status === 'calling' && (
        <div className="gsm-info-waiting">
          <div className="spinner"></div>
          <span>Attente des 4 BIPs avant test...</span>
        </div>
      )}
      {status === 'connected' && (
        <div className="gsm-info-success">
          ✓ Vous pouvez maintenant tester la qualité de la phonie
        </div>
      )}
    </div>
  )
}

export default GsmInfo
