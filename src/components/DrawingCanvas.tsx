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
    tool === "rectangle" ||
    tool === "gann"
  );
}

function makeInfiniteLine(
  point: { x: number; y: number },
  direction: { x: number; y: number },
  span = 5000,
) {
  const length = Math.hypot(direction.x, direction.y);
  if (length < 0.0001) return null;
  const nx = direction.x / length;
  const ny = direction.y / length;
  return {
    x1: point.x - nx * span,
    y1: point.y - ny * span,
    x2: point.x + nx * span,
    y2: point.y + ny * span,
  };
}

export default function DrawingCanvas({ chart, mainSeries }: DrawingCanvasProps) {
  const { activeTool, drawings, addDrawing, selectedDrawingId } = useDrawingStore();
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
        const state = useDrawingStore.getState();
        if (state.selectedDrawingId) {
          state.removeDrawing(state.selectedDrawingId);
        } else {
          state.undoLastDrawing();
        }
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
      const [start, end] = pendingPoints;
      if (!start || !end) return;
      addDrawing({
        id: uid(),
        type: "channel",
        start,
        end,
        offset: point,
        color: "#34D399",
        fillColor: "rgba(52,211,153,0.12)",
      });
      setPendingPoints([]);
      setHoverPoint(null);
      return;
    }

    if (activeTool === "pitchfork") {
      if (pendingPoints.length < 2) {
        setPendingPoints((prev) => [...prev, point]);
        return;
      }
      const [a, b] = pendingPoints;
      if (!a || !b) return;
      addDrawing({
        id: uid(),
        type: "pitchfork",
        a,
        b,
        c: point,
        color: "#0EA5E9",
        fillColor: "rgba(14,165,233,0.10)",
      });
      setPendingPoints([]);
      setHoverPoint(null);
      return;
    }

    if (activeTool === "elliott") {
      if (pendingPoints.length < 4) {
        setPendingPoints((prev) => [...prev, point]);
        return;
      }
      const [p1, p2, p3, p4] = pendingPoints;
      if (!p1 || !p2 || !p3 || !p4) return;
      addDrawing({
        id: uid(),
        type: "elliott",
        points: [p1, p2, p3, p4, point],
        color: "#A855F7",
      });
      setPendingPoints([]);
      setHoverPoint(null);
      return;
    }

    if (activeTool === "harmonic") {
      if (pendingPoints.length < 4) {
        setPendingPoints((prev) => [...prev, point]);
        return;
      }
      const [x, a, b, c] = pendingPoints;
      if (!x || !a || !b || !c) return;
      addDrawing({
        id: uid(),
        type: "harmonic",
        x,
        a,
        b,
        c,
        d: point,
        color: "#F43F5E",
        fillColor: "rgba(244,63,94,0.10)",
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
      } else if (activeTool === "gann") {
        addDrawing({
          id: uid(),
          type: "gann",
          start,
          end: point,
          color: "#3B82F6",
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
    if (activeTool === "gann") {
      return pendingPoints.length === 0 ? "1/2 기준점 클릭" : "2/2 방향점 클릭";
    }
    if (activeTool === "channel") {
      if (pendingPoints.length === 0) return "1/3 기준선 시작점 클릭";
      if (pendingPoints.length === 1) return "2/3 기준선 끝점 클릭";
      return "3/3 채널 폭(오프셋) 클릭";
    }
    if (activeTool === "pitchfork") {
      if (pendingPoints.length === 0) return "1/3 A(꼭지) 클릭";
      if (pendingPoints.length === 1) return "2/3 B 클릭";
      return "3/3 C 클릭";
    }
    if (activeTool === "elliott") {
      return `${Math.min(pendingPoints.length + 1, 5)}/5 파동 점 클릭`;
    }
    if (activeTool === "harmonic") {
      const labels = ["X", "A", "B", "C", "D"];
      const next = Math.min(pendingPoints.length, labels.length - 1);
      return `${Math.min(pendingPoints.length + 1, 5)}/5 ${labels[next]} 포인트 클릭`;
    }
    return "";
  }, [activeTool, pendingPoints.length]);

  const svgItems = useMemo(() => {
    if (!chart || !mainSeries || size.width === 0 || size.height === 0) return null;

    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 1];
    const elliottLabels = ["1", "2", "3", "4", "5"];
    const harmonicLabels = ["X", "A", "B", "C", "D"];
    const items: ReactNode[] = [];
    const isSelected = (id: string) => selectedDrawingId === id;
    const selectedStroke = (id: string, base: number) => (isSelected(id) ? base + 0.8 : base);
    const selectedGlow = (id: string) =>
      isSelected(id) ? "drop-shadow(0 0 3px rgba(59,130,246,0.75))" : undefined;

    const pushPitchfork = (
      key: string,
      a: { x: number; y: number },
      b: { x: number; y: number },
      c: { x: number; y: number },
      color: string,
      fillColor: string,
      dashed = false,
      selected = false,
    ) => {
      const mid = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 };
      const direction = { x: mid.x - a.x, y: mid.y - a.y };
      const median = makeInfiniteLine(a, direction);
      const upper = makeInfiniteLine(b, direction);
      const lower = makeInfiniteLine(c, direction);
      if (!median || !upper || !lower) return;

      const bForward = { x: b.x + direction.x, y: b.y + direction.y };
      const cForward = { x: c.x + direction.x, y: c.y + direction.y };
      const dash = dashed ? "4 3" : undefined;

      items.push(
        <g key={key} style={selected ? { filter: "drop-shadow(0 0 3px rgba(59,130,246,0.75))" } : undefined}>
          <polygon
            points={`${b.x},${b.y} ${c.x},${c.y} ${cForward.x},${cForward.y} ${bForward.x},${bForward.y}`}
            fill={fillColor}
            stroke="none"
          />
          <line x1={median.x1} y1={median.y1} x2={median.x2} y2={median.y2} stroke={color} strokeWidth={selected ? 2.3 : 1.5} strokeDasharray={dash} />
          <line x1={upper.x1} y1={upper.y1} x2={upper.x2} y2={upper.y2} stroke={color} strokeWidth={selected ? 2.3 : 1.5} strokeDasharray={dash} />
          <line x1={lower.x1} y1={lower.y1} x2={lower.x2} y2={lower.y2} stroke={color} strokeWidth={selected ? 2.3 : 1.5} strokeDasharray={dash} />
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={selected ? 1.7 : 1} strokeDasharray={dash} />
          <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={color} strokeWidth={selected ? 1.7 : 1} strokeDasharray={dash} />
        </g>,
      );
    };

    const pushGannFan = (
      key: string,
      start: { x: number; y: number },
      end: { x: number; y: number },
      color: string,
      dashed = false,
      selected = false,
    ) => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return;
      const ratios = [0.25, 0.5, 1, 2, 3, 4, 8];
      const dash = dashed ? "4 3" : undefined;

      items.push(
        <circle
          key={`${key}-origin`}
          cx={start.x}
          cy={start.y}
          r={selected ? 4 : 3}
          fill={color}
          style={selected ? { filter: "drop-shadow(0 0 3px rgba(59,130,246,0.75))" } : undefined}
        />,
      );

      if (Math.abs(dx) < 0.0001) {
        const dirY = dy >= 0 ? 1 : -1;
        ratios.forEach((ratio, index) => {
          const spread = (index - (ratios.length - 1) / 2) * 16;
          const x2 = start.x + spread;
          const y2 = start.y + dirY * (1200 + ratio * 180);
          items.push(
            <line
              key={`${key}-ray-${ratio}`}
              x1={start.x}
              y1={start.y}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={ratio === 1 ? (selected ? 2.4 : 1.8) : selected ? 1.6 : 1}
              strokeDasharray={dash}
              opacity={ratio === 1 ? 1 : 0.72}
              style={selected ? { filter: "drop-shadow(0 0 3px rgba(59,130,246,0.75))" } : undefined}
            />,
          );
        });
        return;
      }

      const slope = dy / dx;
      const signX = dx >= 0 ? 1 : -1;
      const edgeX = signX > 0 ? size.width + 120 : -120;
      const deltaX = edgeX - start.x;
      ratios.forEach((ratio) => {
        const y2 = start.y + slope * ratio * deltaX;
        items.push(
          <line
            key={`${key}-ray-${ratio}`}
            x1={start.x}
            y1={start.y}
            x2={edgeX}
            y2={y2}
            stroke={color}
            strokeWidth={ratio === 1 ? (selected ? 2.4 : 1.8) : selected ? 1.6 : 1}
            strokeDasharray={dash}
            opacity={ratio === 1 ? 1 : 0.72}
            style={selected ? { filter: "drop-shadow(0 0 3px rgba(59,130,246,0.75))" } : undefined}
          />,
        );
      });
    };

    const pushLabeledPath = (
      key: string,
      coords: Array<{ x: number; y: number }>,
      labels: string[],
      color: string,
      options?: { fillColor?: string; dashed?: boolean; selected?: boolean },
    ) => {
      if (coords.length < 2) return;
      const dash = options?.dashed ? "4 3" : undefined;
      const fillColor = options?.fillColor;
      const selected = options?.selected ?? false;

      items.push(
        <g key={key} style={selected ? { filter: "drop-shadow(0 0 3px rgba(59,130,246,0.75))" } : undefined}>
          {fillColor && coords.length >= 3 && (
            <polygon
              points={coords.map((point) => `${point.x},${point.y}`).join(" ")}
              fill={fillColor}
              stroke="none"
            />
          )}
          <polyline
            points={coords.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={selected ? 2.4 : 1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={dash}
          />
          {coords.map((point, index) => (
            <g key={`${key}-label-${index}`}>
              <circle cx={point.x} cy={point.y} r={selected ? 3.4 : 2.8} fill={color} />
              <text x={point.x + 5} y={point.y - 6} fill={color} fontSize={9}>
                {labels[index] ?? ""}
              </text>
            </g>
          ))}
        </g>,
      );
    };

    drawings.forEach((item) => {
      switch (item.type) {
        case "horizontal": {
          const y = mainSeries.priceToCoordinate(item.price);
          if (y === null) return;
          items.push(
            <g key={item.id} style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}>
              <line
                x1={0}
                y1={y}
                x2={size.width}
                y2={y}
                stroke={item.color}
                strokeWidth={selectedStroke(item.id, 1)}
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
        case "text": {
          const coord = toCoord(chart, mainSeries, item.point);
          if (!coord) return;
          const textWidth = Math.max(26, item.text.length * 6 + 8);
          const textHeight = 16;
          items.push(
            <g key={item.id} style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}>
              <rect
                x={coord.x + 6}
                y={coord.y - textHeight}
                rx={4}
                ry={4}
                width={textWidth}
                height={textHeight}
                fill="color-mix(in srgb, var(--background) 80%, transparent)"
                stroke={item.color}
                strokeWidth={selectedStroke(item.id, 1)}
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
        case "channel": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          const offset = toCoord(chart, mainSeries, item.offset);
          if (!start || !end || !offset) return;

          const dx = offset.x - start.x;
          const dy = offset.y - start.y;
          const start2 = { x: start.x + dx, y: start.y + dy };
          const end2 = { x: end.x + dx, y: end.y + dy };

          items.push(
            <g key={item.id} style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}>
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
                strokeWidth={selectedStroke(item.id, 2)}
              />
              <line
                x1={start2.x}
                y1={start2.y}
                x2={end2.x}
                y2={end2.y}
                stroke={item.color}
                strokeWidth={selectedStroke(item.id, 2)}
              />
            </g>,
          );
          return;
        }
        case "pitchfork": {
          const a = toCoord(chart, mainSeries, item.a);
          const b = toCoord(chart, mainSeries, item.b);
          const c = toCoord(chart, mainSeries, item.c);
          if (!a || !b || !c) return;
          pushPitchfork(item.id, a, b, c, item.color, item.fillColor, false, isSelected(item.id));
          return;
        }
        case "gann": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          if (!start || !end) return;
          pushGannFan(item.id, start, end, item.color, false, isSelected(item.id));
          return;
        }
        case "elliott": {
          const coords = item.points
            .map((point) => toCoord(chart, mainSeries, point))
            .filter((point): point is { x: number; y: number } => point !== null);
          if (coords.length !== item.points.length) return;
          pushLabeledPath(item.id, coords, elliottLabels, item.color, { selected: isSelected(item.id) });
          return;
        }
        case "harmonic": {
          const coords = [item.x, item.a, item.b, item.c, item.d]
            .map((point) => toCoord(chart, mainSeries, point))
            .filter((point): point is { x: number; y: number } => point !== null);
          if (coords.length !== 5) return;
          pushLabeledPath(item.id, coords, harmonicLabels, item.color, {
            fillColor: item.fillColor,
            selected: isSelected(item.id),
          });
          return;
        }
        case "trend": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          if (!start || !end) return;
          items.push(
            <line
              key={item.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={item.color}
              strokeWidth={selectedStroke(item.id, 2)}
              style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}
            />,
          );
          return;
        }
        case "rectangle": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          if (!start || !end) return;
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
              strokeWidth={selectedStroke(item.id, 1.5)}
              style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}
            />,
          );
          return;
        }
        case "fib": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          if (!start || !end) return;
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
              strokeWidth={selectedStroke(item.id, 1)}
              strokeDasharray="3 3"
              style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}
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
                  strokeWidth={selectedStroke(item.id, 1)}
                  style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}
                />
                <text x={maxX + 3} y={y - 2} fill={item.color} fontSize={9}>
                  {(level * 100).toFixed(1)}%
                </text>
              </g>,
            );
          });
          return;
        }
        case "measure": {
          const start = toCoord(chart, mainSeries, item.start);
          const end = toCoord(chart, mainSeries, item.end);
          if (!start || !end) return;
          const diff = item.end.price - item.start.price;
          const pct = Math.abs(item.start.price) > Number.EPSILON ? (diff / item.start.price) * 100 : 0;
          const bars = Math.round(Math.abs(item.end.time - item.start.time));
          const mx = (start.x + end.x) / 2;
          const my = (start.y + end.y) / 2;
          items.push(
            <g key={item.id} style={isSelected(item.id) ? { filter: selectedGlow(item.id) } : undefined}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={item.color}
                strokeWidth={selectedStroke(item.id, 2)}
                strokeDasharray="4 2"
              />
              <text x={mx + 4} y={my - 6} fill={item.color} fontSize={10}>
                {diff >= 0 ? "+" : ""}
                {diff.toFixed(4)} ({pct.toFixed(2)}%) · {bars} bars
              </text>
            </g>,
          );
          return;
        }
        default:
          return;
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
          fill="var(--primary)"
        />,
      );
    });

    if (hoverPoint && pendingPoints.length > 0) {
      const hover = toCoord(chart, mainSeries, hoverPoint);
      if (!hover) return items;

      const firstPending = pendingPoints[0];
      const start = firstPending ? toCoord(chart, mainSeries, firstPending) : null;
      if (start && isTwoPointTool(activeTool)) {
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
        } else if (activeTool === "gann") {
          pushGannFan("pending-gann", start, hover, "#3B82F6", true);
        } else {
          items.push(
            <line
              key="pending-line"
              x1={start.x}
              y1={start.y}
              x2={hover.x}
              y2={hover.y}
              stroke="var(--primary)"
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

      if (activeTool === "pitchfork") {
        if (pendingPoints.length === 1) {
          const a = toCoord(chart, mainSeries, pendingPoints[0]);
          if (a) {
            items.push(
              <line
                key="pending-pitchfork-line"
                x1={a.x}
                y1={a.y}
                x2={hover.x}
                y2={hover.y}
                stroke="#0EA5E9"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />,
            );
          }
        } else if (pendingPoints.length === 2) {
          const a = toCoord(chart, mainSeries, pendingPoints[0]);
          const b = toCoord(chart, mainSeries, pendingPoints[1]);
          if (a && b) {
            pushPitchfork("pending-pitchfork", a, b, hover, "#0EA5E9", "rgba(14,165,233,0.08)", true);
          }
        }
      }

      if ((activeTool === "elliott" || activeTool === "harmonic") && pendingPoints.length < 5) {
        const pointsWithIndex = [...pendingPoints, hoverPoint]
          .map((point, index) => ({
            coord: toCoord(chart, mainSeries, point),
            index,
          }))
          .filter((entry): entry is { coord: { x: number; y: number }; index: number } => entry.coord !== null);

        if (pointsWithIndex.length >= 2) {
          const coords = pointsWithIndex.map((entry) => entry.coord);
          const labels = (activeTool === "elliott" ? elliottLabels : harmonicLabels)
            .slice(0, Math.max(2, pendingPoints.length + 1));
          if (activeTool === "harmonic") {
            pushLabeledPath("pending-harmonic", coords, labels, "#F43F5E", {
              fillColor: "rgba(244,63,94,0.08)",
              dashed: true,
            });
          } else {
            pushLabeledPath("pending-elliott", coords, labels, "#A855F7", {
              dashed: true,
            });
          }
        }
      }
    }

    return items;
  }, [activeTool, chart, drawings, hoverPoint, mainSeries, pendingPoints, selectedDrawingId, size.height, size.width]);

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
            background: "color-mix(in srgb, var(--background) 84%, transparent)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
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
