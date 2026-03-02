import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "src");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function addIssue(issues, filePath, content, index, message) {
  issues.push({
    file: path.relative(root, filePath),
    line: lineNumber(content, index),
    message,
  });
}

function hasAccessibleNameFromAttributes(attrsOrBlock) {
  return /\baria-label\s*=/.test(attrsOrBlock)
    || /\baria-labelledby\s*=/.test(attrsOrBlock)
    || /\btitle\s*=/.test(attrsOrBlock);
}

function auditFile(filePath, issues) {
  const normalized = filePath.split(path.sep).join("/");
  if (normalized.includes("/src/components/ui/")) return;
  if (normalized.includes("/src/components/patterns/")) return;

  const content = fs.readFileSync(filePath, "utf8");

  // 1) Icon-only design-system Button must have label/title
  const dsButtonPattern = /<Button\b[\s\S]*?(?:\/>|<\/Button>)/g;
  let dsMatch = dsButtonPattern.exec(content);
  while (dsMatch) {
    const block = dsMatch[0];
    const isIcon = /size\s*=\s*["']icon["']/.test(block);
    if (isIcon && !hasAccessibleNameFromAttributes(block)) {
      addIssue(
        issues,
        filePath,
        content,
        dsMatch.index,
        "<Button size=\"icon\"> is missing aria-label/aria-labelledby/title.",
      );
    }
    dsMatch = dsButtonPattern.exec(content);
  }

  // 2) Native button should have either accessible name attr or meaningful text
  const nativeButtonPattern = /<button\b[\s\S]*?<\/button>/g;
  let nativeMatch = nativeButtonPattern.exec(content);
  while (nativeMatch) {
    const block = nativeMatch[0];
    const openTagMatch = /^<button\b([^>]*)>/s.exec(block);
    const attrs = openTagMatch?.[1] ?? "";
    const hasLabelAttr = hasAccessibleNameFromAttributes(attrs);
    if (!hasLabelAttr) {
      const inner = block
        .replace(/^<button\b[^>]*>/s, "")
        .replace(/<\/button>$/s, "");
      const textOnly = inner
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, "");
      const hasMeaningfulText =
        /[A-Za-z0-9가-힣]{2,}/.test(textOnly)
        || /"[^"]*[A-Za-z0-9가-힣][^"]*"/.test(textOnly)
        || /'[^']*[A-Za-z0-9가-힣][^']*'/.test(textOnly);
      if (!hasMeaningfulText) {
        addIssue(
          issues,
          filePath,
          content,
          nativeMatch.index,
          "<button> appears icon-only but has no aria-label/aria-labelledby/title.",
        );
      }
    }
    nativeMatch = nativeButtonPattern.exec(content);
  }

  // 3) role=\"button\" non-button elements need keyboard affordances
  const roleButtonPattern = /\brole\s*=\s*["']button["']/g;
  let roleMatch = roleButtonPattern.exec(content);
  while (roleMatch) {
    const scanStart = Math.max(0, roleMatch.index - 150);
    const scanEnd = Math.min(content.length, roleMatch.index + 550);
    const attrsWindow = content.slice(scanStart, scanEnd);
    if (!/\bonClick\s*=/.test(attrsWindow)) {
      addIssue(issues, filePath, content, roleMatch.index, "role=\"button\" element is missing onClick.");
    }
    if (!/\btabIndex\s*=/.test(attrsWindow)) {
      addIssue(issues, filePath, content, roleMatch.index, "role=\"button\" element is missing tabIndex.");
    }
    if (!/\bonKeyDown\s*=/.test(attrsWindow)) {
      addIssue(issues, filePath, content, roleMatch.index, "role=\"button\" element is missing onKeyDown.");
    }
    roleMatch = roleButtonPattern.exec(content);
  }

  // 4) CommandInput should expose an accessible name
  const commandInputPattern = /<CommandInput\b[\s\S]*?\/>/g;
  let commandMatch = commandInputPattern.exec(content);
  while (commandMatch) {
    const tag = commandMatch[0];
    const hasLabel = /\baria-label\s*=/.test(tag) || /\baria-labelledby\s*=/.test(tag);
    if (!hasLabel) {
      addIssue(issues, filePath, content, commandMatch.index, "<CommandInput> is missing aria-label/aria-labelledby.");
    }
    commandMatch = commandInputPattern.exec(content);
  }
}

if (!fs.existsSync(srcDir)) {
  console.error("a11y audit failed: src directory not found.");
  process.exit(1);
}

const tsxFiles = walk(srcDir).filter((filePath) => filePath.endsWith(".tsx"));
const issues = [];

for (const filePath of tsxFiles) {
  auditFile(filePath, issues);
}

if (issues.length > 0) {
  issues.sort((a, b) => {
    if (a.file === b.file) return a.line - b.line;
    return a.file.localeCompare(b.file);
  });
  console.error(`a11y audit failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue.file}:${issue.line} ${issue.message}`);
  }
  process.exit(1);
}

console.log(`a11y audit passed. Checked ${tsxFiles.length} TSX files.`);
