/**
 * Auth.js needs real HTTP endpoints for the sign-in POST, the callback, the
 * session lookup and sign-out. This one file mounts all of them under
 * /api/auth/* by re-exporting the handlers the config produced.
 */
export { GET, POST } from "@/lib/auth";
