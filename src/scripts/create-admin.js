require('dotenv').config();
const bcrypt = require('bcryptjs');
const { client, initDb } = require('../db/db');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = (process.env.ADMIN_PASSWORD || '').trim();

  if (!email || !password) {
    console.error('ERROR: Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env (or Render environment) before running this script.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ERROR: ADMIN_PASSWORD should be at least 8 characters.');
    process.exit(1);
  }

  await initDb();

  const passwordHash = bcrypt.hashSync(password, 10);

  const existingR = await client.execute({ sql: 'SELECT * FROM admins WHERE email = ?', args: [email] });
  const existing = existingR.rows[0];

  if (existing) {
    await client.execute({
      sql: 'UPDATE admins SET password_hash = ? WHERE email = ?',
      args: [passwordHash, email]
    });
    console.log(`Admin account updated for ${email}.`);
  } else {
    await client.execute({
      sql: 'INSERT INTO admins (email, password_hash) VALUES (?, ?)',
      args: [email, passwordHash]
    });
    console.log(`Admin account created for ${email}.`);
  }

  console.log('You can now log in at /admin/login with this email and password.');
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to create admin account:', err);
  process.exit(1);
});
