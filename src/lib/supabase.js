/**
 * lib/supabase.js - Configuración y clientes Supabase
 * Instancia única para usar en todo el frontend
 */

import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key-aqui';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Exportar nombres de vistas y tablas para facilitar el uso
export const TABLAS = {
  USUARIOS: 'usuarios',
  PRODUCTOS: 'productos',
  VENTAS: 'ventas',
  VENTAS_ITEMS: 'ventas_items',
  GASTOS: 'gastos',
  PEDIDOS: 'pedidos',
  PEDIDOS_ITEMS: 'pedidos_items',
  MOVIMIENTOS_INVENTARIO: 'movimientos_inventario',
  CONTROL_CAJA: 'control_caja',
  AUDITORIA: 'auditoria',
};

export const Vistas = {
  VENTAS_DIARIAS: 'vw_ventas_diarias',
  PRODUCTOS_ROTACION: 'vw_productos_rotacion',
  RENTABILIDAD: 'vw_rentabilidad_producto',
};