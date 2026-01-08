import { useEffect, useRef, useState } from 'react'

function KeyboardScanner({
  title = 'Scanner USB (clavier)',
  onScan,
  validate,
  onValid,
  onInvalid,
  invalidMessage = 'Veuillez entrer un numéro de série valide',
  suffixKeys = ['Enter', 'Tab'],
  autoFocus = true,
  clearAfterScan = true,
  minLength = 3,
  showCaptureButton = true,
  showLastResult = true,
}) {
  const inputRef = useRef(null)
  const [buffer, setBuffer] = useState('')
  const [lastResult, setLastResult] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const commitScan = () => {
    const value = buffer.trim()
    if (value.length >= minLength) {
      const isValid = validate ? !!validate(value) : true
      if (isValid) {
        setErrorMsg('')
        setLastResult(value)
        if (onScan) onScan(value)
        if (onValid) onValid(value)
        if (clearAfterScan) setBuffer('')
      } else {
        setLastResult('')
        setErrorMsg(invalidMessage)
        if (onInvalid) onInvalid(value)
      }
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
          {showCaptureButton && (
            <button className="btn" onClick={focusCapture}>Capturer</button>
          )}
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
      {errorMsg && <div className="result ko">{errorMsg}</div>}
      {showLastResult && lastResult && <div className="result ok">Code: {lastResult}</div>}
    </div>
  )
}

export default KeyboardScanner
