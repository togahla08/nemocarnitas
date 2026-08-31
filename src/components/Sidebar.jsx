/**
 * Sidebar.jsx - Menú lateral dinámico según el rol del usuario
 * Visible en pantallas medianas y grandes, oculto en móviles
 */

import { useStore } from '../store/authStore';
import { useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Box,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
  Truck,
  CreditCard,
  Pallet,
  AlertCircle,
  Folder,
  BarChart2,
  BarChart3,
  Microscope,
  Image
} from 'lucide-react';

export default function Sidebar() {
  const { userRole, user } = useStore();
  const [open, setOpen] = useState(false);

  const menus = {
    admin: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/ventas', label: 'Ventas', icon: Receipt },
      { path: '/gastos', label: 'Gastos', icon: Folder },
      { path: '/pedidos', label: 'Pedidos', icon: MessageCircle },
      { path: '/inventario', label: 'Inventario', icon: Pallet },
      { path: '/reportes', label: 'Reportes', icon: BarChart3 },
      { path: '/auditoria', label: 'Auditoría', icon: Microscope },
    ],
    socio: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/ventas', label: 'Mis Ventas', icon: Receipt },
      { path: '/gastos', label: 'Mis Gastos', icon: Folder },
      { path: '/pedidos', label: 'Mis Pedidos', icon: MessageCircle },
      { path: '/inventario', label: 'Inventario', icon: Pallet },
      { path: '/reportes', label: 'Reportes Básicos', icon: BarChart2 },
    ],
    toma_pedidos: [
      { path: '/pedidos', label: 'Pedidos', icon: MessageCircle },
      { path: '/inventario', label: 'Inventario', icon: Pallet },
    ]
  };

  const menuItems = menus[userRole] || menus.toma_pedidos;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-2xl transform -translate-x-full sm:translate-x-0 transition-transform duration-300 z-50")
      id="sidebar"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <Menu className="w-6 h-6 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Menú</h2>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {userRole === 'admin' && (
                <svg className="w-3 h-3 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6"/>
                </svg>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer del sidebar */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full py-3 text-sm text-red-600 hover:bg-red-100 rounded-full mb-2"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}