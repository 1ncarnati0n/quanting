import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { ok: false, error: `missing file: ${relativePath}` };
  }
  return { ok: true, content: fs.readFileSync(absolutePath, "utf8") };
}

const contracts = [
  {
    id: "global-shortcut-guard",
    title: "전역 단축키 충돌 가드",
    file: "src/App.tsx",
    all: [
      "const isInDialog = isActiveDialogLayer(target);",
      "const isTyping = isEditableKeyboardTarget(target);",
      "if (isInDialog) return;",
      "if (isTyping) return;",
    ],
  },
  {
    id: "escape-close-path",
    title: "ESC 사이드바 종료 경로",
    file: "src/App.tsx",
    all: [
      "if (e.key === \"Escape\")",
      "setShowWatchlist(false);",
      "setShowSettings(false);",
      "window.dispatchEvent(new CustomEvent(\"quanting:close-sidebars\"));",
    ],
  },
  {
    id: "symbol-search-shortcuts",
    title: "종목 검색 단축키 진입",
    file: "src/App.tsx",
    all: [
      "if (isMod && keyLower === \"k\")",
      "if (isMod && keyLower === \"/\")",
      "window.dispatchEvent(new CustomEvent(\"quanting:open-symbol-search\"));",
    ],
  },
  {
    id: "command-center-shortcut",
    title: "명령 허브 단축키 진입",
    file: "src/App.tsx",
    all: [
      "if (isMod && keyLower === \"j\")",
      "window.dispatchEvent(new CustomEvent(\"quanting:open-command-center\"));",
    ],
  },
  {
    id: "watchlist-item-activation",
    title: "워치리스트 항목 키보드 선택",
    file: "src/components/WatchlistSidebar.tsx",
    all: [
      "role=\"button\"",
      "tabIndex={0}",
      "if (e.key === \"Enter\" || e.key === \" \")",
      "selectSymbolFromWatch(item);",
    ],
  },
  {
    id: "watchlist-directional-nav",
    title: "워치리스트 방향키 탐색",
    file: "src/components/WatchlistSidebar.tsx",
    all: [
      "const watchItemRefs = useRef<Array<HTMLDivElement | null>>([]);",
      "e.key === \"ArrowDown\"",
      "e.key === \"ArrowUp\"",
      "e.key === \"Home\"",
      "e.key === \"End\"",
      "aria-keyshortcuts=\"Enter Space ArrowUp ArrowDown Home End\"",
    ],
  },
  {
    id: "live-region-notice",
    title: "라이브 리전 상태 고지",
    file: "src/components/WatchlistSidebar.tsx",
    all: [
      "role=\"status\"",
      "aria-live=\"polite\"",
      "관심종목 스냅샷",
    ],
  },
];

const errors = [];

for (const contract of contracts) {
  const fileResult = readFile(contract.file);
  if (!fileResult.ok) {
    errors.push(`[${contract.id}] ${contract.title}: ${fileResult.error}`);
    continue;
  }
  const content = fileResult.content;
  for (const fragment of contract.all) {
    if (!content.includes(fragment)) {
      errors.push(
        `[${contract.id}] ${contract.title}: missing fragment "${fragment}" in ${contract.file}`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`a11y scenario audit failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`a11y scenario audit passed. Checked ${contracts.length} scenario contracts.`);
