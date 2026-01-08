import './App.css'
import Product from './components/Product.jsx'
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
        <Product productLabel="Product A" simSelectId="simSelectA" />
        <Product productLabel="Product B" simSelectId="simSelectB" />
      </main>
    </div>
  )
}

export default App
