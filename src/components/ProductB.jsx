import KeyboardScanner from './KeyboardScanner.jsx'

function ProductB() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Product B</h2>
      </div>
      <div className="panel-body">
        <KeyboardScanner title="Scanner Numéro de série" showCaptureButton={false} />
      </div>
    </div>
  )
}

export default ProductB
