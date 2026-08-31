# La Barrita de Carnitas - Sistema POS

## Overview Técnico

Sistema de punto de venta completo para un negocio de carnitas, construido con React 18 + Vite + Tailwind CSS + Supabase.

### Arquitectura

- **Frontend**: React 18.2+, Vite, Tailwind CSS, Lucide React, Chart.js + React-ChartJS, Zustand
- **Backend**: Supabase (Postgres + Auth + Realtime + RLS)
- **Sincronización**: Supabase Realtime (Websockets)
- **Impresión**: ESC/POS sobre Bluetooth/TCP
- **Estado**: Zustand
- **PWA**: Compatible iOS/Android

### Roles y Permisos

1. **Admin (Juan)**: Acceso total a TODO. Ver/editar/eliminar todo, crear y gestionar usuarios, ver auditoría, acceso a reportes avanzados.

2. **Socio (María, Carlos)**: Pueden crear/acreditar/eliminar ventas propias, crear gastos (no pueden editar ni eliminar), gestionar inventario, ver reportes básicos. No pueden ver datos de otros socios ni auditoría.

3. **Toma Pedidos (Sofía)**: Crear pedidos nuevos, ver pedidos en tiempo real (Realtime), gestionar inventario (descontar stock), recibir actualizaciones instantáneas. No pueden ver ventas/gastos.

### Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| Frontend | React 18.2+, Vite, Tailwind CSS, Lucide React |
| State Management | Zustand |
| Routing | React Router DOM |
| Charts | Chart.js + React-ChartJS-2 |
| Backend | Supabase (Postgres + Auth + Realtime + RLS) |
| Impresión | ESC/POS over Bluetooth/TCP |
| PWA | Manifest + Service Worker |

### Estilos

- **Colores Primary**: Amber-600 (#d97706)
- **Colores Secondary**: Orange (usado para gastos/alertas)
- **Tipografía**: Inter, sans-serif
- **Responsive**: Mobile-first, funciona en phone/tablet/desktop
- **PWA**: Se puede agregar a pantalla de inicio

### Seguridad

- **Autenticación**: Supabase Auth (JWT), Email + password, Logout funcional
- **Row Level Security (RLS)**: En TODAS las tablas con 20+ policies
- **Auditoría**: Trigger automático en cambios, log de quién hizo qué y cuándo
- **Validaciones**: Manejo de errores en todas las operaciones

### Estructura de Archivos

```
carnitas-sistema/
├─ 01_schema.sql              ← SQL para Supabase
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ .env.example
├─ README.md                  ← Este archivo
├─ GUIA_SETUP.md              ← Guía de setup paso a paso
├─ index.html                 ← HTML con PWA meta tags
├─ public/manifest.json       ← Manifest PWA
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx                 ← Router + Layout
│  ├─ pages/ (8 files)
│  │  ├─ LoginPage.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ VentasPage.jsx
│  │  ├─ GastosPage.jsx
│  │  ├─ PedidosPage.jsx
│  │  ├─ InventarioPage.jsx
│  │  ├─ ReportesPage.jsx
│  │  └─ AuditoriaPage.jsx
│  ├─ components/ (2 files)
│  │  ├─ Header.jsx
│  │  └─ Sidebar.jsx
│  ├─ hooks/ (1 file)
│  │  └─ useBluetoothPrinter.js
│  ├─ store/ (1 file)
│  │  └─ authStore.js
│  └─ styles/ (1 file)
│     └─ globals.css
└─ public/
   └─ manifest.json
```

### Scripts Disponibles

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa
npm run preview
```

### Dependencias Principales

- `@supabase/supabase-js`: Cliente oficial Supabase
- `chart.js`: Biblioteca de gráficas
- `lucide-react`: Íconos
- `react`, `react-dom`: React 18.2+
- `react-chartjs-2`: Integración Chart.js con React
- `react-router-dom`: Navegación
- `zustand`: State management

### Dependencias de Desarrollo

- `@vitejs/plugin-react`: Plugin Vite para React
- `tailwindcss`: Framework CSS
- `postcss`: Procesador CSS
- `autoprefixer`: Autoprefixing
- `eslint`, `eslint-plugin-react`: Linting

### Configuración Inicial

1. Crear proyecto en Supabase
2. Ejecutar `01_schema.sql` en el editor SQL de Supabase
3. Configurar variables de entorno en `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Ejecutar `npm install`
5. Iniciar con `npm run dev`

### Flujos Críticos

#### Sincronización en Tiempo Real

1. Sofía (iPhone) crea pedido en PedidosPage
2. Supabase Realtime dispara evento `INSERT` en tabla `pedidos`
3. María y Carlos (Android) ven nuevo pedido INSTANTÁNEAMENTE (< 1 segundo) mediante subscription
4. Alguien cambia estado a "preparando": TODOS ven cambio al instante
5. Usar Supabase Realtime subscriptions con channels específicos

#### Flujo de Venta

1. Vendedor crea venta en VentasPage
2. `ventas_items` trigger descontará stock automáticamente
3. `calcular_venta_total` trigger recalculará total automaticamente
4. `trigger_registrar_movimiento_venta` registrará movimiento en `movimientos_inventario`
5. Auditoría registra automáticamente el cambio
6. Ticket se imprime en formato ESC/POS

#### Flujo de Gasto

1. Sócio crea gasto en GastosPage
2. Solo el admin puede editar/eliminar gastos
3. RLS policies impiden que socio vea/edite gastos de otros
4. Control_caja se actualiza automáticamente mediante vistas

### Personalizaciones Futuras Posibles

- Autenticación Google/GitHub
- Expansión a multi-sucursal
- WhatsApp Bot para pedidos
- Integración con contabilidad
- Sistema de turnos y mesas
- Cliente loyalty program

---

Generado para: La Barrita de Carnitas
Fecha: Domingo, 30 de agosto de 2026
Sistema: POS Completo React + Supabase