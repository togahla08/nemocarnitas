-- ============================================================
-- SISTEMA POS - La Barrita de Carnitas
-- Base de datos Supabase/Postgres
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA 1: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'socio', 'toma_pedidos')),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales - Usuarios
INSERT INTO usuarios (email, nombre, rol) VALUES
('juan@labarrita.com', 'Juan', 'admin'),
('maria@labarrita.com', 'María', 'socio'),
('carlos@labarrita.com', 'Carlos', 'socio'),
('sofia@labarrita.com', 'Sofía', 'toma_pedidos')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TABLA 2: productos
-- ============================================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
  costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  categoria VARCHAR(50) NOT NULL DEFAULT 'carnitas',
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales - Productos ejemplo
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

-- ============================================================
-- TABLA 3: ventas
-- ============================================================
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_venta SERIAL UNIQUE NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  usuario_id UUID REFERENCES usuarios(id),
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  estado VARCHAR(20) NOT NULL DEFAULT 'completado' CHECK (estado IN ('completado', 'cancelado')),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para auto-calcular total de venta
CREATE OR REPLACE FUNCTION calcular_venta_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total = (SELECT COALESCE(SUM(subtotal), 0) FROM ventas_items WHERE venta_id = NEW.venta_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_venta_total
  AFTER INSERT ON ventas_items
  FOR EACH ROW EXECUTE FUNCTION calcular_venta_total();

-- ============================================================
-- TABLA 4: ventas_items
-- ============================================================
CREATE TABLE ventas_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar stock al vender
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos SET stock = stock - NEW.cantidad
  WHERE id = NEW.producto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_venta
  AFTER INSERT ON ventas_items
  FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();

-- Trigger para registrar movimiento de inventario
CREATE OR REPLACE FUNCTION registrar_movimiento_inventario_venta()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id UUID;
BEGIN
  SELECT usuario_id INTO v_usuario_id FROM ventas WHERE id = NEW.venta_id;
  INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, fecha, usuario_id, referencia_tipo, referencia_id)
  VALUES (NEW.producto_id, 'salida', NEW.cantidad, NOW(), v_usuario_id, 'venta', NEW.venta_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_registrar_movimiento_venta
  AFTER INSERT ON ventas_items
  FOR EACH ROW EXECUTE FUNCTION registrar_movimiento_inventario_venta();

-- ============================================================
-- TABLA 5: gastos
-- ============================================================
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha TIMESTAMPTZ DEFAULT NOW(),
  descripcion VARCHAR(255) NOT NULL,
  cantidad DECIMAL(12,2) NOT NULL DEFAULT 0,
  categoria VARCHAR(50) NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'cancelado')),
  created_by UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales - Categorías de ejemplo
INSERT INTO gastos (descripcion, cantidad, categoria, usuario_id, created_by, estado) VALUES
('Compra de carne por semana', 2000.00, 'mercancia', (SELECT id FROM usuarios WHERE rol = 'socio'), (SELECT id FROM usuarios WHERE rol = 'admin'), 'aprobado'),
('Servicios públicos', 800.00, 'servicios', (SELECT id FROM usuarios WHERE rol = 'socio'), (SELECT id FROM usuarios WHERE rol = 'admin'), 'aprobado'),
('Embalaje', 300.00, 'mercancia', (SELECT id FROM usuarios WHERE rol = 'socio'), (SELECT id FROM usuarios WHERE rol = 'admin'), 'pendiente')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA 6: pedidos
-- ============================================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido SERIAL UNIQUE NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  cliente_nombre VARCHAR(100) NOT NULL,
  tipo_pedido VARCHAR(20) NOT NULL DEFAULT 'mostrar' CHECK (tipo_pedido IN ('mostrar', 'para_llevar', 'delivery')),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado')),
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  usuario_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para auto-calcular total de pedido
CREATE OR REPLACE FUNCTION calcular_pedido_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total = (SELECT COALESCE(SUM(subtotal), 0) FROM pedidos_items WHERE pedido_id = NEW.pedido_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_pedido_total
  AFTER INSERT ON pedidos_items
  FOR EACH ROW EXECUTE FUNCTION calcular_pedido_total();

-- ============================================================
-- TABLA 7: pedidos_items
-- ============================================================
CREATE TABLE pedidos_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA 8: movimientos_inventario
-- ============================================================
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id UUID REFERENCES productos(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  cantidad INTEGER NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  usuario_id UUID REFERENCES usuarios(id),
  referencia_tipo VARCHAR(50),
  referencia_id UUID,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA 9: control_caja
-- ============================================================
CREATE TABLE control_caja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE UNIQUE NOT NULL,
  saldo_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_ventas DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_gastos DECIMAL(12,2) NOT NULL DEFAULT 0,
  efectivo_real DECIMAL(12,2),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para calcular totales de caja
CREATE OR REPLACE FUNCTION actualizar_control_caja()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO NEW.total_ventas
  FROM ventas WHERE fecha::date = NEW.fecha;
  
  SELECT COALESCE(SUM(cantidad), 0) INTO NEW.total_gastos
  FROM gastos WHERE fecha::date = NEW.fecha;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_control_caja
  BEFORE INSERT OR UPDATE ON control_caja
  FOR EACH ROW EXECUTE FUNCTION actualizar_control_caja();

-- ============================================================
-- TABLA 10: auditoria
-- ============================================================
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  tabla VARCHAR(50) NOT NULL,
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE')),
  valores_anteriores JSONB,
  valores_nuevos JSONB,
  fecha TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION trigger_auditar()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, tabla, accion, valores_anteriores, valores_nuevos, fecha)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditar_usuarios
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_productos
  AFTER INSERT OR UPDATE OR DELETE ON productos
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_ventas
  AFTER INSERT OR UPDATE OR DELETE ON ventas
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_ventas_items
  AFTER INSERT OR UPDATE OR DELETE ON ventas_items
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_gastos
  AFTER INSERT OR UPDATE OR DELETE ON gastos
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_pedidos
  AFTER INSERT OR UPDATE OR DELETE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_pedidos_items
  AFTER INSERT OR UPDATE OR DELETE ON pedidos_items
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_movimientos
  AFTER INSERT OR UPDATE OR DELETE ON movimientos_inventario
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_control_caja
  AFTER INSERT OR UPDATE OR DELETE ON control_caja
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

CREATE TRIGGER trigger_auditar_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON auditoria
  FOR EACH ROW EXECUTE FUNCTION trigger_auditar();

-- ============================================================
-- VISTAS ANALÍTICAS
-- ============================================================

CREATE VIEW vw_ventas_diarias AS
SELECT 
  DATE(fecha) AS fecha,
  COUNT(*) AS total_ventas,
  SUM(total) AS total_generado,
  SUM(CASE WHEN tipo_pago = 'efectivo' THEN total ELSE 0 END) AS total_efectivo,
  SUM(CASE WHEN tipo_pago = 'tarjeta' THEN total ELSE 0 END) AS total_tarjeta
FROM ventas
GROUP BY DATE(fecha)
ORDER BY DATE(fecha) DESC;

CREATE VIEW vw_productos_rotacion AS
SELECT 
  p.nombre,
  p.categoria,
  COALESCE(SUM(vi.cantidad), 0) AS total_vendido,
  COALESCE(SUM(vi.subtotal), 0) AS ingreso_total,
  p.stock
FROM productos p
LEFT JOIN ventas_items vi ON p.id = vi.producto_id
GROUP BY p.id, p.nombre, p.categoria, p.stock
ORDER BY total_vendido DESC;

CREATE VIEW vw_rentabilidad AS
SELECT 
  p.nombre,
  p.categoria,
  COALESCE(SUM(vi.cantidad), 0) AS unidades_vendidas,
  COALESCE(SUM(vi.subtotal), 0) AS ingreso_bruto,
  COALESCE(SUM(vi.cantidad * p.costo_unitario), 0) AS costo_total,
  COALESCE(SUM(vi.subtotal), 0) - COALESCE(SUM(vi.cantidad * p.costo_unitario), 0) AS ganancia_neta
FROM productos p
LEFT JOIN ventas_items vi ON p.id = vi.producto_id
GROUP BY p.id, p.nombre, p.categoria
ORDER BY ganancia_neta DESC;

CREATE VIEW vw_gastos_resumen AS
SELECT 
  DATE(fecha) AS fecha,
  COUNT(*) AS total_gastos,
  SUM(cantidad) AS total_cantidad,
  STRING_AGG(DISTINCT categoria, ', ') AS categorias
FROM gastos
GROUP BY DATE(fecha)
ORDER BY DATE(fecha) DESC;

CREATE VIEW vw_estado_pedidos AS
SELECT 
  p.id,
  p.numero_pedido,
  p.cliente_nombre,
  p.tipo_pedido,
  p.estado,
  p.fecha,
  COALESCE(SUM(pi.subtotal), 0) AS total_pedido
FROM pedidos p
LEFT JOIN pedidos_items pi ON p.id = pi.pedido_id
GROUP BY p.id, p.numero_pedido, p.cliente_nombre, p.tipo_pedido, p.estado, p.fecha
ORDER BY p.fecha DESC;

-- ============================================================
-- POLÍTICAS RLS - Usar rol de usuarios table
-- ============================================================
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

-- Rolada de función auxiliar (opcional, para verificar rol)
CREATE OR REPLACE FUNCTION es_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Políticas USUARIOS
-- ============================================================
CREATE POLICY policy_usuarios_admin ON usuarios
  FOR ALL TO admin USING (true) WITH CHECK (true);

CREATE POLICY policy_usuarios_propios ON usuarios
  FOR SELECT TO socio, toma_pedidos USING (email = (SELECT email FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- Políticas PRODUCTOS
-- ============================================================
CREATE POLICY policy_productos_admin ON productos FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_productos_socio ON productos FOR ALL TO socio USING (true);
CREATE POLICY policy_productos_toma_pedidos ON productos FOR SELECT TO toma_pedidos USING (activo = true);

-- ============================================================
-- Políticas VENTAS
-- ============================================================
CREATE POLICY policy_ventas_admin ON ventas FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_ventas_socio ON ventas FOR SELECT TO socio USING (usuario_id = auth.uid());
CREATE POLICY policy_ventas_socio_insert ON ventas FOR INSERT TO socio WITH CHECK (usuario_id = auth.uid());
CREATE POLICY policy_ventas_toma_pedidos ON ventas FOR SELECT TO toma_pedidos USING (false);

-- ============================================================
-- Políticas VENTAS_ITEMS
-- ============================================================
CREATE POLICY policy_ventas_items_admin ON ventas_items FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_ventas_items_socio ON ventas_items FOR SELECT TO socio USING (
  venta_id IN (SELECT id FROM ventas WHERE usuario_id = auth.uid())
);
CREATE POLICY policy_ventas_items_toma_pedidos ON ventas_items FOR SELECT TO toma_pedidos USING (false);

-- ============================================================
-- Políticas GASTOS
-- ============================================================
CREATE POLICY policy_gastos_admin ON gastos FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_gastos_socio_select ON gastos FOR SELECT TO socio USING (usuario_id = auth.uid());
CREATE POLICY policy_gastos_socio_insert ON gastos FOR INSERT TO socio WITH CHECK (usuario_id = auth.uid());
CREATE POLICY policy_gastos_socio_update ON gastos FOR UPDATE TO socio USING (false);
CREATE POLICY policy_gastos_socio_delete ON gastos FOR DELETE TO socio USING (false);
CREATE POLICY policy_gastos_toma_pedidos ON gastos FOR SELECT TO toma_pedidos USING (false);

-- ============================================================
-- Políticas PEDIDOS
-- ============================================================
CREATE POLICY policy_pedidos_admin ON pedidos FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_pedidos_socio ON pedidos FOR SELECT TO socio USING (usuario_id = auth.uid());
CREATE POLICY policy_pedidos_toma_pedidos_select ON pedidos FOR SELECT TO toma_pedidos USING (true);
CREATE POLICY policy_pedidos_toma_pedidos_insert ON pedidos FOR INSERT TO toma_pedidos WITH CHECK (true);

-- ============================================================
-- Políticas PEDIDOS_ITEMS
-- ============================================================
CREATE POLICY policy_pedidos_items_admin ON pedidos_items FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_pedidos_items_socio ON pedidos_items FOR SELECT TO socio USING (
  pedido_id IN (SELECT id FROM pedidos WHERE usuario_id = auth.uid())
);
CREATE POLICY policy_pedidos_items_toma_pedidos ON pedidos_items FOR SELECT TO toma_pedidos USING (true);

-- ============================================================
-- Políticas MOVIMIENTOS_INVENTARIO
-- ============================================================
CREATE POLICY policy_movimientos_admin ON movimientos_inventario FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_movimientos_lectura ON movimientos_inventario FOR SELECT TO socio, toma_pedidos USING (true);

-- ============================================================
-- Políticas CONTROL_CAJA
-- ============================================================
CREATE POLICY policy_control_caja_admin ON control_caja FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_control_caja_select ON control_caja FOR SELECT TO socio, toma_pedidos USING (true);

-- ============================================================
-- Políticas AUDITORÍA
-- ============================================================
CREATE POLICY policy_auditoria_admin ON auditoria FOR ALL TO admin USING (true) WITH CHECK (true);
CREATE POLICY policy_auditoria_lectura ON auditoria FOR SELECT TO socio, toma_pedidos USING (false);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha DESC);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha DESC);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);