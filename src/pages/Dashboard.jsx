/**
 * Dashboard.jsx - Panel principal con estadísticas y últimas transacciones
 * Cards de estadísticas en tiempo real
 */

import { useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { vw_ventas_diarias } from '../lib/supabase'; // View name reference
import { Chart } from 'react-chartjs-2';
import { 
  BarHorizontal, 
  Truck, 
  Cash, 
  CreditCard,
  Pallet, 
  ClipboardList,
  AlertCircle,
  Users,
  DollarSign,
  LayoutDashboard,
  Settings,
  Folder,
  Clipboard,
  BarChart2,
  Target,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { userRole, user } = useStore();
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    gastosMes: 0,
    efectivo: 0,
  });
  const [ultimasTransaccions, setUltimasTransaccions] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
    cargarUltimasTransacciones();
    cargarAlertas();
    
    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('pos_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Cambio en tiempo real:', payload);
          // Actualizar estadísticas y alertas automáticamente
          cargarEstadisticas();
          cargarAlertas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Obtener datos de hoy y este mes
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      // Ventas de hoy
      const { data: ventasHoy, error: ventasHoyError } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', hoy.setHours(0, 0, 0, 0))
        .lte('fecha', hoy.setHours(23, 59, 59, 59));
      
      // Ventas del mes
      const { data: ventasMes, error: ventasMesError } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', inicioMes)
        .lte('fecha', hoy);
      
      // Gastos del mes
      const { data: gastosMes, error: gastosMesError } = await supabase
        .from('gastos')
        .select('cantidad')
        .gte('fecha', inicioMes)
        .lte('fecha', hoy);

      if (!ventasHoyError && ventasHoy) {
        const totalHoy = ventasHoy.reduce((sum, v) => sum + (v.total || 0), 0);
        setStats(prev => ({ ...prev, ventasHoy: totalHoy }));
      }
      
      if (!ventasMesError && ventasMes) {
        const totalMes = ventasMes.reduce((sum, v) => sum + (v.total || 0), 0);
        setStats(prev => ({ ...prev, ventasMes: totalMes }));
      }
      
      if (!gastosMesError && gastosMes) {
        const totalGastos = gastosMes.reduce((sum, g) => sum + (g.cantidad || 0), 0);
        setStats(prev => ({ ...prev, gastosMes: totalGastos }));
      }
      
      // Efectivo (ventas con pago efectivo)
      if (!ventasHoyError && ventasHoy) {
        const efectivo = ventasHoy.filter(v => v.tipo_pago === 'efectivo')
          .reduce((sum, v) => sum + (v.total || 0), 0);
        setStats(prev => ({ ...prev, efectivo: efectivo }));
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarUltimasTransaccions = async () => {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*, usuarios:nombre')
        .order('fecha', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        setUltimasTransaccions(data);
      }
    } catch (err) {
      console.error('Error cargando transacciones:', err);
    }
  };

  const cargarAlertas = async () => {
    try {
      // Alertas de stock bajo
      const { data: productosBajoStock, error } = await supabase
        .from('productos')
        .select('*')
        .lte('stock', 5);
      
      if (!error && productosBajoStock && productosBajoStock.length > 0) {
        setAlertas(productosBajoStock.map(p => ({
          tipo: 'stock_bajo',
          mensaje: `Stock bajo: ${p.nombre} (${p.stock} unidades)`,
          categoria: 'inventario',
          severity: 'warning'
        })));
      }
    } catch (err) {
      console.error('Error cargando alertas:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="animated-spinner flex justify-center py-12">
          <span className="text-gray-400">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="p-4">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Hoy</p>
              <p className="text-3xl font-bold text-amber-600">${stats.ventasHoy.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Mes</p>
              <p className="text-3xl font-bold text-amber-600">${stats.ventasMes.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Gastos Mes</p>
              <p className="text-3xl font-bold text-orange-600">${stats.gastosMes.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Efectivo</p>
              <p className="text-3xl font-bold text-amber-600">${stats.efectivo.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path className="stroke-2" d="M12 7v6m4 4h4m-4-4h4m-6-6l-6 6m6-6l6 6m2-6l-6-6m6 6l-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas transacciones */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Últimas transacciones</h3>
        {ultimasTransaccions.length === 0 ? (
          <p className="text-gray-500">No hay transacciones registradas</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ultimasTransaccions.map((t, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {t.tipo_pago || '—'} - {new Date(t.fecha).toLocaleTimeString()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    ${(t.total || 0).toLocaleString()}
                  </span>
                </div>
                <small className="text-xs text-gray-400">
                  {t.nombre || '—'}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-600 rounded-t-xl rounded-bxl p-4 mb-6">
          <h4 className="font-medium text-amber-800 mb-2">Alertas del sistema</h4>
          <ul className="space-y-2 text-sm text-amber-700">
            {alertas.map((alerta, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path className="stroke-2" d="M12 9v2m0 6l-3-3m3 3l3-3m-6-6l3-3m3 3l3-3M12 9l-3 3m3 3l3 3m-6-6l3 3m3 3l3 3"/>
                </svg>
                <span>{alerta.mensaje}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Placeholders de gráficas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gráfica de ventas por día (placeholder) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Ventas Diarias</h4>
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Gráfica de rotación de productos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Productos Más Vendidos</h4>
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Gráfica de rentabilidad */}
        <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
          <h4 className="text-sm font-medium text-gray-500 mb-3">Rentabilidad</h4>
          <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </section>
  );
}