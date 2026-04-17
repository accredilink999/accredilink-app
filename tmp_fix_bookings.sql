CREATE TABLE IF NOT EXISTS forum_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type TEXT NOT NULL CHECK (type IN ('slot', 'booking', 'blocked')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    notes TEXT,
    user_name TEXT,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_bookings_date ON forum_bookings (date);
CREATE INDEX IF NOT EXISTS idx_forum_bookings_type ON forum_bookings (type);
CREATE INDEX IF NOT EXISTS idx_forum_bookings_user ON forum_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_bookings_status ON forum_bookings (status);
