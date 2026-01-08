import './App.css'
import ProductA from './components/ProductA.jsx'
import ProductB from './components/ProductB.jsx'
import logo from './assets/logo.jpg'

function App() {
  return (
    <div className="app">
      <header className="brand-header">
        <div className="brand-bar">
          <img src={logo} alt="Test GSM" className="brand-logo" />
          <div className="brand-name">Test GSM</div>
        </div>
      </header>
      <main className="split-view">
        <ProductA />
        <ProductB />
      </main>
    </div>
  )
}

export default App
