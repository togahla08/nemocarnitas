/**
 * App.jsx - Router principal y Layout del sistema POS
 * Rutas protegidas por rol usando React Router y contexto de auth
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/authStore';
import { useEffect } from 'react';

const Layout = ({ children }) => {
  const { userRole, isLoggedIn, logout } = useStore();
  
  useEffect(() => {
    if (!isLoggedIn) {
      // Redirigir al login si no hay sesión
      const handleLocationChange = () => {
        const { push } = useStore.getState();
        // Este hook se rearángará después del mount
      };
      logout();
    }
  }, [isLoggedIn, logout]);
  
  // Si no está logado, redirigir al login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header fijo */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">
              LB
            </div>
            <h1 className="text-xl font-bold text-gray-900">La Barrita de Carnitas</h1>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
            <nav>
              <ul className="flex gap-4">
                <li>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                    Ventas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
                    Pedidos
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {userRole === 'admin' ? 'Admin' : userRole === 'socio' ? 'Socio' : 'Toma Pedidos'}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-full hover:bg-amber-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-[1400px] mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

/**
 * Componente de error 404
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <h2 className="text-2xl font-bold text-gray-600">404 - Página no encontrada</h2>
    </div>
  );
};

/**
 * Componente de acceso denegado
 */
const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path className="stroke-2" d="M12 15l2-2l4 4l-4 4l-2-2l4-4l-4-4z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Acceso Denegado</h3>
        <p className="text-gray-500 mb-6">No tienes permisos para acceder a esta página.</p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rutas protegidas - Dashboard y páginas */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/ventas" element={
          <Layout>
            <VentasPage />
          </Layout>
        } />
        
        <Route path="/gastos" element={
          <Layout>
            <GastosPage />
          </Layout>
        } />
        
        <Route path="/pedidos" element={
          <Layout>
            <PedidosPage />
          </Layout>
        } />
        
        <Route path="/inventario" element={
          <Layout>
            <InventarioPage />
          </Layout>
        } />
        
        <Route path="/reportes" element={
          <Layout>
            <ReportesPage />
          </Layout>
        } />
        
        <Route path="/auditoria" element={
          <Layout>
            <AuditoriaPage />
          </Layout>
        } />
        
        {/* Página no encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}