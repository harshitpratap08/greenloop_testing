import { createBackend } from "./app.mjs";

const server = createBackend();
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

server.listen(port, host, () => {
  console.log(`GreenLoop backend: http://${host}:${port}`);
});
