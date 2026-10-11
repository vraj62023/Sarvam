function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  const hint =
    err.hint ||
    (status === 500 ? 'Something went wrong on our end. Please try again.' : undefined);
  res.status(status).json({
    error: err.message || 'Internal server error',
    hint,
  });
}

module.exports = errorHandler;
