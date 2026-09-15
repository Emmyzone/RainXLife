const { createClient } = require('@libsql/client');

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error('ERROR: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set (see .env.example).');
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  book_title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_image TEXT DEFAULT '',
  category_id INTEGER,
  excerpt TEXT DEFAULT '',
  introduction TEXT DEFAULT '',
  content TEXT DEFAULT '',
  lessons TEXT DEFAULT '[]',
  takeaway TEXT DEFAULT '',
  who_should_read TEXT DEFAULT '',
  affiliate_url TEXT DEFAULT '',
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  reading_time INTEGER DEFAULT 5,
  views INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0,
  publication_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
`;

let initialized = false;

async function initDb() {
  if (initialized) return;

  await client.executeMultiple(SCHEMA);

  const countResult = await client.execute('SELECT COUNT(*) AS c FROM categories');
  const categoryCount = Number(countResult.rows[0].c);

  if (categoryCount === 0) {
    const defaults = [
      ['Personal Development', 'personal-development'],
      ['Money & Wealth', 'money-and-wealth'],
