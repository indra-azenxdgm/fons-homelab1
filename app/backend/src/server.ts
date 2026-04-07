import { backendEnv } from "@/config/env";
import { createApp } from "@/app";
import { logger } from "@/lib/logger";

const app = createApp();

app.listen(backendEnv.port, () => {
  logger.info("server.started", {
    port: backendEnv.port,
    nodeEnv: backendEnv.nodeEnv,
    corsOrigin: backendEnv.corsOrigin,
    allowedCorsOrigins: backendEnv.allowedCorsOrigins,
    runDbMigrations: backendEnv.runDbMigrations,
  });
});
