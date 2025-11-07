-- Migration: Add Enhanced Events Ticket System
-- Created: 2025-01-05
-- Description: Adds ticket_types, seats, purchases, purchase_items, and event_attendees tables

-- ============================================================================
-- Ticket Types Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Basic Information
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP',

  -- Availability
  quantity INTEGER NOT NULL,
  sold_count INTEGER DEFAULT 0,

  -- Sale Period
  sale_start TIMESTAMP,
  sale_end TIMESTAMP,

  -- Purchase Limits
  min_per_order INTEGER DEFAULT 1,
  max_per_order INTEGER DEFAULT 10,

  -- Configuration
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,

  -- Seat Selection
  allow_seat_selection BOOLEAN DEFAULT false,

  -- Custom Fields (JSON)
  custom_fields JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ticket_types
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_is_active ON ticket_types(is_active);

-- ============================================================================
-- Seats Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Seat Location
  section VARCHAR(50) NOT NULL,
  row VARCHAR(10) NOT NULL,
  number VARCHAR(10) NOT NULL,

  -- Seat Status
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'blocked')),

  -- Ticket Type Assignment
  ticket_type_id INTEGER REFERENCES ticket_types(id) ON DELETE SET NULL,

  -- Metadata (visual position, features)
  metadata JSONB DEFAULT '{}',

  -- Reservation/Sale Information
  reserved_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reserved_at TIMESTAMP,
  reservation_expiry TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for seats
CREATE INDEX idx_seats_event_id ON seats(event_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_seats_ticket_type_id ON seats(ticket_type_id);
CREATE INDEX idx_seats_reserved_by ON seats(reserved_by);
CREATE UNIQUE INDEX idx_seats_unique_location ON seats(event_id, section, row, number);

-- ============================================================================
-- Purchases Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Totals
  subtotal NUMERIC(10, 2) NOT NULL,
  fees NUMERIC(10, 2) DEFAULT 0,
  taxes NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP',

  -- Payment Status
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255), -- Stripe, PayPal, etc. transaction ID

  -- Contact Information
  email VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR,

  -- Timestamps
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for purchases
CREATE INDEX idx_purchases_event_id ON purchases(event_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX idx_purchases_payment_id ON purchases(payment_id);

-- ============================================================================
-- Purchase Items Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchase_items (
  id SERIAL PRIMARY KEY,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  seat_id INTEGER REFERENCES seats(id) ON DELETE SET NULL,

  -- Quantity and Price
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NOT NULL, -- Unit price at time of purchase
  subtotal NUMERIC(10, 2) NOT NULL,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for purchase_items
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_ticket_type_id ON purchase_items(ticket_type_id);
CREATE INDEX idx_purchase_items_seat_id ON purchase_items(seat_id);

-- ============================================================================
-- Event Attendees Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_attendees (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Ticket Information
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  seat_id INTEGER REFERENCES seats(id) ON DELETE SET NULL,

  -- Attendee Status
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'no_show', 'cancelled')),

  -- Custom Field Responses
  custom_field_responses JSONB DEFAULT '{}',

  -- Check-in
  checked_in_at TIMESTAMP,
  checked_in_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,

  -- Timestamps
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for event_attendees
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_purchase_id ON event_attendees(purchase_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);
CREATE UNIQUE INDEX idx_event_user_purchase_unique ON event_attendees(event_id, user_id, purchase_id);

-- ============================================================================
-- Triggers for Updated At
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
CREATE TRIGGER update_ticket_types_updated_at
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
  BEFORE UPDATE ON seats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendees_updated_at
  BEFORE UPDATE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE ticket_types IS 'Defines different types of tickets for events (e.g., General, VIP, Early Bird)';
COMMENT ON TABLE seats IS 'Manages individual seats for events with assigned seating (cinema, theater, concerts)';
COMMENT ON TABLE purchases IS 'Records ticket purchases and payment information';
COMMENT ON TABLE purchase_items IS 'Line items for each purchase (multiple tickets per purchase)';
COMMENT ON TABLE event_attendees IS 'Tracks who is attending each event and their check-in status';

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment the following to add sample ticket types to existing events
/*
INSERT INTO ticket_types (event_id, name, description, price, quantity)
SELECT
  id as event_id,
  'General Admission' as name,
  'Standard entry ticket' as description,
  COALESCE(ticket_price, 0) as price,
  COALESCE(capacity, 100) as quantity
FROM events
WHERE id IN (SELECT id FROM events LIMIT 5);
*/

-- ============================================================================
-- Rollback Script (save for reference)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP TRIGGER IF EXISTS update_event_attendees_updated_at ON event_attendees;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
DROP TRIGGER IF EXISTS update_ticket_types_updated_at ON ticket_types;

DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;

-- Note: The update_updated_at_column() function is kept as it may be used by other tables
*/
