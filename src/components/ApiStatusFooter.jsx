import { useEffect, useMemo, useRef, useState } from 'react'
import { request } from '../services/http'

function useInterval(callback, delay) {
  const savedCallback = useRef()
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current && savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

const StatusPill = ({ state, label, onClick, variant = 'main' }) => {
  let cls = 'na'
  if (state === 'ok') cls = 'ok'
  else if (state === 'ko') cls = 'ko'
  else if (state === 'pending') cls = 'pending'
  return (
    <button className={`status-pill ${cls} ${variant === 'sub' ? 'sub' : ''}`} title={label} onClick={onClick} type="button">
      <span className="dot" />
      <span className="pill-label">{label}</span>
    </button>
  )
}

export default function ApiStatusFooter({
  endpoints = [
    { id: 'data', label: 'API DATA', url: '' },
    { id: 'test', label: 'API TEST GSM', url: '' },
  ],
  pollIntervalMs = 10000,
  timeoutMs = 4000,
  method = 'GET',
}) {
  const [states, setStates] = useState(() => {
    const init = {}
    endpoints.forEach((e) => (init[e.id] = e.url ? 'pending' : 'na'))
    return init
  })
  const [details, setDetails] = useState({})
  const [openId, setOpenId] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)
  const activeEndpoints = useMemo(() => endpoints.map((e) => ({ ...e, method: e.method || method })), [endpoints, method])

  const checkAll = async () => {
    const newStates = { ...states }
    const newDetails = { ...details }
    const checks = activeEndpoints.map(async (ep) => {
      if (!ep.url) {
        // Prefer custom checker if provided
        if (typeof ep.check === 'function') {
          try {
            newStates[ep.id] = 'pending'
            const result = await ep.check(timeoutMs)
            newStates[ep.id] = result?.state || 'ko'
            if (result?.details) newDetails[ep.id] = result.details
            else delete newDetails[ep.id]
          } catch (_) {
            newStates[ep.id] = 'ko'
            delete newDetails[ep.id]
          }
        } else {
          newStates[ep.id] = 'na'
          delete newDetails[ep.id]
        }
        return
      }
      try {
        newStates[ep.id] = 'pending'
        const res = await request(ep.url, { method: ep.method, timeout: timeoutMs })
        if (typeof ep.parse === 'function') {
          try {
            const parsed = await ep.parse(res)
            newStates[ep.id] = parsed && parsed.state ? parsed.state : (res.ok ? 'ok' : 'ko')
            if (parsed && parsed.details) newDetails[ep.id] = parsed.details
            else delete newDetails[ep.id]
          } catch (e) {
            newStates[ep.id] = 'ko'
            delete newDetails[ep.id]
          }
        } else {
          newStates[ep.id] = res.ok ? 'ok' : 'ko'
          delete newDetails[ep.id]
        }
      } catch (err) {
        newStates[ep.id] = 'ko'
        delete newDetails[ep.id]
      }
    })
    await Promise.all(checks)
    setStates(newStates)
    setDetails(newDetails)
    setLastChecked(new Date())
  }

  useEffect(() => {
    // Reset states when endpoints change
    const init = {}
    activeEndpoints.forEach((e) => (init[e.id] = e.url ? 'pending' : 'na'))
    setStates(init)
    setDetails({})
    setOpenId(null)
  }, [activeEndpoints])

  useEffect(() => {
    // Initial check once mounted
    checkAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useInterval(() => {
    checkAll()
  }, pollIntervalMs)

  const formatTime = (d) => {
    if (!d) return '—'
    return d.toLocaleTimeString()
  }

  return (
    <footer className="status-footer" role="contentinfo">
      <div className="status-footer-inner">
        <div className="status-left">
          <span className="status-title">Statut APIs</span>
          <div className="status-list">
            {activeEndpoints.map((ep) => {
              const hasDetails = !!details[ep.id]
              const isOpen = openId === ep.id
              const subIndicators = Array.isArray(ep.subIndicators) ? ep.subIndicators : []
              return (
                <div className="status-item" key={ep.id}>
                  <StatusPill
                    state={states[ep.id]}
                    label={ep.label}
                    onClick={() => {
                      if (hasDetails) setOpenId(isOpen ? null : ep.id)
                    }}
                  />
                  {subIndicators.length > 0 && (
                    <div className="status-sub-list">
                      {subIndicators.map((si) => {
                        const val = details[ep.id]?.[si.key]
                        const st = val === true ? 'ok' : val === false ? 'ko' : 'na'
                        return (
                          <StatusPill key={`${ep.id}-${si.key}`} state={st} label={si.label} variant="sub" />
                        )
                      })}
                    </div>
                  )}
                  {hasDetails && isOpen && (
                    <div className="status-details" role="dialog" aria-label={`Détails ${ep.label}`}>
                      {Object.entries(details[ep.id]).map(([k, v]) => (
                        <div className="status-detail-item" key={k}>
                          <span className={`mini-dot ${v === true ? 'ok' : v === false ? 'ko' : 'na'}`} />
                          <span className="detail-label">{labelForKey(k)}</span>
                          <span className="detail-value">{formatBool(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="status-right">
          <span className="last-check">Dernier contrôle: {formatTime(lastChecked)}</span>
          <button className="btn btn-ghost" type="button" onClick={checkAll}>
            Actualiser
          </button>
        </div>
      </div>
    </footer>
  )
}

function labelForKey(key) {
  switch (key) {
    case 'api':
      return 'API'
    case 'portOpen':
      return 'Port'
    case 'modemOk':
      return 'Modem'
    case 'database':
      return 'Base'
    default:
      return key
  }
}

function formatBool(v) {
  if (v === true) return 'OK'
  if (v === false) return 'KO'
  return '—'
}
