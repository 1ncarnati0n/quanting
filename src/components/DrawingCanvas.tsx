import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts";
import { useDrawingStore, type DrawingPoint, type DrawingTool } from "../stores/useDrawingStore";

interface DrawingCanvasProps {
  chart: IChartApi | null;
  mainSeries: ISeriesApi<SeriesType> | null;
}

function uid(): string {
  return `draw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toUnixTime(time: Time | null): number | null {
  if (time === null) return null;
  if (typeof time === "number") return time;
  return null;
}

function toCoord(
  chart: IChartApi | null,
  mainSeries: ISeriesApi<SeriesType> | null,
  point: DrawingPoint,
): { x: number; y: number } | null {
  if (!chart || !mainSeries) return null;
  const x = chart.timeScale().timeToCoordinate(point.time as Time);
  const y = mainSeries.priceToCoordinate(point.price);
  if (x === null || y === null) return null;
  return { x, y };
}

function readPointFromEvent(
  e: MouseEvent<HTMLDivElement>,
  chart: IChartApi | null,
  mainSeries: ISeriesApi<SeriesType> | null,
): DrawingPoint | null {
  if (!chart || !mainSeries) return null;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const time = toUnixTime(chart.timeScale().coordinateToTime(x));
  const price = mainSeries.coordinateToPrice(y);
  if (time === null || price === null) return null;
  return { time, price };
}

function isTwoPointTool(tool: DrawingTool): boolean {
  return (
    tool === "trend" ||
    tool === "fib" ||
    tool === "measure" ||
    tool === "rectangle"
  );
}

export default function DrawingCanvas({ chart, mainSeries }: DrawingCanvasProps) {
  const { activeTool, drawings, addDrawing } = useDrawingStore();
  const [pendingPoints, setPendingPoints] = useState<DrawingPoint[]>([]);
  const [hoverPoint, setHoverPoint] = useState<DrawingPoint | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPendingPoints([]);
    setHoverPoint(null);
  }, [activeTool]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        !!target &&
        (tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable);
      if (isTyping) return;

      if (event.key === "Escape") {
        setPendingPoints([]);
        setHoverPoint(null);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        useDrawingStore.getState().undoLastDrawing();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const pointerEnabled = activeTool !== "none";

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!chart || !mainSeries || activeTool === "none") return;
    const point = readPointFromEvent(e, chart, mainSeries);
    if (!point) return;

    if (activeTool === "horizontal") {
      addDrawing({
        id: uid(),
        type: "horizontal",
        price: point.price,
        color: "#F59E0B",
      });
      return;
    }

    if (activeTool === "text") {
      const textInput = window.prompt("텍스트 주석을 입력하세요", "메모");
      if (textInput === null) return;
      const text = textInput.trim() || "메모";
      addDrawing({
        id: uid(),
        type: "text",
        point,
        text,
        color: "#38BDF8",
      });
      return;
    }

    if (activeTool === "channel") {
      if (pendingPoints.length < 2) {
        setPendingPoints((prev) => [...prev, point]);
        return;
      }
      addDrawing({
        id: uid(),
        type: "channel",
        start: pendingPoints[0],
        end: pendingPoints[1],
        offset: point,
        color: "#34D399",
        fillColor: "rgba(52,211,153,0.12)",
      });
      setPendingPoints([]);
      setHoverPoint(null);
      return;
    }

    if (isTwoPointTool(activeTool)) {
      if (pendingPoints.length === 0) {
        setPendingPoints([point]);
        return;
      }

      const start = pendingPoints[0];
      if (!start) return;

      if (activeTool === "trend") {
        addDrawing({
          id: uid(),
          type: "trend",
          start,
          end: point,
          color: "#22C55E",
        });
      } else if (activeTool === "fib") {
        addDrawing({
          id: uid(),
          type: "fib",
          start,
          end: point,
          color: "#06B6D4",
        });
      } else if (activeTool === "measure") {
        addDrawing({
          id: uid(),
          type: "measure",
          start,
          end: point,
          color: "#A78BFA",
        });
      } else if (activeTool === "rectangle") {
        addDrawing({
          id: uid(),
          type: "rectangle",
          start,
          end: point,
          color: "#F97316",
          fillColor: "rgba(249,115,22,0.12)",
        });
      }

      setPendingPoints([]);
      setHoverPoint(null);
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!chart || !mainSeries || activeTool === "none") return;
    if (pendingPoints.length === 0) return;
    const point = readPointFromEvent(e, chart, mainSeries);
    if (!point) return;
    setHoverPoint(point);
  };

  const guideMessage = useMemo(() => {
    if (activeTool === "none") return "";
    if (activeTool === "horizontal") return "클릭: 수평선 추가";
    if (activeTool === "text") return "클릭: 텍스트 주석 추가";
    if (activeTool === "trend") {
      return pendingPoints.length === 0 ? "1/2 시작점 클릭" : "2/2 끝점 클릭";
    }
    if (activeTool === "fib") {
      return pendingPoints.length === 0 ? "1/2 시작점 클릭" : "2/2 끝점 클릭";
    }
    if (activeTool === "measure") {
      return pendingPoints.length === 0 ? "1/2 시작점 클릭" : "2/2 끝점 클릭";
    }
    if (activeTool === "rectangle") {
      return pendingPoints.length === 0 ? "1/2 첫 모서리 클릭" : "2/2 반대 모서리 클릭";
    }
    if (activeTool === "channel") {
      if (pendingPoints.length === 0) return "1/3 기준선 시작점 클릭";
      if (pendingPoints.length === 1) return "2/3 기준선 끝점 클릭";
      return "3/3 채널 폭(오프셋) 클릭";
    }
    return "";
  }, [activeTool, pendingPoints.length]);

  const svgItems = useMemo(() => {
    if (!chart || !mainSeries || size.width === 0 || size.height === 0) return null;

    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 1];
    const items: ReactNode[] = [];

    drawings.forEach((item) => {
      if (item.type === "horizontal") {
        const y = mainSeries.priceToCoordinate(item.price);
        if (y === null) return;
        items.push(
          <g key={item.id}>
            <line
              x1={0}
              y1={y}
              x2={size.width}
              y2={y}
              stroke={item.color}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={size.width - 4}
              y={y - 3}
              textAnchor="end"
              fill={item.color}
              fontSize={10}
            >
              {item.price.toFixed(4)}
            </text>
          </g>,
        );
        return;
      }

      if (item.type === "text") {
        const coord = toCoord(chart, mainSeries, item.point);
        if (!coord) return;
        const textWidth = Math.max(26, item.text.length * 6 + 8);
        const textHeight = 16;
        items.push(
          <g key={item.id}>
            <rect
              x={coord.x + 6}
              y={coord.y - textHeight}
              rx={4}
              ry={4}
              width={textWidth}
              height={textHeight}
              fill="color-mix(in srgb, var(--bg-primary) 80%, transparent)"
              stroke={item.color}
              strokeWidth={1}
            />
            <text
              x={coord.x + 10}
              y={coord.y - 5}
              fill={item.color}
              fontSize={10}
            >
              {item.text}
            </text>
          </g>,
        );
        return;
      }

      if (item.type === "channel") {
        const start = toCoord(chart, mainSeries, item.start);
        const end = toCoord(chart, mainSeries, item.end);
        const offset = toCoord(chart, mainSeries, item.offset);
        if (!start || !end || !offset) return;

        const dx = offset.x - start.x;
        const dy = offset.y - start.y;
        const start2 = { x: start.x + dx, y: start.y + dy };
        const end2 = { x: end.x + dx, y: end.y + dy };

        items.push(
          <g key={item.id}>
            <polygon
              points={`${start.x},${start.y} ${end.x},${end.y} ${end2.x},${end2.y} ${start2.x},${start2.y}`}
              fill={item.fillColor}
              stroke="none"
            />
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={item.color}
              strokeWidth={2}
            />
            <line
              x1={start2.x}
              y1={start2.y}
              x2={end2.x}
              y2={end2.y}
              stroke={item.color}
              strokeWidth={2}
            />
          </g>,
        );
        return;
      }

      const start = toCoord(chart, mainSeries, item.start);
      const end = toCoord(chart, mainSeries, item.end);
      if (!start || !end) return;

      if (item.type === "trend") {
        items.push(
          <line
            key={item.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={item.color}
            strokeWidth={2}
          />,
        );
        return;
      }

      if (item.type === "rectangle") {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        items.push(
          <rect
            key={item.id}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={item.fillColor}
            stroke={item.color}
            strokeWidth={1.5}
          />,
        );
        return;
      }

      if (item.type === "fib") {
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const high = Math.max(item.start.price, item.end.price);
        const low = Math.min(item.start.price, item.end.price);

        items.push(
          <line
            key={`${item.id}-base`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={item.color}
            strokeWidth={1}
            strokeDasharray="3 3"
          />,
        );

        fibLevels.forEach((level) => {
          const levelPrice = high - (high - low) * level;
          const y = mainSeries.priceToCoordinate(levelPrice);
          if (y === null) return;
          items.push(
            <g key={`${item.id}-fib-${level}`}>
              <line
                x1={minX}
                y1={y}
                x2={maxX}
                y2={y}
                stroke={item.color}
                strokeWidth={1}
              />
              <text x={maxX + 3} y={y - 2} fill={item.color} fontSize={9}>
                {(level * 100).toFixed(1)}%
              </text>
            </g>,
          );
        });
        return;
      }

      if (item.type === "measure") {
        const diff = item.end.price - item.start.price;
        const pct = Math.abs(item.start.price) > Number.EPSILON ? (diff / item.start.price) * 100 : 0;
        const bars = Math.round(Math.abs(item.end.time - item.start.time));
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        items.push(
          <g key={item.id}>
            <line
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={item.color}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            <text x={mx + 4} y={my - 6} fill={item.color} fontSize={10}>
              {diff >= 0 ? "+" : ""}
              {diff.toFixed(4)} ({pct.toFixed(2)}%) · {bars} bars
            </text>
          </g>,
        );
      }
    });

    pendingPoints.forEach((point, index) => {
      const coord = toCoord(chart, mainSeries, point);
      if (!coord) return;
      items.push(
        <circle
          key={`pending-point-${index}`}
          cx={coord.x}
          cy={coord.y}
          r={4}
          fill="var(--accent-primary)"
        />,
      );
    });

    if (hoverPoint && pendingPoints.length > 0) {
      const start = toCoord(chart, mainSeries, pendingPoints[0]);
      const hover = toCoord(chart, mainSeries, hoverPoint);
      if (start && hover && isTwoPointTool(activeTool)) {
        if (activeTool === "rectangle") {
          items.push(
            <rect
              key="pending-rect"
              x={Math.min(start.x, hover.x)}
              y={Math.min(start.y, hover.y)}
              width={Math.abs(hover.x - start.x)}
              height={Math.abs(hover.y - start.y)}
              fill="rgba(249,115,22,0.08)"
              stroke="#F97316"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />,
          );
        } else {
          items.push(
            <line
              key="pending-line"
              x1={start.x}
              y1={start.y}
              x2={hover.x}
              y2={hover.y}
              stroke="var(--accent-primary)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />,
          );
        }
      }

      if (activeTool === "channel" && pendingPoints.length === 2) {
        const p0 = toCoord(chart, mainSeries, pendingPoints[0]);
        const p1 = toCoord(chart, mainSeries, pendingPoints[1]);
        if (p0 && p1 && hover) {
          const dx = hover.x - p0.x;
          const dy = hover.y - p0.y;
          const p0b = { x: p0.x + dx, y: p0.y + dy };
          const p1b = { x: p1.x + dx, y: p1.y + dy };
          items.push(
            <g key="pending-channel">
              <polygon
                points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p1b.x},${p1b.y} ${p0b.x},${p0b.y}`}
                fill="rgba(52,211,153,0.08)"
              />
              <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#34D399" strokeWidth={1.5} strokeDasharray="4 3" />
              <line x1={p0b.x} y1={p0b.y} x2={p1b.x} y2={p1b.y} stroke="#34D399" strokeWidth={1.5} strokeDasharray="4 3" />
            </g>,
          );
        }
      }
    }

    return items;
  }, [activeTool, chart, drawings, hoverPoint, mainSeries, pendingPoints, size.height, size.width]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[7]"
      style={{ pointerEvents: pointerEnabled ? "auto" : "none" }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverPoint(null)}
    >
      {guideMessage && (
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-[9] -translate-x-1/2 rounded px-2 py-1 text-[10px] font-medium"
          style={{
            background: "color-mix(in srgb, var(--bg-primary) 84%, transparent)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            backdropFilter: "blur(4px)",
          }}
        >
          {guideMessage} · Esc 취소
        </div>
      )}
      <svg width={size.width} height={size.height} className="h-full w-full overflow-visible">
        {svgItems}
      </svg>
    </div>
  );
}
