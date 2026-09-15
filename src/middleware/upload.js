const multer = require('multer');
const path = require('path');

// Keep the uploaded file in memory only — it gets sent straight to Cloudinary
// and is never written to Render's local disk, so it isn't lost on restart.
const storage = multer.memoryStorage();

const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
