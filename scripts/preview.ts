// Static preview server for the production artifact in dist/.

import { join, normalize } from "node:path";

const DIST = join(import.meta.dir, "..", "dist");
const PORT = Number(process.env.PORT ?? 4173);

const EXTRA_TYPES: Record<string, string> = {
  ".webmanifest": "application/manifest+json",
};

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    // Prevent path traversal outside dist/.
    const filePath = normalize(join(DIST, pathname));
    if (!filePath.startsWith(DIST)) return new Response("Forbidden", { status: 403 });

    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = filePath.slice(filePath.lastIndexOf("."));
      const type = EXTRA_TYPES[ext];
      return new Response(file, type ? { headers: { "Content-Type": type } } : undefined);
    }
    return new Response(Bun.file(join(DIST, "index.html")));
  },
});

console.log(`Preview: http://localhost:${server.port}`);
