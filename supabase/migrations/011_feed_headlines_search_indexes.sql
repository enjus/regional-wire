-- Enable trigram extension (idempotent) and add GIN indexes for
-- case-insensitive substring search on feed_headlines title and author.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_feed_headlines_title_trgm
  ON feed_headlines USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_feed_headlines_author_trgm
  ON feed_headlines USING gin (author gin_trgm_ops);
