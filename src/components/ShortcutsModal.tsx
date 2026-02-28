import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUT_GROUPS = [
  {
    title: "차트 조작",
    items: [
      { keys: ["+", "="], desc: "줌 인" },
      { keys: ["-"], desc: "줌 아웃" },
      { keys: ["Home"], desc: "차트 맞춤" },
      { keys: ["←"], desc: "차트 왼쪽 스크롤" },
      { keys: ["→"], desc: "차트 오른쪽 스크롤" },
      { keys: ["R"], desc: "바 리플레이 시작/종료" },
      { keys: ["Space"], desc: "리플레이 재생/일시정지" },
      { keys: ["Delete"], desc: "최근 드로잉 삭제" },
    ],
  },
  {
    title: "화면",
    items: [
      { keys: ["F"], desc: "전체화면 전환" },
      { keys: ["Esc"], desc: "전체화면/패널 닫기" },
    ],
  },
  {
    title: "패널",
    items: [
      { keys: ["Ctrl/⌘", "B"], desc: "관심종목 패널" },
      { keys: ["Ctrl/⌘", ","], desc: "설정 패널" },
      { keys: ["Ctrl/⌘", "K"], desc: "심볼 검색" },
    ],
  },
  {
    title: "도움말",
    items: [
      { keys: ["?"], desc: "단축키 도움말" },
    ],
  },
];

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onShow = () => setOpen(true);
    window.addEventListener("quanting:show-shortcuts", onShow);
    return () => window.removeEventListener("quanting:show-shortcuts", onShow);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(100%-2rem,500px)] p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            키보드 단축키
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-8 w-8 text-[var(--text-secondary)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group, idx) => (
            <div key={group.title}>
              <div
                className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-secondary)" }}
              >
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1">
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                      {item.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i}>
                          <kbd
                            className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px]"
                            style={{
                              background: "var(--bg-tertiary)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {idx < SHORTCUT_GROUPS.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
