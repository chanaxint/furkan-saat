// The admin guard tests against a production build (next build + next start).
// A separate entry so the mode is set the same way on Windows, macOS and Linux.
process.env.ADMIN_HTTP_MODE = "prod";
await import("./admin-http.test.mjs");
