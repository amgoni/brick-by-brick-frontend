import { mockApi } from "@/mocks/api";

/**
 * Every request under /api lands here and is answered by the mock backend in
 * mocks/. The browser makes real HTTP requests (they show in the Network tab),
 * so this is the seam: when the Express API exists, this file forwards to it
 * instead, and nothing in the app has to know.
 *
 * Runs at request time: reading the request stops Next from prerendering it.
 */
async function handle(request: Request) {
  return mockApi.handle(request);
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
