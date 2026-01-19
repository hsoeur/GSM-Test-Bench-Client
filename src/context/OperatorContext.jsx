import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const OperatorContext = createContext(null)

export function OperatorProvider({ children, storageKey = null }) {
  const [operator, setOperator] = useState(null)

  useEffect(() => {
    if (!storageKey) return
    try {
      const s = window.localStorage.getItem(storageKey)
      if (s) setOperator(JSON.parse(s))
    } catch (_) {}
  }, [storageKey])

  const login = (op) => {
    setOperator(op)
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(op))
    } catch (_) {}
  }

  const logout = () => {
    setOperator(null)
    if (!storageKey) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch (_) {}
  }

  const value = useMemo(() => ({ operator, login, logout, setOperator: login }), [operator])

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
}

export function useOperator() {
  const ctx = useContext(OperatorContext)
  if (!ctx) throw new Error('useOperator must be used within OperatorProvider')
  return ctx
}
