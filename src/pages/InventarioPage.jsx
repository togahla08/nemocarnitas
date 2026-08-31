/**
 * InventarioPage.jsx - Control de inventario con alertas de stock bajo
 * Tabla productos con stock, márgenes %, alertas visuales
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
  AlertCircle,
  CheckCircle,
  BarChart2,
  Banknote,
  AlertTriangle,
  Sparkles,
  Menu,
  Search,
  Clipboard,
  TrendingUp,
  Info
} from 'lucide-react';

export default function InventarioPage() {
  const { userRole, user } = useStore();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio_venta: 0,
    costo_unitario: 0,
    stock: 0,
    stock_minimo: 5,
    categoria: 'carnitas'
  });
  [editando, setEditando] = useState(false);
  [productoActual, setProductoActual] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, [userRole]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');

      if (!error && data) {
        setProductos(data);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  };

  const manejarNuevoProducto = () => {
    setNuevoProducto({
      nombre: '',
      precio_venta: 0,
      costo_unitario: 0,
      stock: 0,
      stock_minimo: 5,
      categoria: 'carnitas'
    });
    setEditando(true);
  };

  const guardarProducto = async () => {
    try {
      const productoGuardar = {
        ...nuevoProducto,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      const { error } = await supabase.from('productos').insert([productoGuardar]);

      if (error) throw error;
      setEditando(false);
      setNuevoProducto({
        nombre: '',
        precio_venta: 0,
        costo_unitario: 0,
        stock: 0,
        stock_minimo: 5,
        categoria: 'carnitas'
      });
      cargarProductos();
      alert('Producto agregado exitosamente');
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert('Error al agregar el producto');
    }
  };

  const actualizarProducto = async (id, datosActualizados) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update(datosActualizados)
        .eq('id', id);

      if (error) throw error;
      cargarProductos();
      alert('Producto actualizado exitosamente');
    } catch (err) {
      console.error('Error actualizando producto:', err);
      alert('Error al actualizar el producto');
    }
  };

  const eliminarProducto = async (productoId) => {
    if (userRole !== 'admin') {
      alert('Solo el admin puede eliminar productos');
      return;
    }
    
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productoId);

      if (error) throw error;
      cargarProductos();
      alert('Producto eliminado exitosamente');
    } catch (err) {
      console.error('Error eliminando producto:', err);
    }
  };

  // Calcular margen y estado de stock
  const productosConEstado = productos.map(p => ({
    ...p,
    margen_porcentaje: p.precio_venta > 0 
      ? Math.round(((p.precio_venta - p.costo_unitario) / p.precio_venta) * 100)
      : 0,
    stock_estado: p.stock <= p.stock_minimo ? 'crítico' : 
                  p.stock <= p.stock_minimo * 2 ? 'advertencia' : 'normal',
    stock_color: p.stock <= p.stock_minimo 
      ? 'red' : p.stock <= p.stock_minimo * 2 
        ? 'amber' : 'green'
  }));

  return (
    <section className="p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Control de Inventario</h2>

        {/* Formulario nuevo producto */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await guardarProducto();
          }}
          className="mb-6"
        >
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="Carnidades Cerdo, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
              <input
                type="number"
                value={nuevoProducto.precio_venta}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_venta: parseFloat(e.target.value) || 0 })}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
              <input
                type="number"
                value={nuevoProducto.costo_unitario}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, costo_unitario: parseFloat(e.target.value) || 0 })}
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="300.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
              <input
                type="number"
                value={nuevoProducto.stock}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: parseInt(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                value={nuevoProducto.stock_minimo}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock_minimo: parseInt(e.target.value) || 5 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={nuevoProducto.categoria}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="carnitas">Carnitas</option>
                <option value="order">Órdenes</option>
                <option value="bebida">Bebidas</option>
                <option value="acompañante">Acompañantes</option>
                <option value="postre">Postres</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2 px-4 text-lg font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              Agregar Producto
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

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-xl p-4">
            <div className="text-amber-600 text-2xl font-bold">{productos.length}</div>
            <div className="text-sm text-gray-500">Productos total</div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-4">
            <div className="text-green-600 text-2xl font-bold">{productos.filter(p => p.stock > p.stock_minimo).length}</div>
            <div className="text-sm text-gray-500">Stock normal</div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-600 rounded-xl p-4">
            <div className="text-red-600 text-2xl font-bold">{productos.filter(p => p.stock <= p.stock_minimo).length}</div>
            <div className="text-sm text-gray-500">Stock crítico</div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-4">
            <div className="text-blue-600 text-2xl font-bold">{productos.reduce((sum, p) => sum + (p.margen_porcentaje || 0), 0)}/div>
            <div className="text-sm text-gray-500">Margen promedio %</div>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Inventario de Productos
          </h3>

          {loading ? (
            <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Categoría</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock Mín.</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">% Margen</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider width-64">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosConEstado.map((p, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="text-sm text-gray-800">
                        {p.nombre}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {p.categoria}
                      </td>
                      <td className="text-center text-amber-600 font-medium">
                        {p.stock}
                      </td>
                      <td className="text-center text-sm text-gray-500">
                        {p.stock_minimo}
                      </td>
                      <td className="text-center">
                        {p.margen_porcentaje}%
                      </td>
                      <td className="text-center">
                        <span className={`px-2 py-1 text-xs rounded ${p.stock_color === 'red' ? 'bg-red-100 text-red-600' : p.stock_color === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                          {p.stock_estado}
                        </span>
                      </td>
                      <td className="text-center text-sm">
                        {userRole === 'admin' ? (
                          <>
                            <button
                              onClick={() => console.log('Editar producto', p.id)}
                              className="text-amber-600 hover underline text-xs mr-2"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => eliminarProducto(p.id)}
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