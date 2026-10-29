import { createRouter } from "./router";
import { registerClientRoutes } from "./routes/clients";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerInventoryRoutes } from "./routes/inventory";
import { registerInvoiceRoutes } from "./routes/invoices";
import { registerMeRoutes } from "./routes/me";
import { registerProjectRoutes } from "./routes/projects";
import { registerReportRoutes } from "./routes/reports";
import { registerSearchRoutes } from "./routes/search";
import { registerSupplierRoutes } from "./routes/suppliers";

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
registerInventoryRoutes(mockApi);
registerSupplierRoutes(mockApi);
registerInvoiceRoutes(mockApi);
registerClientRoutes(mockApi);
registerReportRoutes(mockApi);
registerSearchRoutes(mockApi);
