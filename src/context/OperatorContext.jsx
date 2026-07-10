import { useCallback, useMemo, useState } from 'react'
import { OperatorContext } from './operatorContextValue.js'

export function OperatorProvider({ children, storageKey = null }) {
  const [operator, setOperator] = useState(() => {
    if (!storageKey) return null
    try {
      const s = window.localStorage.getItem(storageKey)
      return s ? JSON.parse(s) : null
    } catch (error) {
      void error
      return null
    }
  })

  const login = useCallback((op) => {
    setOperator(op)
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(op))
    } catch (error) {
      void error
    }
  }, [storageKey])

  const logout = useCallback(() => {
    setOperator(null)
    if (!storageKey) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch (error) {
      void error
    }
  }, [storageKey])

  const value = useMemo(() => ({ operator, login, logout, setOperator: login }), [operator, login, logout])

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
}
