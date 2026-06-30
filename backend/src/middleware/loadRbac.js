import { User } from "../models/User.model.js";
import { resolveUserRbac } from "../services/rbac.service.js";

/**
 * After requireAuth: loads User + RBAC context onto the request.
 */
export async function loadRbac(req, _res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return next();

    const user = await User.findById(userId).lean();
    if (!user) return next();

    req.appUser = user;
    req.rbac = await resolveUserRbac(userId);
    req.rbac.userType = user.userType;
    return next();
  } catch (err) {
    return next(err);
  }
}
