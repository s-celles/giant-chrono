// Production build (BLD-003, BLD-004): bundles the app with Bun, generates
// icons and the manifest, then builds the service worker with the precache
// list and a content-derived version injected — fully reproducible from the
// same sources. The dist/ folder is a plain static artifact.

import { createHash } from "node:crypto";
import { readdir, rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";
import { generateIcons } from "./generate-icons";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).replaceAll("\\", "/"))
    .sort();
}

async function main(): Promise<void> {
  await rm(DIST, { recursive: true, force: true });

  // 1. Bundle the app from the HTML entrypoint (JS + CSS, hashed names).
  const result = await Bun.build({
    entrypoints: [join(ROOT, "index.html")],
    outdir: DIST,
    minify: true,
    sourcemap: "none",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }

  // 2. Static PWA assets: icons (generated, PWA-001) and the manifest.
  await generateIcons(join(DIST, "icons"));
  await Bun.write(join(DIST, "manifest.webmanifest"), Bun.file(join(ROOT, "public/manifest.webmanifest")));

  // 3. Inject manifest and icon links (generated assets, outside the bundler)
  //    with relative paths so the artifact also works from a subdirectory.
  const indexPath = join(DIST, "index.html");
  const headLinks = [
    '<link rel="manifest" href="./manifest.webmanifest"/>',
    '<link rel="icon" href="./icons/icon-192.png"/>',
    '<link rel="apple-touch-icon" href="./icons/icon-192.png"/>',
  ].join("");
  const html = (await Bun.file(indexPath).text()).replace("</head>", `${headLinks}</head>`);
  await Bun.write(indexPath, html);

  // 4. Version = hash of every built file: same inputs, same version (BLD-004).
  const files = await listFiles(DIST);
  const hash = createHash("sha256");
  let totalBytes = 0;
  let totalGzipBytes = 0;
  for (const file of files) {
    const content = new Uint8Array(await Bun.file(join(DIST, file)).arrayBuffer());
    hash.update(file);
    hash.update(content);
    totalBytes += content.length;
    totalGzipBytes += gzipSync(content).length;
  }
  const version = hash.digest("hex").slice(0, 12);

  // 5. Service worker with the precache list injected ("" = app shell root).
  const swResult = await Bun.build({
    entrypoints: [join(ROOT, "src/sw.ts")],
    outdir: DIST,
    minify: true,
    sourcemap: "none",
    define: {
      __PRECACHE__: JSON.stringify(["", ...files]),
      __VERSION__: JSON.stringify(version),
    },
  });
  if (!swResult.success) {
    for (const log of swResult.logs) console.error(log);
    process.exit(1);
  }

  console.log(`Built ${files.length + 1} files (version ${version})`);
  console.log(`Client bundle: ${(totalBytes / 1024).toFixed(1)} kB raw, ${(totalGzipBytes / 1024).toFixed(1)} kB gzip`);
  // NFR-007: the delivered bundle must stay below 300 kB gzip.
  if (totalGzipBytes > 300 * 1024) {
    console.error("Bundle exceeds the 300 kB gzip budget (NFR-007)");
    process.exit(1);
  }
}

await main();
