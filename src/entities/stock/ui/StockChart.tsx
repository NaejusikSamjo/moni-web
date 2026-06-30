"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType } from "lightweight-charts";
import type { UTCTimestamp } from "lightweight-charts";
import type { CandleData } from "@/entities/stock/model/types";
import styles from "./StockChart.module.css";

interface Props {
  candles: CandleData[];
  loading?: boolean;
}

function toTimestamp(timeStr: string): UTCTimestamp {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  return Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0).getTime() / 1000
  ) as UTCTimestamp;
}

export function StockChart({ candles, loading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (loading || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#999",
        fontSize: 11,
      },
      width: containerRef.current.clientWidth,
      height: 220,
      grid: {
        vertLines: { color: "#f2f2f2" },
        horzLines: { color: "#f2f2f2" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      localization: {
        timeFormatter: (time: UTCTimestamp) => {
          const d = new Date(time * 1000);
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const d = new Date(time * 1000);
          return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3b82f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3b82f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3b82f6",
    });

    const data = candles
      .map((c) => ({
        time: toTimestamp(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
      .sort((a, b) => a.time - b.time);

    series.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [candles, loading]);

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  if (candles.length === 0) {
    return (
      <div className={styles.empty}>
        <p>차트 데이터가 없습니다</p>
      </div>
    );
  }

  return <div ref={containerRef} className={styles.chart} />;
}
