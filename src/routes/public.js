const express = require('express');
const router = express.Router();
const q = require('../db/queries');
const asyncHandler = require('../utils/asyncHandler');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.SITE_NAME || 'RainXLife';

function safeParseLessons(json) {
  try {
    const parsed = JSON.parse(json || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// ---------- Homepage ----------
router.get('/', asyncHandler(async (req, res) => {
  const featured = await q.getFeaturedArticle();
  const latest = await q.getPublishedArticles({ limit: 9 });
  const popular = await q.getPopularArticles(6);
  const categories = await q.getAllCategories();

  res.render('index', {
    pageTitle: `${SITE_NAME} — Ideas from books. Lessons for life.`,
    metaDescription: 'Discover practical lessons, powerful ideas and memorable stories from books that can change the way you think and live.',
    canonicalUrl: SITE_URL,
    featured,
    latest: latest.filter(a => !featured || a.id !== featured.id),
    popular,
    categories
  });
}));

// ---------- Category listing ----------
router.get('/category/:slug', asyncHandler(async (req, res) => {
  const category = await q.getCategoryBySlug(req.params.slug);
  if (!category) return res.status(404).render('404', { pageTitle: 'Category not found' });

  const articles = await q.getArticlesByCategory(category.id);
  const categories = await q.getAllCategories();

  res.render('category', {
    pageTitle: `${category.name} — ${SITE_NAME}`,
    metaDescription: category.description || `Book summaries and ideas on ${category.name}.`,
    canonicalUrl: `${SITE_URL}/category/${category.slug}`,
    category,
    articles,
    categories
  });
}));

// ---------- Search ----------
router.get('/search', asyncHandler(async (req, res) => {
  const query = (req.query.q || '').trim();
  const results = query ? await q.searchArticles(query) : [];
  const categories = await q.getAllCategories();

  res.render('search', {
    pageTitle: `Search — ${SITE_NAME}`,
    metaDescription: `Search book summaries on ${SITE_NAME}.`,
    canonicalUrl: `${SITE_URL}/search`,
    query,
    results,
    categories
  });
}));

// ---------- Static pages ----------
const staticPage = (view, title) => asyncHandler(async (req, res) => {
  const categories = await q.getAllCategories();
  res.render(view, {
    pageTitle: `${title} — ${SITE_NAME}`,
    metaDescription: `${title} for ${SITE_NAME}.`,
    canonicalUrl: `${SITE_URL}/${view}`,
    categories
  });
});

router.get('/about', staticPage('about', 'About'));
router.get('/contact', staticPage('contact', 'Contact'));
router.get('/privacy-policy', staticPage('privacy-policy', 'Privacy Policy'));
router.get('/terms', staticPage('terms', 'Terms of Use'));
router.get('/disclaimer', staticPage('disclaimer', 'Disclaimer'));
router.get('/affiliate-disclosure', staticPage('affiliate-disclosure', 'Affiliate Disclosure'));

// ---------- Article page (must be last so it doesn't swallow other routes) ----------
router.get('/books/:slug', asyncHandler(async (req, res) => {
  const article = await q.getArticleBySlug(req.params.slug);
  if (!article || !article.published) {
    return res.status(404).render('404', { pageTitle: 'Article not found' });
  }

  await q.incrementViews(article.id);
  article.views += 1;

  const lessons = safeParseLessons(article.lessons);
  const related = await q.getRelatedArticles(article.category_id, article.id, 4);
  const { prev, next } = await q.getPrevNextArticles(article.publication_date, article.id);
  const categories = await q.getAllCategories();

  res.render('article', {
    pageTitle: article.seo_title || `${article.title} — ${SITE_NAME}`,
    metaDescription: article.seo_description || article.excerpt,
    canonicalUrl: `${SITE_URL}/books/${article.slug}`,
    article,
    lessons,
    related,
    prev,
    next,
    categories
  });
}));

// ---------- sitemap.xml ----------
router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const articles = await q.getPublishedArticles({ limit: 1000 });
  const categories = await q.getAllCategories();

  const staticUrls = ['', 'about', 'contact', 'privacy-policy', 'terms', 'disclaimer', 'affiliate-disclosure'];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  staticUrls.forEach(u => {
    xml += `  <url><loc>${SITE_URL}/${u}</loc></url>\n`;
  });
  categories.forEach(c => {
    xml += `  <url><loc>${SITE_URL}/category/${c.slug}</loc></url>\n`;
  });
  articles.forEach(a => {
    xml += `  <url><loc>${SITE_URL}/books/${a.slug}</loc><lastmod>${(a.updated_at || '').slice(0, 10)}</lastmod></url>\n`;
  });
  xml += '</urlset>';

  res.type('application/xml').send(xml);
}));

// ---------- robots.txt ----------
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

module.exports = router;
