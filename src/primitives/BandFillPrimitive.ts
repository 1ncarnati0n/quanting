import type {
  ISeriesPrimitive,
  SeriesAttachedParameter,
  ISeriesApi,
  IChartApiBase,
  Time,
  SeriesType,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  PrimitivePaneViewZOrder,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";

export interface BandFillPoint {
  time: Time;
  upper: number;
  lower: number;
}

class BandFillRenderer implements IPrimitivePaneRenderer {
  private _data: BandFillPoint[];
  private _fillColor: string;
  private _series: ISeriesApi<SeriesType>;
  private _chart: IChartApiBase<Time>;

  constructor(
    data: BandFillPoint[],
    fillColor: string,
    series: ISeriesApi<SeriesType>,
    chart: IChartApiBase<Time>,
  ) {
    this._data = data;
    this._fillColor = fillColor;
    this._series = series;
    this._chart = chart;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      if (this._data.length === 0) return;

      const timeScale = this._chart.timeScale();
      const upperPoints: { x: number; y: number }[] = [];
      const lowerPoints: { x: number; y: number }[] = [];

      for (const point of this._data) {
        const x = timeScale.timeToCoordinate(point.time);
        if (x === null) continue;
        const yUpper = this._series.priceToCoordinate(point.upper);
        const yLower = this._series.priceToCoordinate(point.lower);
        if (yUpper === null || yLower === null) continue;
        upperPoints.push({ x, y: yUpper });
        lowerPoints.push({ x, y: yLower });
      }

      if (upperPoints.length < 2) return;

      ctx.beginPath();
      // Upper band: left to right
      ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
      for (let i = 1; i < upperPoints.length; i++) {
        ctx.lineTo(upperPoints[i].x, upperPoints[i].y);
      }
      // Lower band: right to left
      for (let i = lowerPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = this._fillColor;
      ctx.fill();
    });
  }
}

class BandFillPaneView implements IPrimitivePaneView {
  private _primitive: BandFillPrimitive;

  constructor(primitive: BandFillPrimitive) {
    this._primitive = primitive;
  }

  zOrder(): PrimitivePaneViewZOrder {
    return "bottom";
  }

  renderer(): IPrimitivePaneRenderer | null {
    const { series, chart, data, fillColor } = this._primitive._getState();
    if (!series || !chart || data.length === 0) return null;
    return new BandFillRenderer(data, fillColor, series, chart);
  }
}

export class BandFillPrimitive implements ISeriesPrimitive<Time> {
  private _data: BandFillPoint[] = [];
  private _fillColor: string;
  private _series: ISeriesApi<SeriesType> | null = null;
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _paneViews: readonly IPrimitivePaneView[];

  constructor(fillColor: string) {
    this._fillColor = fillColor;
    this._paneViews = [new BandFillPaneView(this)];
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time, SeriesType>): void {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
  }

  detached(): void {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this._paneViews;
  }

  updateAllViews(): void {
    // no-op: renderer recalculates coordinates each frame
  }

  setData(data: BandFillPoint[]): void {
    this._data = data;
    this._requestUpdate?.();
  }

  updateStyle(fillColor: string): void {
    this._fillColor = fillColor;
    this._requestUpdate?.();
  }

  /** @internal Used by BandFillPaneView */
  _getState() {
    return {
      series: this._series,
      chart: this._chart,
      data: this._data,
      fillColor: this._fillColor,
    };
  }
}
