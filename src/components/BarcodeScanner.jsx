import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import ImpactMessage from './ImpactMessage.jsx'

function BarcodeScanner({ title = 'Scanner de code-barres', onScan, autoStart = false }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)

  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [lastResult, setLastResult] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((list) => {
        setDevices(list)
        if (list.length > 0) {
          setDeviceId(list[0].deviceId)
        }
      })
      .catch((e) => setError(String(e?.message || e)))

    return () => {
      try {
        controlsRef.current?.stop()
      } catch (error) {
        void error
      }
      try {
        readerRef.current?.reset()
      } catch (error) {
        void error
      }
    }
  }, [])

  useEffect(() => {
    if (autoStart && deviceId && !isScanning) {
      startScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, deviceId])

  
  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return
    setError('')
    setIsScanning(true)
    try {
      const controls = await readerRef.current.decodeFromVideoDevice(
        deviceId || undefined,
        videoRef.current,
        (result) => {
          if (result) {
            const text = result.getText()
            setLastResult(text)
            if (onScan) onScan(text)
          }
        },
      )
      controlsRef.current = controls
    } catch (e) {
      setError(String(e?.message || e))
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    try {
      controlsRef.current?.stop()
    } catch (error) {
      void error
    }
    try {
      readerRef.current?.reset()
    } catch (error) {
      void error
    }
    setIsScanning(false)
  }

  return (
    <div className="scanner">
      <div className="scanner-header">
        <strong>{title}</strong>
        <div className="scanner-controls">
          <select
            className="input"
            value={deviceId}
            disabled={isScanning || devices.length === 0}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || 'Caméra'}
              </option>
            ))}
          </select>

          {!isScanning ? (
            <button className="btn" onClick={startScanning} disabled={!deviceId}>
              Démarrer
            </button>
          ) : (
            <button className="btn" onClick={stopScanning}>Arrêter</button>
          )}
        </div>
      </div>

      <div className="scanner-body">
        <video ref={videoRef} className="scanner-video" muted playsInline />
      </div>

      {lastResult && (
        <ImpactMessage variant="success" title="Code scanné">
          Code: {lastResult}
        </ImpactMessage>
      )}
      {error && (
        <ImpactMessage variant="error" title="Échec du scan">
          {error}
        </ImpactMessage>
      )}
    </div>
  )
}

export default BarcodeScanner
