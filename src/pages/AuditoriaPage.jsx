/**
 * AuditoriaPage.jsx - Log de cambios con filtros (solo admin)
 * Registro de quién hizo qué, cuándo, en qué tabla y qué cambió
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  Loader2,
  Users,
  Clock,
  Filter,
  AlertCircle,
  Search,
  Folder,
  FileText,
  Layout,
  RefreshCw,
  Settings
} from 'lucide-react';

export default function AuditoriaPage() {
  const { userRole, user } = useStore();
  const [auditoria, setAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tabla: '',
    accion: '',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    if (userRole !== 'admin') {
      alert('Solo el administrador puede ver el auditoría completa');
      return;
    }
    cargarAuditoria();
  }, [userRole, filtros]);

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      let query = supabase.from('auditoria').select(`
        *,
        usuarios:nombre
      `).order('fecha', { ascending: false });

      // Aplicar filtros
      if (filtros.tabla) {
        query = query.eq('tabla', filtros.tabla);
      }
      if (filtros.accion) {
        query = query.eq('accion', filtros.accion);
      }
      if (filtros.fechaInicio) {
        query = query.gte('fecha', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha', filtros.fechaFin);
      }

      const { data, error } = await query.limit(200);

      if (!error && data) {
        setAuditoria(data);
      }
    } catch (err) {
      console.error('Error cargando auditoría:', err);
    } finally {
      setLoading(false);
    }
  };

  const manejarLimpiarFiltros = () => {
    setFiltros({
      tabla: '',
      accion: '',
      fechaInicio: '',
      fechaFin: ''
    });
    cargarAuditoria();
  };

  const columnasTabla = [
    { field: 'fecha', header: 'Fecha', width: '15%' },
    { field: 'usuario_nombre', header: 'Usuario', width: '15%' },
    { field: 'tabla', header: 'Tabla', width: '20%' },
    { field: 'accion', header: 'Acción', width: '15%' },
    { field: 'valores_anteriores', header: 'Valores Anteriores', width: '20%' },
    { field: 'valores_nuevos', header: 'Valores Nuevos', width: '15%' }
  ];

  return (
    <section className="p-4">
      {userRole !== 'admin' && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-6 mb-6">
          <h3 className="text-red-600 font-medium mb-2">Acceso Denegado</h3>
          <p className="text-red-400">Solo el Admin General (Juan) puede ver el log de auditoría completo.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Log de Auditoría del Sistema</h2>

        {/* Filtros */}
        {userRole === 'admin' && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-sm text-gray-500 mb-1">Tabla</label>
              <select
                value={filtros.tabla}
                onChange={(e) => setFiltros({ ...filtros, tabla: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todas las tablas</option>
                <option value="usuarios">Usuarios</option>
                <option value="productos">Productos</option>
                <option value="ventas">Ventas</option>
                <option value="gastos">Gastos</option>
                <option value="pedidos">Pedidos</option>
                <option value="auditoria">Auditoría</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1">Acción</label>
              <select
                value={filtros.accion}
                onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Todas las acciones</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1">Periodo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const hoy = new Date();
                    const hace7Dias = new Date();
                    hace7Dias.setDate(hoy.getDate() - 6);
                    setFiltros(prev => ({
                      ...prev,
                      fechaInicio: hace7Dias.toISOString().split('T')[0],
                      fechaFin: hoy.toISOString().split('T')[0]
                    }));
                  }}
                  className="flex-1 py-1 px-2 text-xs text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                >
                  Últimos 7 días
                </button>
                <button
                  onClick={() => setFiltros({ ...filtros, fechaInicio: '', fechaFin: '' })}
                  className="flex-1 py-1 px-2 text-xs text-gray-600 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de auditoría */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {userRole === 'admin' ? 'Log Completo de Auditoría' : 'Sin acceso'}
          </h3>

          {loading ? (
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Usuario</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Tabla</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acción</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cambios</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider width-80">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.map((a, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="text-sm text-gray-500">
                        {new Date(a.fecha).toLocaleDateString() + ' ' + new Date(a.fecha).toLocaleTimeString()}
                      </td>
                      <td className="text-sm text-gray-500">
                        {a.usuarios?.nombre || 'Sistema'}
                      </td>
                      <td className="text-sm text-gray-400">
                        {a.tabla}
                      </td>
                      <td className="text-sm text-amber-500">
                        {a.accion}
                      </td>
                      <td className="text-xs text-gray-400 truncate" title={a.valores_anteriores?.toString || ''}>
                        {a.valores_anteriores ? JSON.stringify(a.valores_anteriores).substring(0, 80) + '...' : '—'}
                      </td>
                      <td className="text-xs text-gray-400 truncate" title={a.valores_nuevos?.toString || ''}>
                        {a.valores_nuevos ? JSON.stringify(a.valores_nuevos).substring(0, 80) + '...' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}