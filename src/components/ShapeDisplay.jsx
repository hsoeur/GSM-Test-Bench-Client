import grayShape from '../assets/gray_shape.png'
import blueShape from '../assets/blue_shape.png'
import greenShape from '../assets/green_shape.png'
import redShape from '../assets/red_shape.png'
import yellowShape from '../assets/yellow_shape.png'

function ShapeDisplay({ serial = '', sim = '', ready = false, shape: forcedShape, style }) {
  const autoShape = sim ? (ready ? 'blue' : 'yellow') : 'gray'
  const shape = forcedShape ?? autoShape

  const srcMap = {
    gray: grayShape,
    blue: blueShape,
    green: greenShape,
    red: redShape,
    yellow: yellowShape,
  }

  const src = shape ? srcMap[shape] : null

  if (!src) return null

  return (
    <div className="scanner-body" style={style}>
      <div className="shape-container">
        <img src={src} alt={`${shape} shape`} className="shape-image" />
        {shape === 'gray' && (
          <div className="shape-overlay gray">
            <span className="shape-overlay-text">Veuillez scanner le code barre du produit et choisir une carte SIM</span>
          </div>
        )}
        {shape === 'yellow' && (
          <div className="shape-overlay yellow">
            <span className="shape-overlay-text">Confirmer que la LED verte est allumée</span>
          </div>
        )}
        {shape === 'blue' && (
          <div className="shape-overlay blue">
            <span className="shape-overlay-text">En cours de test</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShapeDisplay
