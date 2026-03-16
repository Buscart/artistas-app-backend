-- Migration: Portfolio Featured Logic
-- Description: Agrega is_featured a featured_items y profile_complete a users
-- Date: 2026-03-16

-- ============================================================================
-- 1. AGREGAR is_featured A featured_items
-- ============================================================================
ALTER TABLE featured_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Solo puede haber un video destacado por usuario (índice parcial)
-- No se usa UNIQUE para permitir el swap atómico, pero ayuda al query optimizer
CREATE INDEX IF NOT EXISTS idx_featured_items_user_featured
  ON featured_items (user_id)
  WHERE is_featured = true;

-- ============================================================================
-- 2. AGREGAR profile_complete A users
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
