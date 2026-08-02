-- Generated for LinkBio decorate / social / MCP upgrade
ALTER TABLE pages ADD COLUMN IF NOT EXISTS contact_email varchar(320) DEFAULT '' NOT NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_share boolean DEFAULT true NOT NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_contact boolean DEFAULT true NOT NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS design jsonb DEFAULT '{}'::jsonb NOT NULL;

CREATE TABLE IF NOT EXISTS social_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  platform varchar(24) NOT NULL,
  handle varchar(80) DEFAULT '' NOT NULL,
  url text NOT NULL,
  title varchar(120) DEFAULT '' NOT NULL,
  description varchar(280) DEFAULT '' NOT NULL,
  image_url text DEFAULT '' NOT NULL,
  site_name varchar(80) DEFAULT '' NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  is_visible boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS social_channels_page_url_unique ON social_channels (page_id, url);
