BEGIN;
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY,
  data bytea NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/webp',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY,
  title varchar(80) NOT NULL CHECK (length(trim(title)) > 0),
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title varchar(150) NOT NULL CHECK (length(trim(title)) > 0),
  image_url text NOT NULL,
  image_credit jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gifts_list_id_idx ON gifts(list_id);
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS product_url text;
COMMIT;
