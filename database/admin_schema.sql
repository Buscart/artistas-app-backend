-- Tablas adicionales para el panel de administración
-- Estas tablas complementan las existentes sin modificarlas

-- Perfiles de Artistas (extiende usuarios)
CREATE TABLE IF NOT EXISTS artist_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    bio TEXT,
    experience_years INTEGER,
    location VARCHAR(255),
    profile_image TEXT,
    portfolio_images JSON,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_verification_status (verification_status)
);

-- Perfiles de Empresas
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    industry VARCHAR(100),
    description TEXT,
    website TEXT,
    employees_count INTEGER,
    annual_revenue DECIMAL(15,2),
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_industry (industry),
    INDEX idx_verification_status (verification_status)
);

-- Perfiles de Clientes
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(50),
    location VARCHAR(255),
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id)
);

-- Documentos de Verificación KYC
CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type ENUM('id_card', 'passport', 'artist_kyc', 'company_kyc') NOT NULL,
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),
    expiry_date DATE,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_document_type (document_type)
);

-- Reviews y Calificaciones
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR(255) REFERENCES contracts(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    reviewed_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_contract_id (contract_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_reviewed_id (reviewed_id),
    INDEX idx_rating (rating)
);

-- Actualizar tabla users para incluir role y status si no existen
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role ENUM('client', 'artist', 'company', 'admin') DEFAULT 'client',
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
