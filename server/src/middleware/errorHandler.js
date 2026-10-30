export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found - ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';

  // In production, avoid leaking unhandled internal/database details for 500 errors
  let clientMessage = err.message || 'Internal server error occurred.';
  if (isProd && statusCode === 500 && !err.isOperational) {
    clientMessage = 'An unexpected internal error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(!isProd && { stack: err.stack })
  });
};
