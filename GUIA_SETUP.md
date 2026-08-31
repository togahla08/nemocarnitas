# GUIA DE SETUP - La Barrita de Carnitas POS

## Paso a paso para tener el sistema funcionando

### Requisitos Previos

1. **Cuenta de Supabase**
   - Regístrate en https://supabase.io
   - Crea un nuevo proyecto llamado "labarrita-carnitas"

2. **Node.js y npm**
   - Tener Node.js v18+ instalado
   - npm v9+ disponible

3. **Navegador**
   - Chrome, Firefox, Safari o Edge actualizados
   - Para impresora Bluetooth: dispositivo Android con soporte Web Bluetooth

---

## Paso 1: Configurar Supabase

### 1.1 Crear Proyecto
- Ve a supabase.io y crea una nueva cuenta/proyecto
- Nombre: `labarrita-carnitas`
- Región: Eleige la más cercana a tus usuarios

### 1.2 Ejecutar SQL Schema

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Haz clic en **New Query**
3. Copia y pega el contenido de `01_schema.sql`
4. Ejecuta el query (⏻)
5. Verifica que todas las tablas se crearon correctamente

### 1.3 Configurar Auth

1. Ve a **Authentication** → **Settings** en el dashboard
2. Habilita **Email password**
3. (Opcional) Configura providers de Google/GitHub si deseas
4. Configura el **Site URL** para desarrollo local (http://localhost:5173)

### 1.4 Obtener Credenciales

1. Ve a **Project Settings** → **API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## Paso 2: Configuración del Proyecto Frontend

### 2.1 Clonar o Crear Proyecto

```bash
# Opción A: Si ya tienes la estructura generada
cd carnitas-sistema

# Opción B: Crear desde cero con Vite
npm create vite@latest labarrita-pos -- --template react
cd labarrita-pos
```

### 2.2 Instalar Dependencias

```bash
npm install
```

### 2.3 Copiar Archivos de Configuración

Copia estos archivos desde la estructura generada:

- `package.json` - Ya incluye todas las dependencias necesarias
- `vite.config.js` - Configuración de Vite con React
- `tailwind.config.js` - Configuración con colores Amber-600
- `.env.example` - Ejemplo de variables de entorno

### 2.4 Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://TU-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### 2.5 Instalar Dependencias Adicionales

```bash
npm install @supabase/supabase-js chart.js react-chartjs-2 lucide-react
```

### 2.6 Inicializar Tailwind CSS

```bash
npx tailwindcss init -p
```

Esto generará `tailwind.config.js` y `postcss.config.js`. Copia la configuración del `tailwind.config.js` generado en el prompt.

### 2.7 Agregar CSS Global

En `src/index.css` (o `main.jsx`), importa:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

También importa `globals.css` desde el prompt.

### 2.8 Configurar Source Files

Copia toda la carpeta `src/` desde la estructura generada, incluyendo:
- `main.jsx` - Punto de entrada
- `App.jsx` - Router y Layout
- `pages/` - Las 8 páginas del sistema
- `components/` - Header y Sidebar
- `hooks/` - useBluetoothPrinter.js
- `store/` - authStore.js
- `styles/` - globals.css

### 2.9 Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Deberías ver la aplicación corriendo en http://localhost:5173

---

## Paso 3: Configurar Impresora Térmica (Opcional)

### 3.1 Para Dispositivos Android

La impresora térmica necesita soporte Web Bluetooth:

1. En el dispositivo Android, habilita **Bluetooth** en configuración
2. Empareja la impresora (ej: Star TSP650, Epson TM-T88V)
3. La app solicitará permisos de Bluetooth al momento de imprimir
4. Usa `useBluetoothPrinter.js` con `connectBluetooth(nombreImpresora)`

### 3.2 Para TCP/Red (Cualquier dispositivo)

1. Asegúrate de que la impresora esté en la misma red WiFi
2. Obtiene la dirección IP de la impresora (generalmente imprime una página de red)
3. Configura en el sistema la IP y puerto 9100
4. Usa `connectTCP(ip, 9100)` en el hook

### 3.3 Formato de Ticket

La función `formatTicket()` genera texto en formato ESC/POS que incluye:

- Header: "LA BARRITA DE CARNITAS" con bordes ASCII
- Información de venta: #001 | Fecha | Hora
- Tabla de productos: PRODUCTO | CANT | PRECIO
- Total y forma de pago
- Footer: "¡Gracias por su compra!"
- Comando de corte de papel

---

## Paso 4: Configurar RLS Policies

### 4.1 Habilitar RLS en todas las tablas

Después de ejecutar el schema, habilita Row Level Security:

```sql
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
```

### 4.2 Las 20+ Policies RLS

El schema incluye políticas automáticas. Verifica que estén todas en Supabase. Las políticas clave son:

- **Usuarios**: Admin ve todo, otros solo su propio registro
- **Productos**: Admin y socio ven todos, toma_pedidos solo activos
- **Ventas**: Admin todo, socio solo las suyas, toma_pedidos no ve
- **Ventas_items**: Mismo patrón que ventas
- **Gastos**: Admin todo, socio solo puede CREATE de los suyos, no editar/eliminar
- **Pedidos**: Admin todo, socio sus pedidos, toma_pedidos puede crear y ver
- **Auditoría**: Solo admin puede ver completa

### 4.3 Probar RLS

1. Inicia sesión como admin y ver que ve todo
2. Inicia sesión como socio y ver que solo ve sus datos
3. Inicia sesión como toma_pedidos y ver que no ve ventas/gastos

---

## Paso 5: Crear Usuarios Iniciales

### 5.1 Acceso al Table Editor

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `usuarios`

### 5.2 Insertar Usuarios

Ejecuta este SQL o inserta manualmente:

```sql
INSERT INTO usuarios (email, nombre, rol) VALUES
('juan@labarrita.com', 'Juan', 'admin'),
('maria@labarrita.com', 'María', 'socio'),
('carlos@labarrita.com', 'Carlos', 'socio'),
('sofia@labarrita.com', 'Sofía', 'toma_pedidos')
ON CONFLICT (email) DO NOTHING;
```

### 5.3 Datos Iniciales de Productos

Ve a **Table Editor** → `productos` e inserta:

```sql
INSERT INTO productos (nombre, precio_venta, costo_unitario, stock, stock_minimo, categoria) VALUES
('Carnidades Cerdo', 500.00, 300.00, 50, 10, 'carnitas'),
('Carnidades Pollo', 450.00, 270.00, 40, 8, 'carnitas'),
('Carnidades Res', 600.00, 380.00, 30, 5, 'carnitas'),
('Order de Carnitas (6 pzs)', 80.00, 50.00, 100, 20, 'order'),
('Agua', 25.00, 10.00, 200, 50, 'bebida'),
('Refresco', 28.00, 12.00, 200, 50, 'bebida'),
('Salsa Casera', 15.00, 5.00, 50, 10, 'acompañante'),
('Guacamole', 30.00, 15.00, 40, 8, 'acompañante'),
('Michelada', 40.00, 20.00, 60, 10, 'bebida'),
('Postre del Día', 35.00, 20.00, 30, 5, 'postre')
ON CONFLICT DO NOTHING;
```

---

## Paso 6: Probar el Sistema

### 6.1 Login por Rol

1. **Admin (Juan)**: `juan@labarrita.com` / contraseña por defecto o via Supabase
2. **Socio (María/Carlos)**: `maria@labarrita.com` o `carlos@labarrita.com`
3. **Toma Pedidos (Sofía)**: `sofia@labarrita.com`

### 6.2 Funcionalidades por Rol

**Admin**:
- ✓ Ver/editar/eliminar todas las ventas
- ✓ Crear/gestionar usuarios
- ✓ Ver auditoría completa
- ✓ Acceso a reportes avanzados

**Socio**:
- ✓ Crear propias ventas
- ✓ Crear gastos (propios)
- ✓ Gestionar inventario
- ✓ Ver reportes básicos
- ✗ No ver datos de otros socios
- ✗ No ver auditoría

**Toma Pedidos (Sofía)**:
- ✓ Crear pedidos nuevos
- ✓ Ver pedidos en tiempo real
- ✓ Gestionar inventario (descontar stock)
- ✓ Recibir actualizaciones instantáneas
- ✗ NO ver ventas/gastos

### 6.3 Probar Sincronización Real-time

1. Abre la app en dos pestañas/dispositivos diferentes
2. Como socio, crea un nuevo pedido
3. Como toma_pedidos, deberías ver el pedido aparecer al instante (< 1 segundo)
4. Cambiar el estado de "pendiente" a "preparando" debería verse en ambos dispositivos al mismo tiempo

### 6.4 Probar Impresión

1. Conecta una impresora Bluetooth o TCP
2. En una venta, haz clic en "Imprimir Ticket"
3. Debería imprimirse el formato con:
   - Bordes ASCII: ╔═══════════════════════════╗
   - "LA BARRITA DE CARNITAS"
   - Venta #001 | Fecha | Hora
   - Tabla PRODUCTO | CANT | PRECIO
   - TOTAL: $500
   - Pago: Efectivo
   - ¡Gracias por su compra!

---

## Paso 7: Build para Producción

```bash
npm run build
```

Esto generará la carpeta `dist/` con archivos optimizados para producción.

### Despliegue Estático

Puedes desplegar en:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Configurar en package.json

---

## Solución de Problemas Comunes

### Problema: "Supabase: No se pudo establecer conexión"

- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` sean correctos
- Asegúrate de haber habilitado Email password en Authentication
- Revisa que el proyecto de Supabase esté activo

### Problema: "RLS policy violation"

- Verifica que las policies RLS estén creadas en todas las tablas
- Confirma que el usuario tenga el rol correcto asignado en la tabla `usuarios`
- Revisa que `auth.uid()` retorne el ID correcto

### Problema: "WebSocket connection failed" (Realtime)

- Verifica que la URL de Supabase sea correcta
- Asegúrate de que el proyecto Supabase tenga Realtime habilitado
- Revisa que no haya CORS bloqueando la conexión
- Prueba en modo incógnito para descartar extensiones de navegador

### Problema: "Bluetooth no disponible"

- En dispositivos Android, asegúrate de tener Bluetooth activado
- El navegador debe apoyar Web Bluetooth API (Chrome/Firefox mejor soporte)
- Como alternativa, usar modo TCP/Red

### Problema: "Impresora no imprime"

- Verifica la conexión (Bluetooth emparejado o IP correcta para TCP)
- Confirma que la impresora esté en modo lista/online
- Revisa que el formato ESC/POS sea compatible con tu modelo de impresora
- Prueba con un ticket de prueba simple primero

---

## Resumen Rápido de Comandos

```bash
# 1. Instalar
npm install

# 2. Desarrollar
npm run dev          # http://localhost:5173

# 3. Build producción
npm run build

# 4. Preview build
npm run preview

# 5. Lint (opcional)
npm run lint 2>/dev/null || echo "No linter configured"
```

---

## Contacto y Soporte

- **Proyecto**: La Barrita de Carnitas POS
- **Stack**: React 18 + Supabase + Tailwind CSS
- **Fecha**: Agosto 2026
- **Versión**: 1.0.0

---

¿Necesitas ayuda con algún paso específico? Consulta la documentación de Supabase o los archivos generados en la carpeta `carnitas-sistema/`.