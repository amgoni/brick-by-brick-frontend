import { createRouter } from "./router";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerMeRoutes } from "./routes/me";
import { registerProjectRoutes } from "./routes/projects";
import { registerReportRoutes } from "./routes/reports";
import { registerSearchRoutes } from "./routes/search";
import { registerStockRoutes } from "./routes/stock";

/**
 * The stand-in backend, served by app/api/[...path]/route.ts.
 *
 * As each area moves to the real Express API, its register… call goes, and
 * the requests it handled get forwarded there instead. When the last one
 * goes, so does this folder.
 */
export const mockApi = createRouter();

registerMeRoutes(mockApi);
registerDashboardRoutes(mockApi);
registerProjectRoutes(mockApi);
registerReportRoutes(mockApi);
registerSearchRoutes(mockApi);
registerStockRoutes(mockApi);
