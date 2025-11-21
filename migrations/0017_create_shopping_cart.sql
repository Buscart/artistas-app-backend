-- Migration: Create Shopping Cart System
-- Description: Adds tables for a complete shopping cart system supporting multiple item types
-- Author: Claude
-- Date: 2025-01-19

-- ============================================
-- Tabla principal del carrito
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- Para usuarios no autenticados (opcional)
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'abandoned', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'), -- Carritos expiran en 7 días
  UNIQUE(user_id, status) -- Un usuario solo puede tener un carrito activo a la vez
);

-- ============================================
-- Items del carrito
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('service', 'product', 'event', 'booking')),
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),

  -- Metadata adicional específica por tipo de item (JSON)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Ejemplos de metadata:
  -- service: { "duration": "2 hours", "date": "2025-02-15", "artistName": "..." }
  -- product: { "size": "M", "color": "blue" }
  -- event: { "ticketType": "VIP", "eventDate": "2025-03-20" }
  -- booking: { "startDate": "2025-04-10", "endDate": "2025-04-12", "venueName": "..." }

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Un item específico solo puede estar una vez en el carrito (misma combinación de tipo+id+metadata)
  UNIQUE(cart_id, item_type, item_id, metadata)
);

-- ============================================
-- Historial de checkouts (para analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_checkouts (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  items_count INTEGER NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_id VARCHAR(255), -- ID de transacción externa (ej: Mercado Pago)
  checkout_data JSONB, -- Información del checkout (dirección, notas, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- ============================================
-- Índices para optimizar consultas
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_expires ON carts(expires_at);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_type ON cart_items(item_type);
CREATE INDEX IF NOT EXISTS idx_cart_items_item ON cart_items(item_type, item_id);

CREATE INDEX IF NOT EXISTS idx_cart_checkouts_user ON cart_checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_checkouts_payment ON cart_checkouts(payment_status);

-- ============================================
-- Función para actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers para actualizar timestamps
-- ============================================
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_updated_at();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_updated_at();

-- ============================================
-- Función para limpiar carritos expirados (ejecutar periódicamente)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS void AS $$
BEGIN
  UPDATE carts
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comentarios para documentación
-- ============================================
COMMENT ON TABLE carts IS 'Carritos de compra de usuarios. Un usuario solo puede tener un carrito activo a la vez.';
COMMENT ON TABLE cart_items IS 'Items individuales dentro de los carritos. Soporta múltiples tipos: servicios, productos, eventos y reservas.';
COMMENT ON TABLE cart_checkouts IS 'Historial de checkouts realizados para analytics y seguimiento de conversiones.';

COMMENT ON COLUMN carts.status IS 'Estado del carrito: active (en uso), checked_out (comprado), abandoned (abandonado), expired (expirado)';
COMMENT ON COLUMN cart_items.item_type IS 'Tipo de item: service (servicio de artista), product (producto de tienda), event (ticket de evento), booking (reserva de espacio)';
COMMENT ON COLUMN cart_items.metadata IS 'Datos adicionales en formato JSON específicos del tipo de item (fecha, duración, talla, etc.)';
