import React from 'react';
import { useTheme } from '@mui/material';
import { palette, chartSeries, FONT_BODY } from '../../theme/muiTheme';

/**
 * Recharts reads plain colour strings, not CSS variables, so the chart palette
 * is resolved from the active MUI mode here and passed down explicitly. That
 * keeps the graphs legible in both light and dark without a reload.
 */
export const useChartTheme = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const ramp = isDark ? palette.dark : palette.light;

  return {
    isDark,
    series: chartSeries,
    grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,20,14,0.08)',
    axis: ramp.text3,
    text: ramp.text,
    surface: ramp.surface,
    line: ramp.lineStrong,
    revenue: isDark ? palette.emberSoft : palette.ember,
    orders: isDark ? palette.basilSoft : palette.basil,
    gst: palette.saffron,
    tick: { fill: ramp.text3, fontSize: 11, fontFamily: FONT_BODY },
  };
};

/** Tooltip styled like the rest of the surfaces, in both modes. */
export const ChartTooltip = ({ active, payload, label, formatter }) => {
  const c = useChartTheme();
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.line}`,
        borderRadius: 12,
        padding: '10px 12px',
        fontFamily: FONT_BODY,
        fontSize: 12.5,
        color: c.text,
        boxShadow: '0 16px 36px -22px rgba(0,0,0,.6)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span
            style={{ width: 8, height: 8, borderRadius: 99, background: entry.color, flex: 'none' }}
          />
          <span style={{ color: c.axis }}>{entry.name}</span>
          <b style={{ marginLeft: 'auto' }}>
            {formatter ? formatter(entry.value, entry) : entry.value}
          </b>
        </div>
      ))}
    </div>
  );
};

export default useChartTheme;
