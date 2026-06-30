export function logInfo(message, meta = {}) {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[INFO] ${message}`, Object.keys(meta).length ? meta : "");
  }
}
