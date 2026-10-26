// A stand-in for the two Supabase calls the admin check makes, for local tests
// only (localhost, fake keys, no real project):
//   GET  /auth/v1/user          — what getClaims() falls back to for HS256 tokens:
//                                 only tokens this server issued are valid, so a
//                                 token with a forged signature is refused
//   POST /rest/v1/rpc/is_admin  — answered from the token's user, as the
//                                 database's public.is_admin() does with auth.uid()
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

export function startMockSupabase() {
  const users = new Map(); // token → { user, admin }
  const calls = []; // { path, token }

  const server = createServer((req, res) => {
    const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    const known = users.get(token);
    calls.push({ path: req.url.split("?")[0], token });
    const send = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    req.resume();
    req.on("end", () => {
      if (req.method === "GET" && req.url.startsWith("/auth/v1/user")) {
        return known ? send(200, known.user) : send(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
      }
      if (req.method === "POST" && req.url.startsWith("/rest/v1/rpc/is_admin")) {
        // Like PostgREST: without a user's token the call runs as anon, which may not execute is_admin.
        if (!known) return send(401, { code: "42501", message: "permission denied for function is_admin" });
        return send(200, known.admin);
      }
      send(404, { message: "not mocked" });
    });
  });

  /** A signed-in user: their access token and the session cookie value @supabase/ssr reads. */
  function addUser({ id, email, admin = false, userMetadata = {}, register = true }) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const claims = { sub: id, email, role: "authenticated", aud: "authenticated", exp, user_metadata: userMetadata };
    const token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(claims)}.${randomBytes(32).toString("base64url")}`;
    const user = { id, email, aud: "authenticated", role: "authenticated", user_metadata: userMetadata, app_metadata: {} };
    if (register) users.set(token, { user, admin });
    const session = { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "test-refresh", user };
    return { token, cookie: `base64-${b64url(session)}` };
  }

  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({ port: server.address().port, addUser, calls, close: () => new Promise((r) => server.close(r)) }),
    ),
  );
}
