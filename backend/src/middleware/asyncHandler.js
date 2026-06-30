/**
 * Wrap async route handlers — avoids try/catch in every controller (Phase 2+).
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
