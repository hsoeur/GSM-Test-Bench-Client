import './App.css'
import ProductA from './components/ProductA.jsx'
import ProductB from './components/ProductB.jsx'

function App() {
  return (
    <div className="split-view">
      <ProductA />
      <ProductB />
    </div>
  )
}

export default App
