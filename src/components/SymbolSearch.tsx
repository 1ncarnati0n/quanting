import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { PRESET_CATEGORIES, getSymbolLabel, detectMarket } from "../utils/constants";

export default function SymbolSearch() {
  const { symbol, market, setSymbol } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [manualInput, setManualInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setFilter("");
      setManualInput("");
    }
  }, [isOpen]);

  useEffect(() => {
    const openFromShortcut = () => setIsOpen(true);
    window.addEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
    return () =>
      window.removeEventListener("quanting:open-symbol-search", openFromShortcut as EventListener);
  }, []);

  const displayLabel = getSymbolLabel(symbol);
  const lowerFilter = filter.toLowerCase();

  const filteredCategories = PRESET_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(lowerFilter) ||
        item.label.toLowerCase().includes(lowerFilter),
    ),
  })).filter((cat) => cat.items.length > 0);

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim().toUpperCase();
    if (trimmed) {
      setSymbol(trimmed, detectMarket(trimmed));
      setIsOpen(false);
    }
  };

  const handleManualKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleManualSubmit();
    if (e.key === "Escape") setIsOpen(false);
  };

  const marketBadge = market === "crypto" ? "코인" : market === "krStock" ? "KR" : "US";
  const badgeColor = market === "crypto" ? "var(--warning-color)" : market === "krStock" ? "#EC4899" : "var(--accent-primary)";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex max-w-[11.5rem] min-w-0 items-center gap-2 rounded px-2.5 py-1.5 text-sm font-mono transition-colors xl:max-w-[15rem] 2xl:max-w-[20rem]"
        title="심볼 검색 열기 (Ctrl/Cmd+K)"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: badgeColor, color: "var(--accent-contrast)" }}
        >
          {marketBadge}
        </span>
        <span className="truncate">{displayLabel ? `${symbol} · ${displayLabel}` : symbol}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg shadow-xl"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--panel-shadow)",
          }}
        >
          {/* Search Filter */}
          <div className="p-2" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
              placeholder="심볼 검색..."
              spellCheck={false}
              className="w-full rounded px-3 py-1.5 text-sm outline-none"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            />
          </div>

          {/* Preset List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredCategories.map((cat) => (
              <div key={cat.name}>
                <div
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)", background: "var(--bg-primary)" }}
                >
                  {cat.name}
                </div>
                {cat.items.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      setSymbol(item.symbol, item.market);
                      setIsOpen(false);
                    }}
                    className="dropdown-item flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors"
                    style={{
                      background:
                        symbol === item.symbol
                          ? "var(--bg-tertiary)"
                          : "transparent",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span className="font-mono text-xs" style={{ color: "var(--text-secondary)", minWidth: "80px" }}>
                      {item.symbol}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="px-3 py-4 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                검색 결과가 없습니다
              </div>
            )}
          </div>

          {/* Manual Input */}
          <div
            className="flex gap-1 p-2"
            style={{ borderTop: "1px solid var(--border-color)" }}
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={handleManualKeyDown}
              placeholder="티커 직접 입력..."
              spellCheck={false}
              className="flex-1 rounded px-2 py-1 text-xs font-mono outline-none"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-color)",
              }}
            />
            <button
              onClick={handleManualSubmit}
              className="rounded px-2 py-1 text-xs font-medium"
              style={{ background: "var(--accent-primary)", color: "var(--accent-contrast)" }}
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
