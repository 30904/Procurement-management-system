import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { registerFrontendStatic } from "./config/frontendStatic.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

if (String(process.env.TRUST_PROXY || "").trim() === "1" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const corsOrigin =
  process.env.CORS_ORIGIN === "*"
    ? true
    : process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ||
      (process.env.PUBLIC_APP_URL ? [process.env.PUBLIC_APP_URL] : true);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api", routes);

const frontendDist = registerFrontendStatic(app);
if (frontendDist && process.env.NODE_ENV !== "test") {
  console.log(`[app] Serving frontend from ${frontendDist}`);
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
