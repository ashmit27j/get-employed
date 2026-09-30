// Adds Lucide icons to src/icons.ts by kebab-case name, keeping the registry sorted.
//   node scripts/add-icons.cjs file-search lightbulb
// Then run Prettier. Handles both quoted ("file-text": FileText) and unquoted (bell: Bell) keys.
const fs = require("fs");
const lucide = require(require.resolve("lucide-react", { paths: [__dirname] }));

const pascal = (s) =>
  s
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
const file = `${__dirname}/../src/icons.ts`;
let src = fs.readFileSync(file, "utf8");
const body = src.slice(src.indexOf("export const icons = {"), src.indexOf("} satisfies"));
const entries = [
  ...new Map([...body.matchAll(/^\s+"?([a-z0-9-]+)"?:\s*(\w+),\s*$/gm)].map((m) => [m[1], m[2]])),
];
if (entries.length === 0)
  throw new Error("Could not read the existing registry; refusing to overwrite it.");
const have = new Set(entries.map((e) => e[0]));
for (const name of process.argv.slice(2)) {
  if (have.has(name)) continue;
  let comp = pascal(name);
  if (!lucide[comp]) comp += "Icon";
  if (!lucide[comp]) throw new Error(`No Lucide icon named "${name}"`);
  entries.push([name, comp]);
  have.add(name);
}
entries.sort((a, b) => a[0].localeCompare(b[0]));
const imports = [...new Set(entries.map((e) => e[1]))].sort();
const header = src.slice(0, src.indexOf("import {"));
src =
  header +
  `import {\n${imports.map((i) => `  ${i},`).join("\n")}\n  type LucideIcon,\n} from "lucide-react";\n\n` +
  `export const icons = {\n${entries.map(([n, c]) => `  "${n}": ${c},`).join("\n")}\n} satisfies Record<string, LucideIcon>;\n\n` +
  "export type IconName = keyof typeof icons;\n";
fs.writeFileSync(file, src);
console.log(`${entries.length} icons`);
