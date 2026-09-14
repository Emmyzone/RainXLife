require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db/db');

const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || '';

if (!email || !password) {
  console.error('ERROR: Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env (or Render environment) before running this script.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ERROR: ADMIN_PASSWORD should be at least 8 characters.');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);

const existing = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);

if (existing) {
  db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(passwordHash, email);
  console.log(`Admin account updated for ${email}.`);
} else {
  db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(email, passwordHash);
  console.log(`Admin account created for ${email}.`);
}

console.log('You can now log in at /admin/login with this email and password.');
