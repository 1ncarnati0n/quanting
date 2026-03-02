import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/ENTERPRISE_UI_UX_ROADMAP.md",
  "docs/ENTERPRISE_UI_UX_EXECUTION_TRACKER.md",
  "docs/UX_AUDIT_BASELINE.md",
  "docs/UX_KPI_BASELINE_TABLE.md",
  "docs/UX_PR_CHECKLIST.md",
  "docs/UX_PRIORITY_BACKLOG.md",
  "docs/UX_EXPERIMENT_PLAN.md",
  "docs/UX_CLICKFLOW_MEASUREMENT.md",
  "docs/UX_GLOSSARY.md",
  "docs/SHORTCUTS_MATRIX.md",
  "docs/COMMAND_HUB_WORKSPACES.md",
  "docs/PERFORMANCE_UX_WEEK9_REPORT.md",
  "docs/PERFORMANCE_UX_WEEK10_REPORT.md",
  "docs/UX_KEYBOARD_ONLY_CHECKLIST.md",
  "docs/ACCESSIBILITY_AUTOMATION.md",
  "docs/ACCESSIBILITY_SCENARIO_AUDIT.md",
  "docs/ACCESSIBILITY_REPORT.md",
  "docs/UX_QA_GATE_OPERATION.md",
  "docs/NEXT_QUARTER_UX_ROADMAP_DRAFT.md",
];

const errors = [];

for (const relativeFile of requiredFiles) {
  const absoluteFile = path.join(root, relativeFile);
  if (!fs.existsSync(absoluteFile)) {
    errors.push(`Missing required file: ${relativeFile}`);
    continue;
  }

  const content = fs.readFileSync(absoluteFile, "utf8").trim();
  if (content.length < 40) {
    errors.push(`File is too short or empty: ${relativeFile}`);
  }
}

const trackerFile = path.join(root, "docs/ENTERPRISE_UI_UX_EXECUTION_TRACKER.md");
if (fs.existsSync(trackerFile)) {
  const tracker = fs.readFileSync(trackerFile, "utf8");
  const weekHeadings = tracker.match(/^## Week \d+/gm) ?? [];
  if (weekHeadings.length < 12) {
    errors.push("Execution tracker must contain 12 week sections.");
  }
}

const roadmapFile = path.join(root, "docs/ENTERPRISE_UI_UX_ROADMAP.md");
if (fs.existsSync(roadmapFile)) {
  const roadmap = fs.readFileSync(roadmapFile, "utf8");
  if (!roadmap.includes("2026-03-02") || !roadmap.includes("2026-05-24")) {
    errors.push("Roadmap must include the defined timeline (2026-03-02 ~ 2026-05-24).");
  }
}

if (errors.length > 0) {
  console.error("UX gate failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("UX gate passed.");
