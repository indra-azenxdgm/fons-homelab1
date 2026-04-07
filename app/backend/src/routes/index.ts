import type { Express } from "express";

import { createAuthRoutes } from "@/routes/auth.routes";
import { createBookingsRoutes } from "@/routes/bookings.routes";
import { createCalendarRoutes } from "@/routes/calendar.routes";
import { createCustomersRoutes } from "@/routes/customers.routes";
import { createFinanceRoutes } from "@/routes/finance.routes";
import { createHealthRoutes } from "@/routes/health.routes";
import { createNotificationsRoutes } from "@/routes/notifications.routes";
import { createSettingsRoutes } from "@/routes/settings.routes";
import { createSquadsRoutes } from "@/routes/squads.routes";
import { createUsersRoutes } from "@/routes/users.routes";

export function registerRoutes(app: Express) {
  app.use(createHealthRoutes());
  app.use("/api", createAuthRoutes());
  app.use("/api", createBookingsRoutes());
  app.use("/api", createCalendarRoutes());
  app.use("/api", createCustomersRoutes());
  app.use("/api", createFinanceRoutes());
  app.use("/api", createNotificationsRoutes());
  app.use("/api", createSettingsRoutes());
  app.use("/api", createSquadsRoutes());
  app.use("/api", createUsersRoutes());
}
