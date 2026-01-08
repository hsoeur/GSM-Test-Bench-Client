import { useEffect, useRef, useState } from 'react'

function KeyboardScanner({
  title = 'Scanner USB (clavier)',
  onScan,
  suffixKeys = ['Enter', 'Tab'],
  autoFocus = true,
  clearAfterScan = true,
  minLength = 3,
}) {
  const inputRef = useRef(null)
  const [buffer, setBuffer] = useState('')
  const [lastResult, setLastResult] = useState('')

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const commitScan = () => {
    const value = buffer.trim()
    if (value.length >= minLength) {
      setLastResult(value)
      if (onScan) onScan(value)
      if (clearAfterScan) setBuffer('')
    }
  }

  const onKeyDown = (e) => {
    if (suffixKeys.includes(e.key)) {
      e.preventDefault()
      commitScan()
    }
  }

  const onChange = (e) => {
    setBuffer(e.target.value)
  }

  const focusCapture = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="kbd-scanner">
      <div className="scanner-header">
        <strong>{title}</strong>
        <div className="scanner-controls">
          <button className="btn" onClick={focusCapture}>Capturer</button>
        </div>
      </div>

      <div className="scanner-body">
        <input
          ref={inputRef}
          className="kbd-input input"
          type="text"
          placeholder="Scanner ou saisir"
          value={buffer}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </div>

      {lastResult && <div className="result ok">Code: {lastResult}</div>}
    </div>
  )
}

export default KeyboardScanner
