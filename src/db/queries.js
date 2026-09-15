const { client } = require('./db');

// ---------- Categories ----------

async function getAllCategories() {
  const r = await client.execute('SELECT * FROM categories ORDER BY name ASC');
  return r.rows;
}

async function getCategoryBySlug(slug) {
  const r = await client.execute({ sql: 'SELECT * FROM categories WHERE slug = ?', args: [slug] });
  return r.rows[0];
}

async function getCategoryById(id) {
  const r = await client.execute({ sql: 'SELECT * FROM categories WHERE id = ?', args: [id] });
  return r.rows[0];
}

async function createCategory(name, slug, description = '') {
  return client.execute({
    sql: 'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
    args: [name, slug, description]
  });
}

async function updateCategory(id, name, slug, description) {
  return client.execute({
    sql: 'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
    args: [name, slug, description, id]
  });
}

async function deleteCategory(id) {
  return client.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
}

// ---------- Articles ----------

const baseSelect = `
  SELECT articles.*, categories.name AS category_name, categories.slug AS category_slug
  FROM articles
  LEFT JOIN categories ON articles.category_id = categories.id
`;

async function getPublishedArticles({ limit = 20, offset = 0 } = {}) {
  const r = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 ORDER BY articles.publication_date DESC LIMIT ? OFFSET ?`,
    args: [limit, offset]
  });
  return r.rows;
}

async function getFeaturedArticle() {
  const r = await client.execute(
    `${baseSelect} WHERE articles.published = 1 AND articles.featured = 1 ORDER BY articles.publication_date DESC LIMIT 1`
  );
  return r.rows[0];
}

async function getPopularArticles(limit = 6) {
  const r = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 ORDER BY articles.views DESC LIMIT ?`,
    args: [limit]
  });
  return r.rows;
}

async function getArticlesByCategory(categoryId, { limit = 50, offset = 0 } = {}) {
  const r = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 AND articles.category_id = ? ORDER BY articles.publication_date DESC LIMIT ? OFFSET ?`,
    args: [categoryId, limit, offset]
  });
  return r.rows;
}

async function getArticleBySlug(slug) {
  const r = await client.execute({ sql: `${baseSelect} WHERE articles.slug = ?`, args: [slug] });
  return r.rows[0];
}

async function getArticleById(id) {
  const r = await client.execute({ sql: `${baseSelect} WHERE articles.id = ?`, args: [id] });
  return r.rows[0];
}

async function getAllArticlesAdmin() {
  const r = await client.execute(`${baseSelect} ORDER BY articles.created_at DESC`);
  return r.rows;
}

async function getRelatedArticles(categoryId, excludeId, limit = 4) {
  const r = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 AND articles.category_id = ? AND articles.id != ? ORDER BY articles.publication_date DESC LIMIT ?`,
    args: [categoryId, excludeId, limit]
  });
  return r.rows;
}

async function getPrevNextArticles(publicationDate, currentId) {
  const prevR = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 AND articles.publication_date < ? AND articles.id != ? ORDER BY articles.publication_date DESC LIMIT 1`,
    args: [publicationDate, currentId]
  });
  const nextR = await client.execute({
    sql: `${baseSelect} WHERE articles.published = 1 AND articles.publication_date > ? AND articles.id != ? ORDER BY articles.publication_date ASC LIMIT 1`,
    args: [publicationDate, currentId]
  });
  return { prev: prevR.rows[0], next: nextR.rows[0] };
}

async function searchArticles(query, { limit = 30 } = {}) {
  const q = `%${query.toLowerCase()}%`;
  const r = await client.execute({
    sql: `
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
    `,
    args: [q, q, q, q, q, limit]
  });
  return r.rows;
}

async function incrementViews(id) {
  return client.execute({ sql: 'UPDATE articles SET views = views + 1 WHERE id = ?', args: [id] });
}

async function createArticle(data) {
  return client.execute({
    sql: `
      INSERT INTO articles (
        title, slug, book_title, author, cover_image, category_id, excerpt,
        introduction, content, lessons, takeaway, who_should_read, affiliate_url,
        seo_title, seo_description, tags, reading_time, featured, published, publication_date
      ) VALUES (
        :title, :slug, :book_title, :author, :cover_image, :category_id, :excerpt,
        :introduction, :content, :lessons, :takeaway, :who_should_read, :affiliate_url,
        :seo_title, :seo_description, :tags, :reading_time, :featured, :published, :publication_date
      )
    `,
    args: data
  });
}

async function updateArticle(id, data) {
  return client.execute({
    sql: `
      UPDATE articles SET
        title = :title,
        slug = :slug,
        book_title = :book_title,
        author = :author,
        cover_image = :cover_image,
        category_id = :category_id,
        excerpt = :excerpt,
        introduction = :introduction,
        content = :content,
        lessons = :lessons,
        takeaway = :takeaway,
        who_should_read = :who_should_read,
        affiliate_url = :affiliate_url,
        seo_title = :seo_title,
        seo_description = :seo_description,
        tags = :tags,
        reading_time = :reading_time,
        featured = :featured,
        published = :published,
        publication_date = :publication_date,
        updated_at = datetime('now')
      WHERE id = :id
    `,
    args: { ...data, id }
  });
}

async function deleteArticle(id) {
  return client.execute({ sql: 'DELETE FROM articles WHERE id = ?', args: [id] });
}

async function getStats() {
  const totalR = await client.execute('SELECT COUNT(*) AS c FROM articles');
  const publishedR = await client.execute('SELECT COUNT(*) AS c FROM articles WHERE published = 1');
  const draftsR = await client.execute('SELECT COUNT(*) AS c FROM articles WHERE published = 0');
  const viewsR = await client.execute('SELECT COALESCE(SUM(views), 0) AS v FROM articles');
  const popularR = await client.execute(`${baseSelect} ORDER BY articles.views DESC LIMIT 5`);

  return {
    total: Number(totalR.rows[0].c),
    published: Number(publishedR.rows[0].c),
    drafts: Number(draftsR.rows[0].c),
    totalViews: Number(viewsR.rows[0].v),
    popular: popularR.rows
  };
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
