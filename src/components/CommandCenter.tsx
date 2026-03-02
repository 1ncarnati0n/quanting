import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useSettingsStore, type ChartType, type CompareSettings, type IndicatorConfig, type MultiChartLayout, type PriceScaleSettings, type SettingsTab } from "../stores/useSettingsStore";
import { useDrawingStore, type DrawingItem } from "../stores/useDrawingStore";
import { useReplayStore } from "../stores/useReplayStore";
import { useChartStore } from "../stores/useChartStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import type { MarketType } from "../types";
import type { Interval, Theme } from "../utils/constants";
import { trackUxAction } from "../utils/uxMetrics";

interface CommandCenterProps {
  showWatchlist: boolean;
  setShowWatchlist: (open: boolean) => void;
  showSettings: boolean;
  setShowSettings: (open: boolean) => void;
}

interface WorkspaceSnapshot {
  id: string;
  name: string;
  createdAt: number;
  symbol: string;
  market: MarketType;
  interval: Interval;
  theme: Theme;
  chartType: ChartType;
  multiChartLayout: MultiChartLayout;
  settingsTab: SettingsTab;
  indicators: IndicatorConfig;
  priceScale: PriceScaleSettings;
  compare: CompareSettings;
  drawings: DrawingItem[];
}

interface CommandAction {
  id: string;
  title: string;
  desc: string;
  group: "빠른 액션" | "워크스페이스";
  keywords: string;
  shortcut?: string;
  run: () => void;
}

const WORKSPACE_STORAGE_KEY = "quanting-workspaces";
const MAX_WORKSPACES = 8;

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadWorkspaces(): WorkspaceSnapshot[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
      .map((item) => ({
        ...item,
        indicators: cloneValue(item.indicators),
        drawings: cloneValue(item.drawings ?? []),
      })) as WorkspaceSnapshot[];
  } catch {
    return [];
  }
}

function saveWorkspaces(workspaces: WorkspaceSnapshot[]) {
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspaces));
  } catch {}
}

function createWorkspaceSnapshot(name: string): WorkspaceSnapshot {
  const settings = useSettingsStore.getState();
  const drawings = useDrawingStore.getState().drawings;
  const now = Date.now();
  return {
    id: `ws-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    createdAt: now,
    symbol: settings.symbol,
    market: settings.market,
    interval: settings.interval,
    theme: settings.theme,
    chartType: settings.chartType,
    multiChartLayout: settings.multiChartLayout,
    settingsTab: settings.settingsTab,
    indicators: cloneValue(settings.indicators),
    priceScale: { ...settings.priceScale },
    compare: { ...settings.compare },
    drawings: cloneValue(drawings),
  };
}

function applyWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  const settings = useSettingsStore.getState();
  useSettingsStore.setState({
    theme: snapshot.theme,
    indicators: cloneValue(snapshot.indicators),
  });
  try {
    localStorage.setItem("bb-rsi-theme", snapshot.theme);
    localStorage.setItem("bb-rsi-indicators", JSON.stringify(snapshot.indicators));
  } catch {}

  settings.setMarket(snapshot.market);
  settings.setSymbol(snapshot.symbol, snapshot.market);
  settings.setInterval(snapshot.interval);
  settings.setChartType(snapshot.chartType);
  settings.setMultiChartLayout(snapshot.multiChartLayout);
  settings.setSettingsTab(snapshot.settingsTab);
  settings.setPriceScale(snapshot.priceScale);
  settings.setCompare(snapshot.compare);
  useDrawingStore.getState().setDrawings(cloneValue(snapshot.drawings));
  useReplayStore.getState().exitReplay();
  window.dispatchEvent(new CustomEvent("quanting:chart-fit"));
}

export default function CommandCenter({
  showWatchlist,
  setShowWatchlist,
  showSettings,
  setShowSettings,
}: CommandCenterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceSnapshot[]>(() => loadWorkspaces());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("quanting:open-command-center", onOpen);
    return () => window.removeEventListener("quanting:open-command-center", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    trackUxAction("command_hub", "open");
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const closeAllPanels = () => {
    setShowSettings(false);
    setShowWatchlist(false);
    window.dispatchEvent(new CustomEvent("quanting:close-sidebars"));
  };

  const createActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [
      {
        id: "action.open-symbol-search",
        title: "심볼 검색 열기",
        desc: "종목 검색 모달을 연다",
        group: "빠른 액션",
        keywords: "심볼 검색 symbol search",
        shortcut: "Ctrl/⌘ K",
        run: () => {
          closeAllPanels();
          trackUxAction("command_hub", "open_symbol_search");
          window.dispatchEvent(new CustomEvent("quanting:open-symbol-search"));
          setOpen(false);
        },
      },
      {
        id: "action.toggle-settings",
        title: showSettings ? "설정 패널 닫기" : "설정 패널 열기",
        desc: "설정 패널 표시 상태를 전환한다",
        group: "빠른 액션",
        keywords: "설정 settings panel",
        shortcut: "Ctrl/⌘ ,",
        run: () => {
          trackUxAction("command_hub", "toggle_settings");
          setShowSettings(!showSettings);
          setShowWatchlist(false);
          setOpen(false);
        },
      },
      {
        id: "action.toggle-watchlist",
        title: showWatchlist ? "관심종목 패널 닫기" : "관심종목 패널 열기",
        desc: "관심종목 패널 표시 상태를 전환한다",
        group: "빠른 액션",
        keywords: "관심종목 watchlist panel",
        shortcut: "Ctrl/⌘ B",
        run: () => {
          trackUxAction("command_hub", "toggle_watchlist");
          setShowWatchlist(!showWatchlist);
          setShowSettings(false);
          setOpen(false);
        },
      },
      {
        id: "action.chart-fit",
        title: "차트 맞춤 실행",
        desc: "현재 차트를 전체 데이터 기준으로 맞춘다",
        group: "빠른 액션",
        keywords: "차트 맞춤 fit home",
        shortcut: "Home",
        run: () => {
          trackUxAction("command_hub", "chart_fit");
          window.dispatchEvent(new CustomEvent("quanting:chart-fit"));
          setOpen(false);
        },
      },
      {
        id: "action.toggle-replay",
        title: "바 리플레이 시작/종료",
        desc: "리플레이 모드를 토글한다",
        group: "빠른 액션",
        keywords: "리플레이 replay",
        shortcut: "R",
        run: () => {
          trackUxAction("command_hub", "toggle_replay");
          const replay = useReplayStore.getState();
          const totalBars = useChartStore.getState().data?.candles.length ?? 0;
          if (replay.enabled) replay.exitReplay();
          else replay.enterReplay(totalBars);
          setOpen(false);
        },
      },
      {
        id: "action.toggle-theme",
        title: "테마 전환",
        desc: "다크/라이트 테마를 전환한다",
        group: "빠른 액션",
        keywords: "테마 theme dark light",
        run: () => {
          trackUxAction("command_hub", "toggle_theme");
          useSettingsStore.getState().toggleTheme();
          setOpen(false);
        },
      },
      {
        id: "action.show-shortcuts",
        title: "단축키 도움말 열기",
        desc: "키보드 단축키 모달을 연다",
        group: "빠른 액션",
        keywords: "단축키 shortcuts help",
        shortcut: "?",
        run: () => {
          trackUxAction("command_hub", "show_shortcuts");
          window.dispatchEvent(new CustomEvent("quanting:show-shortcuts"));
          setOpen(false);
        },
      },
      {
        id: "action.workspace-save",
        title: "현재 상태 워크스페이스 저장",
        desc: "현재 화면 상태를 저장한다",
        group: "워크스페이스",
        keywords: "workspace save 저장",
        run: () => {
          const base = useSettingsStore.getState();
          const defaultName = `${base.symbol} ${base.interval} · ${new Date().toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}`;
          const name = window.prompt("워크스페이스 이름을 입력하세요", defaultName)?.trim();
          if (!name) return;
          trackUxAction("command_hub", "workspace_save");
          setWorkspaces((prev) => {
            const next = [createWorkspaceSnapshot(name), ...prev].slice(0, MAX_WORKSPACES);
            saveWorkspaces(next);
            return next;
          });
          setOpen(false);
        },
      },
      {
        id: "action.workspace-reset-safe",
        title: "안전 초기화 실행",
        desc: "리플레이 종료, 비교 해제, 드로잉 삭제, 차트 맞춤을 실행한다",
        group: "워크스페이스",
        keywords: "workspace reset 안전 초기화",
        run: () => {
          const confirmed = window.confirm(
            "안전 초기화를 실행할까요?\n- 리플레이 종료\n- 비교 차트 비활성화\n- 드로잉 전체 삭제\n- 차트 맞춤",
          );
          if (!confirmed) return;
          trackUxAction("command_hub", "workspace_safe_reset");
          useReplayStore.getState().exitReplay();
          useSettingsStore.getState().setCompare({ enabled: false });
          useSettingsStore.getState().setPriceScale({ autoScale: true, mode: "normal" });
          useDrawingStore.getState().clearDrawings();
          window.dispatchEvent(new CustomEvent("quanting:chart-fit"));
          setOpen(false);
        },
      },
    ];
    return actions;
  }, [showSettings, showWatchlist]);

  const workspaceActions = useMemo<CommandAction[]>(
    () =>
      workspaces.flatMap((workspace) => [
        {
          id: `workspace.restore.${workspace.id}`,
          title: `복원: ${workspace.name}`,
          desc: `${workspace.symbol} · ${workspace.interval} · ${new Date(workspace.createdAt).toLocaleString("ko-KR")}`,
          group: "워크스페이스" as const,
          keywords: `workspace 복원 restore ${workspace.name} ${workspace.symbol} ${workspace.interval}`,
          run: () => {
            trackUxAction("command_hub", "workspace_restore");
            applyWorkspaceSnapshot(workspace);
            closeAllPanels();
            setOpen(false);
          },
        },
        {
          id: `workspace.delete.${workspace.id}`,
          title: `삭제: ${workspace.name}`,
          desc: "저장된 워크스페이스를 삭제한다",
          group: "워크스페이스" as const,
          keywords: `workspace 삭제 delete ${workspace.name}`,
          run: () => {
            const ok = window.confirm(`"${workspace.name}" 워크스페이스를 삭제할까요?`);
            if (!ok) return;
            trackUxAction("command_hub", "workspace_delete");
            setWorkspaces((prev) => {
              const next = prev.filter((item) => item.id !== workspace.id);
              saveWorkspaces(next);
              return next;
            });
          },
        },
      ]),
    [workspaces],
  );

  const allActions = useMemo(() => [...createActions, ...workspaceActions], [createActions, workspaceActions]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allActions;
    return allActions.filter((action) => {
      return (
        action.title.toLowerCase().includes(q) ||
        action.desc.toLowerCase().includes(q) ||
        action.keywords.toLowerCase().includes(q)
      );
    });
  }, [allActions, query]);

  const quickActions = filteredActions.filter((item) => item.group === "빠른 액션");
  const workspaceActionItems = filteredActions.filter((item) => item.group === "워크스페이스");

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const first = filteredActions[0];
    if (!first) return;
    event.preventDefault();
    first.run();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(100%-2rem,720px)] p-0">
        <DialogHeader className="border-b border-[var(--border)] px-4 py-3">
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>명령 허브</span>
            <span className="ds-type-caption text-[var(--muted-foreground)]">
              <kbd className="rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono">Ctrl/⌘ J</kbd>
            </span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-8 w-8 text-[var(--muted-foreground)]"
            title="명령 허브 닫기"
            aria-label="명령 허브 닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </DialogHeader>

        <Command className="h-[min(70vh,620px)] rounded-none border-0 bg-[var(--muted)]">
          <div className="px-3 pb-2 pt-2">
            <CommandInput
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="액션/워크스페이스 검색..."
              aria-label="명령 허브 검색"
              className="h-[var(--control-height-md)] rounded-sm border border-[var(--border)] bg-[var(--secondary)]"
            />
            <p className="ds-type-caption mt-1 px-1 text-[var(--muted-foreground)]">
              Enter: 첫 항목 실행 · Esc: 닫기
            </p>
          </div>

          <CommandList className="px-2 pb-2">
            {quickActions.length > 0 && (
              <CommandGroup heading="빠른 액션">
                {quickActions.map((action) => (
                  <CommandItem key={action.id} onClick={action.run} className="justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{action.title}</span>
                      <span className="ds-type-caption block truncate text-[var(--muted-foreground)]">{action.desc}</span>
                    </span>
                    {action.shortcut ? (
                      <kbd className="ds-type-caption shrink-0 rounded border border-[var(--border)] bg-[var(--secondary)] px-1.5 py-0.5 font-mono text-[var(--muted-foreground)]">
                        {action.shortcut}
                      </kbd>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {quickActions.length > 0 && workspaceActionItems.length > 0 && <CommandSeparator />}

            {workspaceActionItems.length > 0 && (
              <CommandGroup heading={`워크스페이스 (${workspaces.length}/${MAX_WORKSPACES})`}>
                {workspaceActionItems.map((action) => (
                  <CommandItem key={action.id} onClick={action.run}>
                    <span className="min-w-0">
                      <span className="block truncate">{action.title}</span>
                      <span className="ds-type-caption block truncate text-[var(--muted-foreground)]">{action.desc}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredActions.length === 0 && <CommandEmpty>일치하는 명령이 없습니다.</CommandEmpty>}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
