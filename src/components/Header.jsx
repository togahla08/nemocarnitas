/**
 * Header.jsx - Header con logo, menú de usuario y notificaciones
 * Mostrado siempre en la parte superior del layout
 */

import { useStore } from '../store/authStore';
import { useEffect } from 'react';
import { 
  Menu, 
  LogOut, 
  Bell,
  Notification,
  User,
  Sun,
  Moon
} from 'lucide-react';

export default function Header() {
  const { userRole, user, isLoggedIn, toggleTheme, theme } = useStore();
  const [notificaciones, setNotificaciones] = useState(0);

  useEffect(() => {
    // Cargar notificaciones no leídas
    cargarNotificaciones();
  }, [userRole]);

  const cargarNotificaciones = async () => {
    try {
      if (userRole === 'admin') {
        const { count } = await supabase
          .from('auditoria')
          .select('*', { count: 'exact', head: true })
          .gt('fecha', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        setNotificaciones(count || 0);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        {/* Logo y título */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
            LB
          </div>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            La Barrita de Carnitas
          </h1>
        </div>

        {/* Menú móvil (solo en pantallas pequeñas) */}
        <button
          id="menu-mobile"
          onClick={() => document.getElementById('sidebar').classList.toggle('hidden')}
          className="md:hidden p-2 text-gray-600 hover:text-amber-600 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Menú de navegación principal */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#!" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
            Dashboard
          </a>
          <a href="#!" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
            Ventas
          </a>
          <a href="#!" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
            Pedidos
          </a>
          <a href="#!" className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
            Inventario
          </a>
        </nav>

        {/* Menú de usuario */}
        <div className="flex items-center gap-3">
          {/* Notificaciones -->
          <button
            onClick={() => {
              // Marcar como leídas
              setNotificaciones(0);
            }}
            className="relative p-2 text-gray-500 hover:text-amber-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificaciones > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-600" />
            )}
          </button>
          
          {/* User menu -->
          <div className="relative">
            <button
              onClick={() => alert('Menú de usuario - Configuración')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>{user?.nombre.split(' ')[0] || 'Usuario'}</span>
            </button>
            
            {/* Dropdown user menu (simulado) */}
            {true && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w max-w-xs">
                <button
                  onClick={logout}
                  className="w-full py-2 text-sm text-red-600 hover:bg-red-100 rounded-full mb-2"
                >
                  Cerrar sesión
                </button>
                <button
                  onClick={() => alert('Perfil')}
                  className="w-full py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  Ver perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}