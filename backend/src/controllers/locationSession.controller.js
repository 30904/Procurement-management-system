import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { assertLocationAccess } from "../utils/locationScope.js";

export const getMyLocations = asyncHandler(async (req, res) => {
  const scope = req.locationScope;
  if (!scope) throw new AppError("Location scope unavailable", 500, "SCOPE_ERROR");

  res.status(200).json({
    success: true,
    data: {
      mode: scope.mode,
      defaultLocationId: scope.defaultLocationId,
      activeLocationId: scope.activeLocationId,
      locations: scope.locations || [],
    },
  });
});

export const setActiveLocation = asyncHandler(async (req, res) => {
  const scope = req.locationScope;
  const locationId = req.body?.locationId;
  if (!locationId) throw new AppError("locationId is required", 400, "VALIDATION_ERROR");

  assertLocationAccess(scope, locationId);

  res.status(200).json({
    success: true,
    data: {
      activeLocationId: locationId,
      message: "Set X-Active-Location-Id header on subsequent API calls",
    },
  });
});
