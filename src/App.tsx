import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Cadastrar from './pages/Cadastrar'
import Sucesso from './pages/Sucesso'
import Cancelado from './pages/Cancelado'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        <Route path="/inscricao/sucesso" element={<Sucesso />} />
        <Route path="/inscricao/cancelado" element={<Cancelado />} />
      </Routes>
    </BrowserRouter>
  )
}
