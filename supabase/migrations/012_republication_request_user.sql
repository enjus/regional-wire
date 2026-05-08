ALTER TABLE republication_requests
  ADD COLUMN IF NOT EXISTS requesting_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
