// Guards the design-system rules that are easy to break by accident (docs/design-system.md).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = dirname(fileURLToPath(import.meta.url));
const componentFiles = readdirSync(join(src, "components"))
  .filter((f) => f.endsWith(".tsx"))
  .map((f) => ({ name: f, text: readFileSync(join(src, "components", f), "utf8") }));
const theme = readFileSync(join(src, "theme.css"), "utf8");

describe("design rules", () => {
  it("components use tokens, not raw colours", () => {
    const raw = /#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|hsla?\(/i;
    for (const f of componentFiles) {
      const hits = f.text.split("\n").filter((l) => raw.test(l) && !l.includes("var(--"));
      expect(hits, f.name).toEqual([]);
    }
  });

  it("components use the type scale, not pixel font sizes", () => {
    for (const f of componentFiles) {
      expect(f.text.match(/text-\[\d+px\]/g) ?? [], f.name).toEqual([]);
    }
  });

  it("the theme resets every Tailwind default the design system replaces", () => {
    for (const ns of ["color", "font", "text", "radius", "shadow", "ease", "breakpoint"]) {
      expect(theme).toContain(`--${ns}-*: initial;`);
    }
  });

  it("the theme defines no drop shadows (depth is edge, focus ring or glow)", () => {
    // Names only: the light theme redefines the same shadows with light values.
    const shadows = [...new Set([...theme.matchAll(/^\s*--shadow-([a-z-]+):/gm)].map((m) => m[1]))];
    expect(shadows.sort()).toEqual(
      [
        "edge",
        "focus",
        "glow-active",
        "glow-cta",
        "glow-cta-hover",
        "glow-dot",
        "glow-underline",
        "hairline",
      ].sort(),
    );
  });
});
