export interface ShortcutHelpItem {
  id: string;
  keys: string[];
  desc: string;
}

export interface ShortcutHelpGroup {
  title: string;
  items: ShortcutHelpItem[];
}

export const SHORTCUT_HELP_GROUPS: ShortcutHelpGroup[] = [
  {
    title: "차트 조작",
    items: [
      { id: "chart.zoom_in", keys: ["+", "="], desc: "줌 인" },
      { id: "chart.zoom_out", keys: ["-"], desc: "줌 아웃" },
      { id: "chart.fit", keys: ["Home"], desc: "차트 맞춤" },
      { id: "chart.scroll_left", keys: ["←"], desc: "차트 왼쪽 스크롤" },
      { id: "chart.scroll_right", keys: ["→"], desc: "차트 오른쪽 스크롤" },
      { id: "chart.replay_toggle", keys: ["R"], desc: "바 리플레이 시작/종료" },
      { id: "chart.replay_play_pause", keys: ["Space"], desc: "리플레이 재생/일시정지" },
      { id: "chart.delete_drawing", keys: ["Delete"], desc: "최근 드로잉 삭제" },
    ],
  },
  {
    title: "화면",
    items: [
      { id: "view.toggle_fullscreen", keys: ["F"], desc: "전체화면 전환" },
      { id: "view.open_backtest_tab", keys: ["Ctrl/⌘", "Shift", "S"], desc: "설정 패널 백테스트 탭 열기" },
      { id: "view.escape", keys: ["Esc"], desc: "전체화면/패널 닫기" },
    ],
  },
  {
    title: "패널",
    items: [
      { id: "panel.toggle_watchlist", keys: ["Ctrl/⌘", "B"], desc: "관심종목 패널 (좁은 화면)" },
      { id: "panel.toggle_settings", keys: ["Ctrl/⌘", ","], desc: "설정 패널 (좁은 화면)" },
      { id: "panel.open_command_hub", keys: ["Ctrl/⌘", "J"], desc: "명령 허브" },
      { id: "panel.open_symbol_search", keys: ["Ctrl/⌘", "K"], desc: "심볼 검색" },
      { id: "panel.open_symbol_search_alt", keys: ["Ctrl/⌘", "/"], desc: "심볼 검색 (보조)" },
    ],
  },
  {
    title: "도움말",
    items: [
      { id: "help.show_shortcuts", keys: ["?"], desc: "단축키 도움말" },
    ],
  },
];

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function isActiveDialogLayer(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  if (element?.closest('[role="dialog"]')) return true;
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('[role="dialog"]:not([data-state="closed"])'));
}
