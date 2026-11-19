'use client';

import React from 'react';
import { FeedHistoryPoint } from '@/types/schemas';

interface FeedSparklineProps {
  points: FeedHistoryPoint[] | undefined;
  metric?: 'latencyMs' | 'itemCount';
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function FeedSparkline({
  points,
  metric = 'latencyMs',
  width = 84,
  height = 22,
  strokeColor = '#38BDF8',
}: FeedSparklineProps) {
  const safePoints = points && points.length > 0 ? points : [];
  if (safePoints.length === 0) {
    return (
      <span className="font-mono-tactical text-[10px] text-gray-500">
        No history
      </span>
    );
  }

  // If only 1 sample exists yet, duplicate horizontally so a flat baseline renders cleanly
  const values =
    safePoints.length === 1
      ? [safePoints[0][metric], safePoints[0][metric]]
      : safePoints.map((p) => p[metric]);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padX = 2;
  const padY = 3;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = values.map((v, idx) => {
    const x = padX + (idx / Math.max(1, values.length - 1)) * innerW;
    const norm = max === min ? 0.5 : (v - min) / span;
    const y = padY + (1 - norm) * innerH;
    return { x, y };
  });

  const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={`Rolling ${safePoints.length}-sweep ${metric} sparkline`}
      className="overflow-visible shrink-0"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
      {last && (
        <circle
          cx={last.x}
          cy={last.y}
          r="2.2"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
