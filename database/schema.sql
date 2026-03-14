// Backend: database/schema.sql
// Esquema de base de datos para contratos

-- Usuarios (extender tabla existente)
ALTER TABLE users ADD COLUMN IF NOT EXISTS mp_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_rating_at TIMESTAMP;

-- Contratos
CREATE TABLE IF NOT EXISTS contracts (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) NOT NULL,
    
    -- Información del contrato
    service_title VARCHAR(255) NOT NULL,
    service_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    commission DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Fechas
    event_date DATE NOT NULL,
    event_location VARCHAR(500),
    technical_specs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Estado y pagos
    status ENUM('pending_payment', 'escrow_hold', 'in_progress', 'disputed', 'completed', 'cancelled', 'refunded') DEFAULT 'pending_payment',
    payment_id VARCHAR(255),
    mercado_pago_preference_id VARCHAR(255),
    payment_status VARCHAR(50),
    date_approved TIMESTAMP,
    
    -- Entrega
    delivery_date TIMESTAMP,
    delivery_evidence JSON,
    client_confirmed_at TIMESTAMP,
    
    -- Calificación
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    
    -- Disputas
    dispute_reason VARCHAR(255),
    dispute_description TEXT,
    dispute_evidence JSON,
    disputed_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Cancelación
    cancelled_at TIMESTAMP,
    cancelled_by VARCHAR(50), -- 'client' o 'artist'
    
    -- Metadata
    metadata JSON,
    
    -- Índices
    INDEX idx_client_id (client_id),
    INDEX idx_artist_id (artist_id),
    INDEX idx_status (status),
    INDEX idx_payment_id (payment_id),
    INDEX idx_created_at (created_at),
    INDEX idx_event_date (event_date)
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSON,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_read (read),
    INDEX idx_created_at (created_at)
);

-- Transacciones de Mercado Pago (para auditoría)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    payment_method VARCHAR(100),
    marketplace_fee DECIMAL(10,2),
    date_created TIMESTAMP,
    date_approved TIMESTAMP,
    
    INDEX idx_contract_id (contract_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_status (status)
);

-- Historial de reputación de artistas
CREATE TABLE IF NOT EXISTS artist_reputation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id VARCHAR(255) NOT NULL,
    contract_id VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL,
    review TEXT,
    client_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_artist_id (artist_id),
    INDEX idx_contract_id (contract_id),
    INDEX idx_created_at (created_at)
);

-- Disputas (tabla separada para mejor gestión)
CREATE TABLE IF NOT EXISTS disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_id VARCHAR(255) NOT NULL,
    initiated_by VARCHAR(255) NOT NULL, -- 'client' o 'artist'
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSON,
    status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by VARCHAR(255), -- admin user
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_contract_id (contract_id),
    INDEX idx_status (status),
    INDEX idx_initiated_by (initiated_by)
);

-- Configuración de la plataforma
CREATE TABLE IF NOT EXISTS platform_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT IGNORE INTO platform_config (key_name, value, description) VALUES
('commission_rate', '0.15', 'Comisión de la plataforma (15%)'),
('max_dispute_time_hours', '72', 'Tiempo máximo para resolver disputas (72 horas)'),
('min_rating', '1', 'Calificación mínima'),
('max_rating', '5', 'Calificación máxima'),
('auto_release_hours', '24', 'Horas después de confirmación para liberar pago automáticamente');
