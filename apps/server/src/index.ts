import { Hono } from "hono";

const app = new Hono();

Bun.serve({
  fetch: app.fetch,
  port: Bun.env.SERVER_PORT || 23002,
});
