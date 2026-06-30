import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, "../src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name.endsWith(".jsx")) files.push(p);
  }
  return files;
}

function erpBackImportPath(filePath) {
  const rel = path
    .relative(path.dirname(filePath), path.join(SRC, "components/common/ErpBackButton.jsx"))
    .replace(/\\/g, "/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

const BUTTON_RE =
  /<button\s+type="button"\s+className="erp-back-btn"([\s\S]*?)>\s*\{backHover[\s\S]*?\}\s*<\/button>/g;

function extractOnClick(inner) {
  const m = inner.match(/onClick=\{((?:[^{}]|\{[^{}]*\})+)\}/);
  return m ? m[1].trim() : null;
}

function extractAria(inner) {
  const m = inner.match(/aria-label="([^"]+)"/);
  return m ? m[1] : "Back";
}

let updated = 0;

for (const filePath of walk(SRC)) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("backHover")) continue;

  const before = content;

  content = content.replace(/import BackIcon from ["'][^"']*back\.svg\?react["'];\r?\n/g, "");
  content = content.replace(/import BackHoveredIcon from ["'][^"']*back-hovered\.svg\?react["'];\r?\n/g, "");
  content = content.replace(/\r?\n\s*const \[backHover, setBackHover\] = useState\(false\);/g, "");

  const impPath = erpBackImportPath(filePath).replace(/\.jsx$/, "");
  if (!content.includes("ErpBackButton")) {
    const impLine = `import ErpBackButton from "${impPath}.jsx";\n`;
    const m = content.match(/^import .+;$/m);
    if (m) {
      const idx = content.indexOf(m[0]) + m[0].length;
      content = content.slice(0, idx) + "\n" + impLine + content.slice(idx);
    } else {
      content = impLine + content;
    }
  }

  content = content.replace(BUTTON_RE, (_, inner) => {
    const onClick = extractOnClick(inner);
    const aria = extractAria(inner);
    if (!onClick) {
      console.warn(`  [skip button] no onClick in ${filePath}`);
      return _;
    }
    return `<ErpBackButton onClick={${onClick}} ariaLabel="${aria}" />`;
  });

  if (content.includes("backHover")) {
    console.warn(`  [still has backHover] ${filePath}`);
  } else if (content !== before) {
    fs.writeFileSync(filePath, content);
    updated++;
    console.log(`updated: ${path.relative(SRC, filePath)}`);
  }
}

console.log(`\nDone. ${updated} file(s) updated.`);
