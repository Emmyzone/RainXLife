function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.redirect('/admin/login');
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin');
  }
  return next();
}

module.exports = { requireAdmin, redirectIfLoggedIn };
