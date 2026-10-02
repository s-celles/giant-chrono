// Requirements under test: ABT-003 (author shown in the About window)
import { describe, expect, test } from "bun:test";
import { MESSAGES } from "../src/core/i18n";

const html = await Bun.file(new URL("../index.html", import.meta.url)).text();

describe("About window author (ABT-003)", () => {
  test("names the author with a link to the GitHub profile", () => {
    const link = html.match(/<a id="about-author"[^>]*>([^<]*)<\/a>/);
    expect(link).not.toBeNull();
    expect(link![0]).toContain('href="https://github.com/s-celles"');
    expect(link![1]).toBe("Sébastien Celles");
  });

  test("the author label is translated in every language", () => {
    expect(html).toContain('data-i18n="about.author"');
    expect(MESSAGES.en["about.author"]).toBe("Author");
    expect(MESSAGES.fr["about.author"]).toBe("Auteur");
  });
});
