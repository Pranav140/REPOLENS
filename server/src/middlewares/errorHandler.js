const errorHandler = (err, req, res, next) => {
  // Operator-precedence-safe status code resolution
  const statusCode = err.statusCode
    ? err.statusCode
    : res.statusCode !== 200
      ? res.statusCode
      : 500;

  console.error(`[Error] ${req.method} ${req.path} →`, err.message);

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
    statusCode,
  });
};

module.exports = errorHandler;
