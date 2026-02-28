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

  const marketBadge = market === "crypto" ? "CRYPTO" : market === "krStock" ? "KR" : "US";
  const badgeColor = market === "crypto" ? "#F59E0B" : market === "krStock" ? "#EC4899" : "#2563EB";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-mono transition-colors"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ background: badgeColor, color: "#fff" }}
        >
          {marketBadge}
        </span>
        <span>{displayLabel ? `${symbol} · ${displayLabel}` : symbol}</span>
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
          className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg shadow-xl"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
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
              placeholder="Search symbols..."
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
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:brightness-125"
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
                No matching symbols
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
              placeholder="Enter ticker..."
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
              className="rounded px-2 py-1 text-xs font-medium text-white"
              style={{ background: "#2563EB" }}
            >
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
