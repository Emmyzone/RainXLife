const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATABASE_PATH = process.env.DATABASE_PATH || './data/rainxlife.db';
const resolvedPath = path.resolve(process.cwd(), DATABASE_PATH);

// Make sure the folder that will hold the SQLite file exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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
`);

// Seed default categories if the table is empty
const categoryCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
if (categoryCount === 0) {
  const insert = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
  const defaults = [
    ['Personal Development', 'personal-development'],
    ['Money & Wealth', 'money-and-wealth'],
    ['Psychology', 'psychology'],
    ['Business', 'business'],
    ['Productivity', 'productivity'],
    ['Life', 'life']
  ];
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row[0], row[1]);
  });
  insertMany(defaults);
}

module.exports = db;
