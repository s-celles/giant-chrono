// Version, git commit and date of this build, injected by scripts/build.ts
// (ABT-001). The dev server injects nothing, hence the fallbacks.

declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
declare const __BUILD_DATE__: string;

export interface BuildInfo {
  version: string;
  commit: string;
  date: string;
}

export const BUILD: BuildInfo = {
  version: typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev",
  commit: typeof __GIT_COMMIT__ === "string" && __GIT_COMMIT__ ? __GIT_COMMIT__ : "unknown",
  date: typeof __BUILD_DATE__ === "string" ? __BUILD_DATE__ : "",
};

export const knownCommit = (b: BuildInfo = BUILD): boolean => /^[0-9a-f]{7,40}$/.test(b.commit);

export const shortCommit = (b: BuildInfo = BUILD): string =>
  knownCommit(b) ? b.commit.slice(0, 7) : b.commit;

/** "v0.1.0 (6cae6fc)", as Progressive Web Office and QRShare show it. */
export const versionLabel = (b: BuildInfo = BUILD): string => `v${b.version} (${shortCommit(b)})`;
