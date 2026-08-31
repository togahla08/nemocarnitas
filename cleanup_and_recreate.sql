-- ============================================================
-- SCRIPT DE LIMPIEZA Y RECREACIÓN - La Barrita de Carnitas POS
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar TABLAS existentes
-- ============================================================
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS control_caja CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS pedidos_items CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS gastos CASCADE;
DROP TABLE IF EXISTS ventas_items CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================================
-- PASO 2: Eliminar FUNCIONES
-- ============================================================
DROP FUNCTION IF EXISTS calcular_venta_total();
DROP FUNCTION IF EXISTS calcular_pedido_total();
DROP FUNCTION IF EXISTS actualizar_stock_venta();
DROP FUNCTION IF EXISTS registrar_movimiento_inventario_venta();
DROP FUNCTION IF EXISTS actualizar_control_caja();
DROP FUNCTION IF EXISTS trigger_auditar();
DROP FUNCTION IF EXISTS es_admin();
DROP FUNCTION IF EXISTS current_user_email();

-- ============================================================
-- PASO 3: Eliminar VISTAS
-- ============================================================
DROP VIEW IF EXISTS vw_ventas_diarias;
DROP VIEW IF EXISTS vw_productos_rotacion;
DROP VIEW IF EXISTS vw_rentabilidad;
DROP VIEW IF EXISTS vw_gastos_resumen;
DROP VIEW IF EXISTS vw_estado_pedidos;

-- ============================================================
-- PASO 4: Eliminar extensiones (opcional)
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ¡LISTO! Ahora ejecuta el archivo 01_schema.sql completo
-- ============================================================
-- Instrucción: Ejecuta el contenido de 01_schema.sql desde aquí