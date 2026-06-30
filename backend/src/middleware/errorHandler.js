export function errorHandler(err, _req, res, _next) {
  const status = Number(err.statusCode || err.status) || 500;
  const isProd = process.env.NODE_ENV === "production";

  const body = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(err.code && { code: err.code }),
    ...(!isProd && err.stack && { stack: err.stack }),
  };

  if (status >= 500) {
    console.error("[error]", err);
  }

  res.status(status).json(body);
}
