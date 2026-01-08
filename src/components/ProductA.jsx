import KeyboardScanner from './KeyboardScanner.jsx'

function ProductA() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Product A</h2>
      </div>
      <div className="panel-body">
        <KeyboardScanner title="Scanner Numéro de série" showCaptureButton={false} />
      </div>
    </div>
  )
}

export default ProductA
