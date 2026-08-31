/**
 * ReportesPage.jsx - Placeholders de gráficas Chart.js + tabla rentabilidad
 * Resumen ejecutivo con indicadores clave
 */

import { useEffect } from 'react';
import { useStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  Bar, 
  Line, 
  Pie, 
  Donut,
  Search,
  Loader2,
  Grid,
  Table,
  TrendingUp,
  DollarSign,
  BarChart,
  Layout,
  Users,
  Folder,
  Clipboard,
  AlertCircle,
  Eye
} from 'lucide-react';

export default function ReportesPage() {
  const { userRole, user } = useStore();
  const [ventasData, setVentasData] = useState({ labels: [], datasets: [] });
  const [productosData, setProductosData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosReportes();
  }, [userRole]);

  const cargarDatosReportes = async () => {
    setLoading(true);
    try {
      // Datos para gráfica de ventas diarias (ultimos 7 días)
      const hoy = new Date();
      const hace7Dias = new Date();
      hace7Dias.setDate(hoy.getDate() - 6);

      const { data: ventas, error } = await supabase
        .from('ventas')
        .select('fecha, total, tipo_pago')
        .gte('fecha', hace7Dias.toISOString())
        .lte('fecha', hoy.toISOString());

      if (!error && ventas) {
        // Agrupar por día
        const fechas = [];
        const totales = [];
        const efectivo = [];
        const tarjeta = [];
        
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - i);
          const fechaStr = fecha.toISOString().split('T')[0];
          
        const dayVentas = ventas.filter(v => v.fecha.split('T')[0] === fechaStr);
        fechas.push(fecha.toLocaleDateString('es-MX', { weekday: 'n' }));
        totales.push(dayVentas.reduce((sum, v) => sum + (v.total || 0), 0));
        efectivo.push(dayVentas.filter(v => v.tipo_pago === 'efectivo').reduce((sum, v) => sum + (v.total || 0), 0));
        tarjeta.push(dayVentas.filter(v => v.tipo_pago === 'tarjeta').reduce((sum, v) => sum + (v.total || 0), 0));
        }

        setVentasData({
          labels: [...fechas],
          datasets: [
            { label: 'Total', data: [...totales], backgroundColor: 'rgba(217, 119, 6, 0.5)' },
            { label: 'Efectivo', data: [...efectivo], backgroundColor: 'rgba(239, 68, 68, 0.5)' },
            { label: 'Tarjeta', data: [...tarjeta], backgroundColor: 'rgba(59, 130, 246, 0.5)' }
          ]
        });
      }

      // Datos para rotación de productos
      const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('nombre, precio_venta, costo_unitario, stock');

      if (!prodError && productos) {
        const labels = productos.map(p => p.nombre.substring(0, 12) + (p.nombre.length > 12 ? '...' : ''));
        const ingresos = productos.map(p => p.precio_venta * 10); // Simulación: 10 unidades cada una
        const costos = productos.map(p => p.costo_unitario * 10);
        const ganancias = ingresos.map((c, i) => c - costos[i]);

        setProductosData({
          labels: [...labels],
          datasets: [
            { 
              label: 'Unidades Vendidas', 
              data: [...ingresos], 
              backgroundColor: 'rgba(217, 119, 6, 0.3)' 
            },
            { 
              label: 'Ganancia Neta', 
              data: [...ganancias], 
              backgroundColor: 'rgba(34, 197, 94, 0.3)' 
            }
          ]
        });
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reportes y Estadísticas</h2>

        {/* Resumen ejecutivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-amber-50 border-l-4 border-amber-600 rounded-xl p-4">
            <div className="text-amber-600 text-2xl font-bold" id="total-ventas-hoy">—</div>
            <div className="text-sm text-gray-500">Ventas Hoy</div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 rounded-xl p-4">
            <div className="text-green-600 text-2xl font-bold" id="ganancia-neta">—</div>
            <div className="text-sm text-gray-500">Ganancia Neta</div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-4">
            <div className="text-blue-600 text-2xl font-bold" id="total-clientes">—</div>
            <div className="text-sm text-gray-500">Total Transacciones</div>
          </div>

          <div className="purple-50 border-l-4 border-purple-600 rounded-xl p-4">
            <div className="purple-600 text-2xl font-bold" id="margen-promedio">—</div>
            <div className="text-sm text-gray-500">Margen Promedio</div>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gráfica de ventas por día */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Ventas Últimos 7 Días</h4>
            {loading ? (
              <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
            ) : (
              <Bar data={ventasData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' as const },
                  tooltip: { enabled: true }
                }
              }} />
            )}
          </div>

          {/* Gráfica de productos más vendidos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Rotación de Productos</h4>
            {loading ? (
              <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
            ) : (
              <Pie data={productosData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' as const }
                }
              }} />
            )}
          </div>

          {/* Gráfica de rentabilidad */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Rentabilidad por Producto</h4>
            <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          </div>

          {/* Tabla rentabilidad */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Resumen Rentabilidad</h4>
            <Table>
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Producto</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ingreso</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Costo</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ganancia</th>
                  <th className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Margen %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500">Cargando...</td>
                  </tr>
                ) : (
                  <tr>
                    <td className="text-sm text-gray-600">—</td>
                    <td className="text-amber-600">—</td>
                    <td className="text-gray-500">—</td>
                    <td className="text-amber-600">—</td>
                    <td className="text-gray-500">—</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Alertas financieras */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Indicadores Financieros</h4>
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              <p>Datos disponibles en tiempo real</p>
            </div>
          </div>

          {/* Vista por período */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Periodo Personalizado</h4>
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              <p>Selecciona fechas para reporte personalizado</p>
            </div>
          </div>
        }
        </div>
      </div>
    </section>
  );
}