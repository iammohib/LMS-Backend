export const errorMiddleware = (err, req, res, next) => {
  (err.statusCode = err.statusCode || 500),
    (err.stack = err.stack || "Something went wrong!");

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
};
