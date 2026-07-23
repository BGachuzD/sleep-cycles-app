import { FC } from 'react';
import Svg, { Polyline } from 'react-native-svg';

// ─────────────────────────────────────────────
// Sparkline: polyline SVG con puntos
// ─────────────────────────────────────────────
export const Sparkline: FC<{
  values: number[];
  width: number;
  height: number;
  color: string;
  fillColor?: string;
}> = ({ values, width, height, color, fillColor }) => {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const padding = 3;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const points = values
    .map((v, i) => {
      const x =
        padding +
        (values.length === 1
          ? usableW / 2
          : (i / (values.length - 1)) * usableW);
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      {fillColor && (
        <Polyline
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill={fillColor}
          stroke="none"
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};
