#!/usr/bin/env node
/**
 * SVG → PNG / ICO / ICNS 변환 스크립트
 * 의존성: ImageMagick 7+ (magick), iconutil (macOS 내장)
 */
import { execSync } from "node:child_process";
import { mkdirSync, existsSync, cpSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SVG = join(ROOT, "src/assets/quanting-icon.svg");
const ICONS_DIR = join(ROOT, "src-tauri/icons");
const TMP = join(ROOT, ".icon-tmp");

// 필요한 PNG 사이즈 목록
const SIZES = [16, 32, 48, 64, 128, 256, 512];

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  console.log("\n=== Quanting Icon Generator ===\n");

  // 1. 사전 검증
  if (!existsSync(SVG)) {
    console.error(`ERROR: SVG not found at ${SVG}`);
    process.exit(1);
  }
  try {
    execSync("magick --version", { stdio: "pipe" });
  } catch {
    console.error("ERROR: ImageMagick (magick) not found. Please install it.");
    process.exit(1);
  }

  // 2. 임시 디렉토리
  if (existsSync(TMP)) rmSync(TMP, { recursive: true });
  mkdirSync(TMP, { recursive: true });

  // 3. SVG → PNG 변환
  console.log("[1/4] Generating PNGs...");
  for (const s of SIZES) {
    run(`magick -background none -density 300 "${SVG}" -resize ${s}x${s} -define png:color-type=6 "${join(TMP, `${s}.png`)}"`);
  }

  // 4. Tauri 아이콘 복사
  console.log("\n[2/4] Copying to src-tauri/icons/...");
  mkdirSync(ICONS_DIR, { recursive: true });
  cpSync(join(TMP, "32.png"), join(ICONS_DIR, "32x32.png"));
  cpSync(join(TMP, "128.png"), join(ICONS_DIR, "128x128.png"));
  cpSync(join(TMP, "256.png"), join(ICONS_DIR, "128x128@2x.png"));

  // 5. ICO 생성 (Windows)
  console.log("\n[3/4] Generating icon.ico...");
  const icoSources = [16, 32, 48, 256].map((s) => `"${join(TMP, `${s}.png`)}"`).join(" ");
  run(`magick ${icoSources} "${join(ICONS_DIR, "icon.ico")}"`);

  // 6. ICNS 생성 (macOS)
  console.log("\n[4/4] Generating icon.icns...");
  const iconsetDir = join(TMP, "icon.iconset");
  mkdirSync(iconsetDir, { recursive: true });

  const iconsetMap = [
    [16, "icon_16x16.png"],
    [32, "icon_16x16@2x.png"],
    [32, "icon_32x32.png"],
    [64, "icon_32x32@2x.png"],
    [128, "icon_128x128.png"],
    [256, "icon_128x128@2x.png"],
    [256, "icon_256x256.png"],
    [512, "icon_256x256@2x.png"],
    [512, "icon_512x512.png"],
  ];

  for (const [size, name] of iconsetMap) {
    cpSync(join(TMP, `${size}.png`), join(iconsetDir, name));
  }

  run(`iconutil -c icns "${iconsetDir}" -o "${join(ICONS_DIR, "icon.icns")}"`);

  // 7. 정리
  rmSync(TMP, { recursive: true });

  console.log("\n=== Done! Generated icons: ===");
  console.log(`  ${ICONS_DIR}/32x32.png`);
  console.log(`  ${ICONS_DIR}/128x128.png`);
  console.log(`  ${ICONS_DIR}/128x128@2x.png`);
  console.log(`  ${ICONS_DIR}/icon.ico`);
  console.log(`  ${ICONS_DIR}/icon.icns`);
  console.log("");
}

main();
