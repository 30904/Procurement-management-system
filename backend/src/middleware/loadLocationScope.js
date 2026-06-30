import { resolveLocationScope } from "../services/locationScope.service.js";

/**
 * After loadRbac: resolves location access and active working location from header.
 */
export async function loadLocationScope(req, _res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return next();

    const activeHeader =
      req.headers["x-active-location-id"] || req.headers["x-location-id"] || null;

    req.locationScope = await resolveLocationScope(userId, {
      activeLocationHeader: activeHeader,
    });
    return next();
  } catch (err) {
    return next(err);
  }
}
