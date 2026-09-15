// Wraps an async route handler so rejected promises are passed to
// Express's error handler instead of hanging the request.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
