require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const { initDb } = require('./src/db/db');

const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const SITE_NAME = process.env.SITE_NAME || 'RainXLife';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// ---------- Body parsing ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Static assets ----------
app.use(express.static(path.join(__dirname, 'src', 'public')));

// ---------- Sessions (kept in memory — fine for a single free-tier instance) ----------
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_only_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ---------- Globals available in every view ----------
app.use((req, res, next) => {
  res.locals.siteName = SITE_NAME;
  res.locals.siteUrl = SITE_URL;
  res.locals.tiktokUrl = process.env.TIKTOK_URL || '';
  res.locals.youtubeUrl = process.env.YOUTUBE_URL || '';
  res.locals.adsenseEnabled = process.env.ADSENSE_ENABLED === 'true';
  res.locals.adsenseClientId = process.env.ADSENSE_CLIENT_ID || '';
  res.locals.currentPath = req.path;
  next();
});

// ---------- Routes ----------
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: `Page Not Found — ${SITE_NAME}`, categories: [] });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    pageTitle: `Something Went Wrong — ${SITE_NAME}`,
    categories: [],
    message: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`${SITE_NAME} running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
