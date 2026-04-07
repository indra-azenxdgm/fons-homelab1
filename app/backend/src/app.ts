import cors from "cors";
import express from "express";
import helmet from "helmet";

import { backendEnv } from "@/config/env";
import { logger } from "@/lib/logger";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found";
import { requestLogger } from "@/middleware/request-logger";
import { registerRoutes } from "@/routes/index";

export function createApp() {
  const app = express();
  const allowedCorsOrigins = new Set(backendEnv.allowedCorsOrigins);

  if (backendEnv.trustProxy > 0) {
    app.set("trust proxy", backendEnv.trustProxy);
  }

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: {
      policy: "same-site",
    },
  }));
  app.use(requestLogger);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: backendEnv.requestBodyLimit }));

  registerRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.debug("app.initialized", {
    corsOrigin: backendEnv.corsOrigin,
    allowedCorsOrigins: backendEnv.allowedCorsOrigins,
    trustProxy: backendEnv.trustProxy,
    requestBodyLimit: backendEnv.requestBodyLimit,
  });

  return app;
}
