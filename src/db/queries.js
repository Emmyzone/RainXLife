const db = require('./db');

// ---------- Categories ----------

function getAllCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
}

function getCategoryBySlug(slug) {
  return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function createCategory(name, slug, description = '') {
  return db
    .prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)')
    .run(name, slug, description);
}

function updateCategory(id, name, slug, description) {
  return db
    .prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?')
    .run(name, slug, description, id);
}

function deleteCategory(id) {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

// ---------- Articles ----------

const baseSelect = `
  SELECT articles.*, categories.name AS category_name, categories.slug AS category_slug
  FROM articles
  LEFT JOIN categories ON articles.category_id = categories.id
`;

function getPublishedArticles({ limit = 20, offset = 0 } = {}) {
  return db
    .prepare(`${baseSelect} WHERE articles.published = 1 ORDER BY articles.publication_date DESC LIMIT ? OFFSET ?`)
    .all(limit, offset);
}

function getFeaturedArticle() {
  return db
    .prepare(`${baseSelect} WHERE articles.published = 1 AND articles.featured = 1 ORDER BY articles.publication_date DESC LIMIT 1`)
    .get();
}

function getPopularArticles(limit = 6) {
  return db
    .prepare(`${baseSelect} WHERE articles.published = 1 ORDER BY articles.views DESC LIMIT ?`)
    .all(limit);
}

function getArticlesByCategory(categoryId, { limit = 50, offset = 0 } = {}) {
  return db
    .prepare(`${baseSelect} WHERE articles.published = 1 AND articles.category_id = ? ORDER BY articles.publication_date DESC LIMIT ? OFFSET ?`)
    .all(categoryId, limit, offset);
}

function getArticleBySlug(slug) {
  return db.prepare(`${baseSelect} WHERE articles.slug = ?`).get(slug);
}

function getArticleById(id) {
  return db.prepare(`${baseSelect} WHERE articles.id = ?`).get(id);
}

function getAllArticlesAdmin() {
  return db.prepare(`${baseSelect} ORDER BY articles.created_at DESC`).all();
}

function getRelatedArticles(categoryId, excludeId, limit = 4) {
  return db
    .prepare(`${baseSelect} WHERE articles.published = 1 AND articles.category_id = ? AND articles.id != ? ORDER BY articles.publication_date DESC LIMIT ?`)
    .all(categoryId, excludeId, limit);
}

function getPrevNextArticles(publicationDate, currentId) {
  const prev = db
    .prepare(`${baseSelect} WHERE articles.published = 1 AND articles.publication_date < ? AND articles.id != ? ORDER BY articles.publication_date DESC LIMIT 1`)
    .get(publicationDate, currentId);
  const next = db
    .prepare(`${baseSelect} WHERE articles.published = 1 AND articles.publication_date > ? AND articles.id != ? ORDER BY articles.publication_date ASC LIMIT 1`)
    .get(publicationDate, currentId);
  return { prev, next };
}

function searchArticles(query, { limit = 30 } = {}) {
  const q = `%${query.toLowerCase()}%`;
  return db
    .prepare(`
      ${baseSelect}
      WHERE articles.published = 1 AND (
        LOWER(articles.title) LIKE ? OR
        LOWER(articles.book_title) LIKE ? OR
        LOWER(articles.author) LIKE ? OR
        LOWER(articles.tags) LIKE ? OR
        LOWER(categories.name) LIKE ?
      )
      ORDER BY articles.publication_date DESC
      LIMIT ?
    `)
    .all(q, q, q, q, q, limit);
}

function incrementViews(id) {
  return db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);
}

function createArticle(data) {
  const stmt = db.prepare(`
    INSERT INTO articles (
      title, slug, book_title, author, cover_image, category_id, excerpt,
      introduction, content, lessons, takeaway, who_should_read, affiliate_url,
      seo_title, seo_description, tags, reading_time, featured, published, publication_date
    ) VALUES (
      @title, @slug, @book_title, @author, @cover_image, @category_id, @excerpt,
      @introduction, @content, @lessons, @takeaway, @who_should_read, @affiliate_url,
      @seo_title, @seo_description, @tags, @reading_time, @featured, @published, @publication_date
    )
  `);
  return stmt.run(data);
}

function updateArticle(id, data) {
  const stmt = db.prepare(`
    UPDATE articles SET
      title = @title,
      slug = @slug,
      book_title = @book_title,
      author = @author,
      cover_image = @cover_image,
      category_id = @category_id,
      excerpt = @excerpt,
      introduction = @introduction,
      content = @content,
      lessons = @lessons,
      takeaway = @takeaway,
      who_should_read = @who_should_read,
      affiliate_url = @affiliate_url,
      seo_title = @seo_title,
      seo_description = @seo_description,
      tags = @tags,
      reading_time = @reading_time,
      featured = @featured,
      published = @published,
      publication_date = @publication_date,
      updated_at = datetime('now')
    WHERE id = @id
  `);
  return stmt.run({ ...data, id });
}

function deleteArticle(id) {
  return db.prepare('DELETE FROM articles WHERE id = ?').run(id);
}

function getStats() {
  const total = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
  const published = db.prepare('SELECT COUNT(*) AS c FROM articles WHERE published = 1').get().c;
  const drafts = db.prepare('SELECT COUNT(*) AS c FROM articles WHERE published = 0').get().c;
  const totalViews = db.prepare('SELECT COALESCE(SUM(views), 0) AS v FROM articles').get().v;
  const popular = db
    .prepare(`${baseSelect} ORDER BY articles.views DESC LIMIT 5`)
    .all();
  return { total, published, drafts, totalViews, popular };
}

module.exports = {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublishedArticles,
  getFeaturedArticle,
  getPopularArticles,
  getArticlesByCategory,
  getArticleBySlug,
  getArticleById,
  getAllArticlesAdmin,
  getRelatedArticles,
  getPrevNextArticles,
  searchArticles,
  incrementViews,
  createArticle,
  updateArticle,
  deleteArticle,
  getStats
};
