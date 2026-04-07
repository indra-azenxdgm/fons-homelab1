import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const DEFAULT_PRODUCTION_APP_ORIGIN = "https://www.fonsjogjaac.com";
const DEFAULT_DEVELOPMENT_APP_ORIGIN = "http://localhost:3004";
const DISALLOWED_PRODUCTION_SESSION_SECRETS = new Set([
  "change-me-for-real-environments",
  "change-me-with-a-long-random-secret",
  "replace-this-for-production",
  "replace-with-a-long-random-secret",
]);

function parseAllowedOrigins(value?: string) {
  return (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  PDF_PROVIDER: z.enum(["gotenberg"]).default("gotenberg"),
  GOTENBERG_URL: z.string().url().default("http://127.0.0.1:3000"),
  PDF_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  CORS_ORIGIN: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_SESSION_SECRET: z.string().min(16, "ADMIN_SESSION_SECRET must be at least 16 characters"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  RUN_DB_MIGRATIONS: z.enum(["true", "false"]).optional(),
  ALLOW_DEFAULT_DEV_ADMIN_SEED: z.enum(["true", "false"]).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid backend environment: ${parsedEnv.error.message}`);
}

if (
  parsedEnv.data.NODE_ENV === "production"
  && DISALLOWED_PRODUCTION_SESSION_SECRETS.has(parsedEnv.data.ADMIN_SESSION_SECRET.trim())
) {
  throw new Error("Invalid backend environment: ADMIN_SESSION_SECRET must be replaced before production startup.");
}

if (
  parsedEnv.data.NODE_ENV === "production"
  && parsedEnv.data.ADMIN_SESSION_SECRET.trim().length < 32
) {
  throw new Error("Invalid backend environment: ADMIN_SESSION_SECRET must be at least 32 characters in production.");
}

if (
  parsedEnv.data.NODE_ENV === "production"
  && parsedEnv.data.ALLOW_DEFAULT_DEV_ADMIN_SEED === "true"
) {
  throw new Error("Invalid backend environment: ALLOW_DEFAULT_DEV_ADMIN_SEED must be false in production.");
}

const fallbackCorsOrigin = parsedEnv.data.NODE_ENV === "production"
  ? DEFAULT_PRODUCTION_APP_ORIGIN
  : DEFAULT_DEVELOPMENT_APP_ORIGIN;
const allowedCorsOrigins = parseAllowedOrigins(parsedEnv.data.CORS_ALLOWED_ORIGINS);
const resolvedCorsOrigins = Array.from(new Set(
  (allowedCorsOrigins.length > 0
    ? allowedCorsOrigins
    : [parsedEnv.data.CORS_ORIGIN || fallbackCorsOrigin])
    .map((origin) => new URL(origin).origin),
));

export const backendEnv = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  pdfProvider: parsedEnv.data.PDF_PROVIDER,
  gotenbergUrl: parsedEnv.data.GOTENBERG_URL,
  pdfRequestTimeoutMs: parsedEnv.data.PDF_REQUEST_TIMEOUT_MS,
  corsOrigin: resolvedCorsOrigins[0],
  allowedCorsOrigins: resolvedCorsOrigins,
  adminSessionSecret: parsedEnv.data.ADMIN_SESSION_SECRET,
  logLevel: parsedEnv.data.LOG_LEVEL || (parsedEnv.data.NODE_ENV === "production" ? "info" : "debug"),
  trustProxy: parsedEnv.data.TRUST_PROXY,
  requestBodyLimit: parsedEnv.data.REQUEST_BODY_LIMIT,
  runDbMigrations: parsedEnv.data.RUN_DB_MIGRATIONS === "true",
  allowDefaultDevAdminSeed: parsedEnv.data.ALLOW_DEFAULT_DEV_ADMIN_SEED === "true",
} as const;
