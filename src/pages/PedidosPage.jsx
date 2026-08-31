/**
 * PedidosPage.jsx - Gestión de pedidos con sincronización real-time
 * Vista kanban/cards, estados (pendiente, preparando, listo, entregado)
 * Suscripción Supabase Realtime instantánea
 */

import { useState, useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  Plus, 
  Edit, 
  Trash, 
  Loader2,
  CheckCircle,
  XCircle,
  Loader,
  Zap,
  Clock,
  Pallet,
  Truck,
  Folder,
  Flag,
  AlertTriangle
} from 'lucide-react';

export default function PedidosPage() {
  const { userRole, user } = useStore();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoPedido, setNuevoPedido] = useState({
    cliente_nombre: '',
    tipo_pedido: 'mostrar',
    estado: 'pendiente'
  });
  [editando, setEditando] = useState(false);
  [pedidoActual, setPedidoActual] = useState(null);

  useEffect(() => {
    cargarPedidos();
    
    // Suscripción real-time a cambios de pedidos
    const channel = supabase
      .channel('pedidos_cambios')
      .on('postgres_changes', 
        { event: '*', schema: 'public', filter: 'estado=pendiente' },
        (payload) => {
          console.log('Cambio de pedido en tiempo real:', payload);
          cargarPedidos();
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public' },
        (payload) => {
          setPedidos(prev => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('pedidos').select(`
        *,
        usuarios:nombre,
        pedidos_items(*)
      `).order('fecha', { ascending: false });

      // Filtros según rol
      if (userRole !== 'admin') {
        query = query.eq('usuario_id', user.id);
      }

      if (userRole === 'toma_pedidos') {
        // Toma pedidos ve todos los pedidos nuevos
        query = query.order('fecha', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (!error && data) {
        setPedidos(data);
      }
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const manejarNuevoPedido = () => {
    setNuevoPedido({
      cliente_nombre: '',
      tipo_pedido: 'mostrar',
      estado: 'pendiente'
    });
    setEditando(true);
  };

  const guardarPedido = async () => {
    try {
      const pedidoGuardar = {
        ...nuevoPedido,
        usuario_id: user.id,
        fecha: new Date().toISOString(),
        total: 0 // Se calculará desde items
      };

      const { error } = await supabase.from('pedidos').insert([pedidoGuardar]);

      if (error) throw error;
      setEditando(false);
      setNuevoPedido({
        cliente_nombre: '',
        tipo_pedido: 'mostrar',
        estado: 'pendiente'
      });
      cargarPedidos();
      alert('Pedido creado exitosamente');
    } catch (err) {
      console.error('Error guardando pedido:', err);
      alert('Error al crear el pedido');
    }
  };

  const actualizarPedido = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      cargarPedidos();
      alert('Pedido actualizado');
    } catch (err) {
      console.error('Error actualizando pedido:', err);
    }
  };

  const eliminarPedido = async (pedidoId) => {
    if (userRole !== 'admin') {
      alert('Solo el admin puede eliminar pedidos');
      return;
    }
    
    if (!confirm('¿Seguro que deseas eliminar este pedido?')) return;
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoId);

      if (error) throw error;
      cargarPedidos();
      alert('Pedido eliminado');
    } catch (err) {
      console.error('Error eliminando pedido:', err);
    }
  };

  const formatearTicketPedido = (pedido) => {
    const items = pedido.pedidos_items || [];
    const lineas = [
      '╔════════════════════════════╗',
      '│   LA BARRITA DE CARNITAS   │',
      '╚════════════════════════════╝',
      '',
      `Pedido #${pedido.numero_pedido || '001'} | ${new Date(pedido.fecha).toLocaleDateString()}`,
      `Cliente: ${pedido.cliente_nombre || '—'}`,
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
    lineas.push(`TOTAL: $${(pedido.total || 0).toLocaleString()}`);
    lineas.push(`Tipo: ${pedido.tipo_pedido || 'Mostrar'}`);
    lineas.push(`Estado: ${pedido.estado || 'pendiente'}`);
    lineas.push('');
    lineas.push('¡Gracias por su pedido!');

    return lineas.join('\n');
  };

  // Agrupar pedidos por estado para vista kanban
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
  const pedidosPreparando = pedidos.filter(p => p.estado === 'preparando').length;
  const pedidosListos = pedidos.filter(p => p.estado === 'listo').length;
  const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado').length;

  return (
    <section className="p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Pedidos</h2>
        
        {/* Formulario crear pedido */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await guardarPedido();
          }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente / Mesa</label>
              <input
                value={nuevoPedido.cliente_nombre}
                onChange={(e) => setNuevoPedido({ ...nuevoPedido, cliente_nombre: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="Mesa 1, Juan Pérez, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={nuevoPedido.tipo_pedido}
                  onChange={(e) => setNuevoPedido({ ...nuevoPedido, tipo_pedido: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                >
                  <option value="mostrar">Mostrar</option>
                  <option value="para_llevar">Para Llevar</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={nuevoPedido.estado}
                  onChange={(e) => setNuevoPedido({ ...nuevoPedido, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="preparando">Preparando</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Crear Pedido
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

        {/* Resumen por estado (Kanban ligero) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-xl p-4">
            <div className="text-amber-600 text-3xl font-bold">{pedidosPendientes}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
            <button
              onClick={() => actualizarPedido(null, 'preparando')}
              className="mt-2 w-full py-2 text-sm text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
            >
              Marcar como preparando
            </button>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-xl p-4">
            <div className="text-amber-600 text-3xl font-bold">{pedidosPreparando}</div>
            <div className="text-sm text-gray-500">Preparando</div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-4">
            <div className="text-green-600 text-3xl font-bold">{pedidosListos}</div>
            <div className="text-sm text-gray-500">Listos</div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-4">
            <div className="text-blue-600 text-3xl font-bold">{pedidosEntregados}</div>
            <div className="text-sm text-gray-500">Entregados</div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {userRole === 'admin' ? 'Todos los Pedidos' : 'Mis Pedidos'}
            {userRole === 'toma_pedidos' && (
              <span className="text-sm text-gray-400 ml-2">
                <Zap className="inline mr-1" /> Real-time
              </span>
            )}
          </h3>

          {loading ? (
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pedidos.map((p, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      #{p.numero_pedido || '—'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(p.fecha).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">{p.cliente_nombre || '—'}</span>
                    <span className="ml-2 text-amber-600 font-medium">
                      {p.estado || 'pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}