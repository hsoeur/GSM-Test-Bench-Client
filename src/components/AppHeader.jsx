export default function AppHeader({
  machineName,
  operator,
  onChangeMachine,
  onLogout,
}) {
  const operatorName = operator
    ? `${operator.lastName || ''} ${operator.firstName || ''}`.trim()
    : 'Non connecté'

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img
          src={`${import.meta.env.BASE_URL}assets/Amphitech-RVB.png`}
          alt="Amphitech"
          className="app-header__logo"
        />
        <span className="app-header__divider" aria-hidden="true" />
        <div>
          <div className="app-header__title">Test GSM</div>
          <div className="app-header__subtitle">Contrôle de production</div>
        </div>
      </div>

      <div className="app-header__meta">
        <div className="header-identity">
          <span className="header-identity__label">Poste</span>
          <strong className="header-identity__value">{machineName || 'À configurer'}</strong>
        </div>
        <span className={`status-badge ${machineName ? 'status-badge--success' : 'status-badge--warning'}`}>
          <span className="status-badge__dot" aria-hidden="true" />
          {machineName ? 'Poste prêt' : 'Configuration requise'}
        </span>
        {machineName && (
          <button className="btn-ghost btn-compact" type="button" onClick={onChangeMachine}>
            Changer le poste
          </button>
        )}
        <div className="header-identity">
          <span className="header-identity__label">Opérateur</span>
          <strong className="header-identity__value">{operatorName}</strong>
        </div>
        {operator && (
          <button className="btn-ghost btn-compact" type="button" onClick={onLogout}>
            Se déconnecter
          </button>
        )}
      </div>
    </header>
  )
}
