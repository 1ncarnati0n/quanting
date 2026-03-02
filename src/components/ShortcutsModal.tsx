import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SHORTCUT_HELP_GROUPS } from "../utils/shortcuts";

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onShow = () => setOpen(true);
    window.addEventListener("quanting:show-shortcuts", onShow);
    return () => window.removeEventListener("quanting:show-shortcuts", onShow);
  }, []);

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
            className="h-8 w-8 text-[var(--muted-foreground)]"
            title="단축키 도움말 닫기"
            aria-label="단축키 도움말 닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {SHORTCUT_HELP_GROUPS.map((group, idx) => (
            <div key={group.title}>
              <div
                className="ds-type-caption mb-2 font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1">
                    <span className="ds-type-label" style={{ color: "var(--foreground)" }}>
                      {item.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i}>
                          <kbd
                            className="ds-type-caption inline-block rounded px-1.5 py-0.5 font-mono"
                            style={{
                              background: "var(--secondary)",
                              border: "1px solid var(--border)",
                              color: "var(--foreground)",
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
              {idx < SHORTCUT_HELP_GROUPS.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
