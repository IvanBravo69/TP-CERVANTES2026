import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClientesPage from './pages/clientes/ClientesPage'
import PropiedadesPage from './pages/propiedades/PropiedadesPage'
import AgentesPage from './pages/agentes/AgentesPage'
import ContratosPage from './pages/contratos/ContratosPage'
import FinanzasPage from './pages/finanzas/FinanzasPage'
import CobrosPage from './pages/cobros/CobrosPage'
import PagosPage  from './pages/pagos/PagosPage'
import ServiciosPage from './pages/servicios/ServiciosPage'
import RecibosPage from './pages/recibos/RecibosPage'
import HonorariosPage from './pages/honorarios/HonorariosPage'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import RolesPage from './pages/roles/RolesPage'
import ReportesPage from './pages/reportes/ReportesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="clientes"    element={<ClientesPage />} />
            <Route path="propiedades" element={<PropiedadesPage />} />
            <Route path="agentes"     element={<AgentesPage />} />
            <Route path="contratos"   element={<ContratosPage />} />
            <Route path="finanzas"    element={<FinanzasPage />} />
            <Route path="cobros"      element={<CobrosPage />} />
            <Route path="pagos"       element={<PagosPage />} />
            <Route path="servicios"   element={<ServiciosPage />} />
            <Route path="recibos"     element={<RecibosPage />} />
            <Route path="honorarios"  element={<HonorariosPage />} />
            <Route path="usuarios"    element={<UsuariosPage />} />
            <Route path="roles"       element={<RolesPage />} />
            <Route path="reportes"    element={<ReportesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
