/**
 * VentasPage.jsx - Gestión completa de ventas
 * Tabla de ventas, crear nueva, filtros, editar, eliminar, imprimir
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { vw_ventas_diarias } from '../lib/supabase';
import { 
  Table, 
  Plus, 
  Edit, 
  Trash, 
  Print, 
  Search,
  Loader2,
  Clipboard,
  Flag
} from 'lucide-react';

export default function VentasPage() {
  const { userRole, user } = useStore();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoPago: '',
    estado: ''
  });
  const [editando, setEditando] = useState(false);
  const [ventaActual, setVentaActual] = useState(null);
  [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => {
    cargarVentas();
    
    // Suscripción real-time a nuevas ventas
    const channel = supabase
      .channel('nuevas_ventas')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public' },
        (payload) => {
          setVentas(prev => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      let query = supabase.from('ventas').select(`
        *,
        usuarios:nombre
      `).order('fecha', { ascending: false });

      // Aplicar filtros según rol
      if (userRole !== 'admin') {
        query = query.eq('usuario_id', user.id);
      }

      if (filtros.fechaInicio) {
        query = query.gte('fecha', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha', filtros.fechaFin);
      }
      if (filtros.tipoPago) {
        query = query.eq('tipo_pago', filtros.tipoPago);
      }

      const { data, error } = await query.limit(100);

      if (!error && data) {
        setVentas(data);
      }
    } catch (err) {
      console.error('Error cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const manejarNuevaVenta = async () => {
    setVentaActual({
      id: '',
      numero_venta: 0,
      fecha: new Date().toISOString(),
      usuario_id: user.id,
      total: 0,
      tipo_pago: 'efectivo',
      estado: 'completado'
    });
    setEditando(true);
  };

  const guardarVenta = async (venta) => {
    try {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single();

      const ventaGuardar = {
        ...venta,
        usuario_id: user.id,
        tipo_pago: venta.tipo_pago || 'efectivo',
        estado: venta.estado || 'completado'
      };

      const { error } = await supabase.from('ventas').insert([ventaGuardar]);

      if (error) throw error;
      setEditando(false);
      setVentaActual(null);
      cargarVentas();
      alert('Venta registrada exitosamente');
    } catch (err) {
      console.error('Error guardando venta:', err);
      alert('Error al registrar la venta');
    }
  };

  const eliminarVenta = async (ventaId) => {
    if (!confirm('¿Seguro que deseas eliminar esta venta?')) return;
    
    try {
      const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', ventaId);

      if (error) throw error;
      cargarVentas();
      alert('Venta eliminada exitosamente');
    } catch (err) {
      console.error('Error eliminando venta:', err);
      alert('Error al eliminar la venta');
    }
  };

  const formatearTicket = (venta) => {
    const items = venta.items || [];
    const lineas = [
      '╔════════════════════════════╗',
      '│   LA BARRITA DE CARNITAS   │',
      '╚════════════════════════════╝',
      '',
      `Venta #${venta.numero_venta || '001'} | ${new Date(venta.fecha).toLocaleDateString()} | ${new Date(venta.fecha).toLocaleTimeString()}`,
      '',
      'PRODUCTO              CANT  PRECIO',
    ];

    items.forEach(item => {
      const prod = item.producto_nombre || item.nombre || 'Producto';
      const cant = item.cantidad || 1;
      const precio = item.precio_unitario || 0;
      lineas.push(`${prod.padEnd(20)}${cant.toString().padStart(3)} ${precio.toFixed(2).toString().padStart(6)}`);
    });

    lineas.push('');
    lineas.push(`TOTAL: $${(venta.total || 0).toLocaleString()}`);
    lineas.push(`Pago: ${venta.tipo_pago || 'Efectivo'}`);
    lineas.push('');
    lineas.push('¡Gracias por su compra!');

    return lineas.join('\n');
  };

  return (
    <section className="p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Registrar Nueva Venta</h2>
        
        {editando && ventaActual ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            await guardarVenta(ventaActual);
          }}>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
                <select
                  value={ventaActual.tipo_pago || 'efectivo'}
                  onChange={(e) => setVentaActual({ ...ventaActual, tipo_pago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={ventaActual.estado || 'completado'}
                  onChange={(e) => setVentaActual({ ...ventaActual, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                >
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Guardar Venta
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="w-full py-3 px-4 text-sm text-gray-600 hover:text-gray-800 mt-2 transition-colors"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={manejarNuevaVenta}
            className="w-full py-3 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
          >
            ✚ Nueva Venta
          </button>
        )}

        {/* Filtros */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1">Fecha fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1">Tipo de pago</label>
            <select
              value={filtros.tipoPago}
              onChange={(e) => setFiltros({ ...filtros, tipoPago: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1"></label>
            <button
              onClick={() => setFiltros({ fechaInicio: '', fechaFin: '', tipoPago: '' })}
              className="px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700 transition-colors w-full"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {userRole === 'admin' ? 'Historial de Ventas' : 'Mis Ventas'}
          {userRole !== 'admin' && <span className="text-sm text-gray-400 ml-2">(solo propias)</span>}
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
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Cliente</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Pago</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="text-center text-sm font-medium text-gray-700">
                      {v.numero_venta || '#—'}
                    </td>
                    <td className="text-center text-sm text-gray-500">
                      {new Date(v.fecha).toLocaleDateString()}
                    </td>
                    <td className="text-center text-sm text-gray-500">
                      {v.usuarios?.nombre || '—'}
                    </td>
                    <td className="text-center text-amber-600 font-medium">
                      ${(v.total || 0).toLocaleString()}
                    </td>
                    <td className="text-center text-sm text-gray-500">
                      {v.tipo_pago || '—'}
                    </td>
                    <td className="text-center text-sm text-gray-500">
                      {v.estado || '—'}
                    </td>
                    <td className="text-center text-sm">
                      {userRole === 'admin' ? (
                        <>
                          <button
                            onClick={() => console.log('Editar venta', v.id)}
                            className="text-amber-600 hover underline text-xs mr-2"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminarVenta(v.id)}
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

      {/* Sección de impresión */}
      {ventas.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Imprimir Ticket</h4>
          <div className="grid grid-cols-2 gap-3">
            {ventas.slice(0, 3).map((v, i) => (
              <button
                key={i}
                onClick=(() => {
                  const ticket = formatearTicket(v);
                  // Aquí iría la función de impresión Bluetooth
                  alert('Ticket generado:\n' + ticket);
                  setImprimiendo(true);
                })
                className="w-full py-2 px-3 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <Print className="w-4 h-4" /> Ticket #{v.numero_venta}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}