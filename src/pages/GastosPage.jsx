/**
 * GastosPage.jsx - Gestión de gastos categorizados
 * Tabla de gastos, crear, filtros por categoría
 * Sócio puede crear pero no editar/eliminar
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  Plus, 
  Edit, 
  Trash, 
  Filter,
  Loader2,
  AlertCircle,
  Folder,
  FileText,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function GastosPage() {
  const { userRole, user, canEdit, canDelete } = useStore();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoGasto, setNuevoGasto] = useState({
    descripcion: '',
    cantidad: 0,
    categoria: ''
  });
  const [filtrarCategoria, setFiltrarCategoria] = useState('');
  [editando, setEditando] = useState(false);
  [gastoActual, setGastoActual] = useState(null);

  useEffect(() => {
    cargarGastos();
  }, [userRole, canEdit, canDelete]);

  const cargarGastos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('gastos').select(`
        *,
        usuarios:nombre
      `).order('fecha', { ascending: false });

      // Filtros según rol
      if (userRole !== 'admin') {
        query = query.eq('usuario_id', user.id);
      }

      if (filtrarCategoria) {
        query = query.eq('categoria', filtrarCategoria);
      }

      const { data, error } = await query.limit(100);

      if (!error && data) {
        setGastos(data);
      }
    } catch (err) {
      console.error('Error cargando gastos:', err);
    } finally {
      setLoading(false);
    }
  };

  const manejarNuevoGasto = () => {
    setNuevoGasto({
      descripcion: '',
      cantidad: 0,
      categoria: ''
    });
    setEditando(true);
  };

  const guardarGasto = async () => {
    try {
      const gastoGuardar = {
        ...nuevoGasto,
        usuario_id: user.id,
        created_by: user.id,
        estado: 'pendiente',
        fecha: new Date().toISOString()
      };

      const { error } = await supabase.from('gastos').insert([gastoGuardar]);

      if (error) throw error;
      setEditando(false);
      setNuevoGasto({
        descripcion: '',
        cantidad: 0,
        categoria: ''
      });
      cargarGastos();
      alert('Gasto registrado exitosamente');
    } catch (err) {
      console.error('Error guardando gasto:', err);
      alert('Error al registrar el gasto');
    }
  };

  const eliminarGasto = async (gastoId) => {
    if (userRole !== 'admin') {
      alert('Solo el admin puede eliminar gastos');
      return;
    }
    
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    
    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', gastoId);

      if (error) throw error;
      cargarGastos();
      alert('Gasto eliminado exitosamente');
    } catch (err) {
      console.error('Error eliminando gasto:', err);
      alert('Error al eliminar el gasto');
    }
  };

  const actualizarGasto = async (id, datosActualizados) => {
    if (userRole !== 'admin') {
      alert('Solo el admin puede editar gastos');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('gastos')
        .update(datosActualizados)
        .eq('id', id);

      if (error) throw error;
      cargarGastos();
      alert('Gasto actualizado exitosamente');
    } catch (err) {
      console.error('Error actualizando gasto:', err);
      alert('Error al actualizar el gasto');
    }
  };

  return (
    <section className="p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {userRole === 'admin' ? 'Gestión de Gastos' : 'Mis Gastos'}
        </h2>

        {/* Formulario de nuevo gasto */}
        {userRole !== 'socio' || (userRole === 'socio' && canEdit) ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await guardarGasto();
            }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                  placeholder="Descripción del gasto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={nuevoGasto.cantidad}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, cantidad: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={nuevoGasto.categoria}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                >
                  <option value="mercancia">Mercancía</option>
                  <option value="servicios">Servicios</option>
                  <option value="embalaje">Embalaje</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 py-2 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
              >
                Registrar Gasto
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="flex-1 py-2 px-4 text-sm text-gray-600 hover:text-gray-800 mt-0 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">
              Sócios pueden crear gastos pero no editar ni eliminar
            </p>
          </div>
        )}

        {/* Filtros */}
        {userRole === 'admin' && (
          <div className="mb-6">
            <label className="text-sm text-gray-500 mb-1">Filtrar por categoría</label>
            <select
              value={filtrarCategoria}
              onChange={(e) => setFiltrarCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todas las categorías</option>
              <option value="mercancia">Mercancía</option>
              <option value="servicios">Servicios</option>
              <option value="embalaje">Embalaje</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        )}

        {/* Tabla de gastos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {userRole === 'admin' ? 'Todos los Gastos' : 'Mis Gastos'}
          </h3>

          {loading ? (
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">#</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Descripción</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cantidad</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Usuario</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider width-48">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((g, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="text-center text-sm font-medium text-gray-700">
                        {g.id?.slice(0, 8) || '—'}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {new Date(g.fecha).toLocaleDateString()}
                      </td>
                      <td className="text-sm text-gray-800">
                        {g.descripcion || '—'}
                      </td>
                      <td className="text-center text-amber-600 font-medium">
                        ${(g.cantidad || 0).toLocaleString()}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {g.categoria || '—'}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {g.usuarios?.nombre || '—'}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {g.estado || '—'}
                      </td>
                      <td className="text-center text-sm">
                        {userRole === 'admin' ? (
                          <>
                            <button
                              onClick={() => console.log('Editar gasto', g.id)}
                              className="text-amber-600 hover underline text-xs mr-2"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarGasto(g.id)}
                              className="text-red-500 hover underline text-xs"
                            >
                              Eliminar
                            </button>
                          </>
                        ) : (
                          <span className="text-amber-400 text-xs">—</span>
                        )}
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