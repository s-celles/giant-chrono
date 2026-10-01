// Requirements under test: ABT-001
import { describe, expect, test } from "bun:test";
import { BUILD, knownCommit, shortCommit, versionLabel } from "../src/core/build-info";

describe("build info (ABT-001: version and commit)", () => {
  const release = { version: "0.2.0", commit: "6cae6fc0123456789abcdef0123456789abcdef0", date: "2026-10-01T19:33:46+00:00" };

  test("label shows the version and the short commit, as PWO and QRShare do", () => {
    expect(versionLabel(release)).toBe("v0.2.0 (6cae6fc)");
  });

  test("a missing commit is shown as is, never truncated", () => {
    const dev = { version: "dev", commit: "unknown", date: "" };
    expect(knownCommit(dev)).toBe(false);
    expect(shortCommit(dev)).toBe("unknown");
    expect(versionLabel(dev)).toBe("vdev (unknown)");
  });

  test("only hex hashes count as known commits", () => {
    expect(knownCommit(release)).toBe(true);
    expect(knownCommit({ ...release, commit: "<script>" })).toBe(false);
  });

  test("outside a build (tests, dev server) the fallbacks apply", () => {
    expect(BUILD).toEqual({ version: "dev", commit: "unknown", date: "" });
  });
});
