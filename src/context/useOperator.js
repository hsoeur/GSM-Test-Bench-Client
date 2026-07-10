import { useContext } from 'react'
import { OperatorContext } from './operatorContextValue.js'

export function useOperator() {
  const ctx = useContext(OperatorContext)
  if (!ctx) throw new Error('useOperator must be used within OperatorProvider')
  return ctx
}
