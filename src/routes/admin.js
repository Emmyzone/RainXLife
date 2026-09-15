const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { client } = require('../db/db');
const q = require('../db/queries');
const slugify = require('../utils/slugify');
const estimateReadingTime = require('../utils/readingTime');
const upload = require('../middleware/upload');
const { requireAdmin, redirectIfLoggedIn } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeHtml = require('sanitize-html');

const SITE_NAME = process.env.SITE_NAME || 'RainXLife';

function sanitize(html) {
  return sanitizeHtml(html || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt']
    }
  });
}

// ---------- Login ----------
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('admin/login', { pageTitle: `Admin Login — ${SITE_NAME}`, error: null, layout: false });
});

router.post('/login', redirectIfLoggedIn, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const r = await client.execute({
    sql: 'SELECT * FROM admins WHERE email = ?',
    args: [(email || '').toLowerCase().trim()]
  });
  const admin = r.rows[0];

  if (!admin || !bcrypt.compareSync((password || '').trim(), admin.password_hash)) {
    return res.status(401).render('admin/login', {
      pageTitle: `Admin Login — ${SITE_NAME}`,
      error: 'Incorrect email or password.',
      layout: false
    });
  }

  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  res.redirect('/admin');
}));

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Everything below requires login
router.use(requireAdmin);

// ---------- Dashboard ----------
router.get('/', asyncHandler(async (req, res) => {
  const stats = await q.getStats();
  res.render('admin/dashboard', {
    pageTitle: `Dashboard — Admin — ${SITE_NAME}`,
    layout: false,
    stats,
    adminEmail: req.session.adminEmail
  });
}));

// ---------- Articles list ----------
router.get('/articles', asyncHandler(async (req, res) => {
  const articles = await q.getAllArticlesAdmin();
  res.render('admin/articles-list', {
    pageTitle: `Articles — Admin — ${SITE_NAME}`,
    layout: false,
    articles
  });
}));

// ---------- New article form ----------
router.get('/articles/new', asyncHandler(async (req, res) => {
  const categories = await q.getAllCategories();
  res.render('admin/article-form', {
    pageTitle: `New Article — Admin — ${SITE_NAME}`,
    layout: false,
    article: null,
    lessons: [],
    categories,
    error: null
  });
}));

// ---------- Create article ----------
router.post('/articles/new', upload.single('cover_image_file'), asyncHandler(async (req, res) => {
  try {
    const body = req.body;
    const slug = slugify(body.slug || body.title);

    const lessons = parseLessonsFromForm(body);
    const coverImage = req.file ? `/uploads/${req.file.filename}` : (body.cover_image_url || '');

    const readingTime = estimateReadingTime(
      body.introduction,
      body.content,
      lessons.map(l => `${l.title} ${l.explanation} ${l.example} ${l.application}`).join(' ')
    );

    await q.createArticle({
      title: body.title,
      slug,
      book_title: body.book_title,
      author: body.author,
      cover_image: coverImage,
      category_id: body.category_id || null,
      excerpt: body.excerpt || '',
      introduction: sanitize(body.introduction),
      content: sanitize(body.content),
      lessons: JSON.stringify(lessons),
      takeaway: sanitize(body.takeaway),
      who_should_read: body.who_should_read || '',
      affiliate_url: body.affiliate_url || '',
      seo_title: body.seo_title || '',
      seo_description: body.seo_description || '',
      tags: body.tags || '',
      reading_time: readingTime,
      featured: body.featured ? 1 : 0,
      published: body.status === 'published' ? 1 : 0,
      publication_date: body.publication_date || new Date().toISOString()
    });

    res.redirect('/admin/articles');
  } catch (err) {
    const categories = await q.getAllCategories();
    res.status(400).render('admin/article-form', {
      pageTitle: `New Article — Admin — ${SITE_NAME}`,
      layout: false,
      article: req.body,
      lessons: parseLessonsFromForm(req.body),
      categories,
      error: /unique/i.test(err.message) ? 'That URL slug is already in use — please choose another.' : err.message
    });
  }
}));

// ---------- Edit article form ----------
router.get('/articles/:id/edit', asyncHandler(async (req, res) => {
  const article = await q.getArticleById(req.params.id);
  if (!article) return res.status(404).send('Article not found');
  const categories = await q.getAllCategories();
  let lessons = [];
  try { lessons = JSON.parse(article.lessons || '[]'); } catch (e) { lessons = []; }

  res.render('admin/article-form', {
    pageTitle: `Edit Article — Admin — ${SITE_NAME}`,
    layout: false,
    article,
    lessons,
    categories,
    error: null
  });
}));

// ---------- Update article ----------
router.post('/articles/:id/edit', upload.single('cover_image_file'), asyncHandler(async (req, res) => {
  try {
    const body = req.body;
    const existing = await q.getArticleById(req.params.id);
    if (!existing) return res.status(404).send('Article not found');

    const slug = slugify(body.slug || body.title);
    const lessons = parseLessonsFromForm(body);
    const coverImage = req.file
      ? `/uploads/${req.file.filename}`
      : (body.cover_image_url || existing.cover_image);

    const readingTime = estimateReadingTime(
      body.introduction,
      body.content,
      lessons.map(l => `${l.title} ${l.explanation} ${l.example} ${l.application}`).join(' ')
    );

    await q.updateArticle(req.params.id, {
      title: body.title,
      slug,
      book_title: body.book_title,
      author: body.author,
      cover_image: coverImage,
      category_id: body.category_id || null,
      excerpt: body.excerpt || '',
      introduction: sanitize(body.introduction),
      content: sanitize(body.content),
      lessons: JSON.stringify(lessons),
      takeaway: sanitize(body.takeaway),
      who_should_read: body.who_should_read || '',
      affiliate_url: body.affiliate_url || '',
      seo_title: body.seo_title || '',
      seo_description: body.seo_description || '',
      tags: body.tags || '',
      reading_time: readingTime,
      featured: body.featured ? 1 : 0,
      published: body.status === 'published' ? 1 : 0,
      publication_date: body.publication_date || existing.publication_date || new Date().toISOString()
    });

    res.redirect('/admin/articles');
  } catch (err) {
    const categories = await q.getAllCategories();
    res.status(400).render('admin/article-form', {
      pageTitle: `Edit Article — Admin — ${SITE_NAME}`,
      layout: false,
      article: { ...req.body, id: req.params.id },
      lessons: parseLessonsFromForm(req.body),
      categories,
      error: /unique/i.test(err.message) ? 'That URL slug is already in use — please choose another.' : err.message
    });
  }
}));

// ---------- Delete article ----------
router.post('/articles/:id/delete', asyncHandler(async (req, res) => {
  await q.deleteArticle(req.params.id);
  res.redirect('/admin/articles');
}));

// ---------- Categories ----------
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await q.getAllCategories();
  res.render('admin/categories', {
    pageTitle: `Categories — Admin — ${SITE_NAME}`,
    layout: false,
    categories,
    error: null
  });
}));

router.post('/categories/new', asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    await q.createCategory(name, slugify(name), description || '');
  } catch (err) {
    // fall through, still redirect — could show error in a future version
  }
  res.redirect('/admin/categories');
}));

router.post('/categories/:id/edit', asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  await q.updateCategory(req.params.id, name, slugify(name), description || '');
  res.redirect('/admin/categories');
}));

router.post('/categories/:id/delete', asyncHandler(async (req, res) => {
  await q.deleteCategory(req.params.id);
  res.redirect('/admin/categories');
}));

// ---------- Helpers ----------
function parseLessonsFromForm(body) {
  // Lesson fields arrive as parallel arrays: lesson_title[], lesson_explanation[], etc.
  const titles = [].concat(body.lesson_title || []);
  const explanations = [].concat(body.lesson_explanation || []);
  const examples = [].concat(body.lesson_example || []);
  const applications = [].concat(body.lesson_application || []);

  const lessons = [];
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i] || !titles[i].trim()) continue;
    lessons.push({
      title: titles[i],
      explanation: explanations[i] || '',
      example: examples[i] || '',
      application: applications[i] || ''
    });
  }
  return lessons;
}

module.exports = router;
